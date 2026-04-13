import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY environment variable is not set');
      return jsonResponse({ error: 'Stripe is not configured. Missing STRIPE_SECRET_KEY.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const userId = user.id;

    const body = await req.json();
    const { plan_id, billing_cycle } = body;

    if (!plan_id || !billing_cycle) {
      return jsonResponse({ error: 'Missing required fields: plan_id, billing_cycle' }, 400);
    }

    if (billing_cycle !== 'monthly' && billing_cycle !== 'yearly') {
      return jsonResponse({ error: 'billing_cycle must be "monthly" or "yearly"' }, 400);
    }

    // Look up provider profile
    const { data: provider, error: providerError } = await supabase
      .from('provider_profiles')
      .select('id, business_name, user_id')
      .eq('user_id', userId)
      .single();

    if (providerError || !provider) {
      return jsonResponse({ error: 'Provider profile not found' }, 404);
    }

    // Fetch plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return jsonResponse({ error: 'Plan not found or inactive' }, 404);
    }

    // Get the correct Stripe price ID
    const priceId = billing_cycle === 'yearly'
      ? plan.stripe_yearly_price_id
      : plan.stripe_monthly_price_id;

    if (!priceId) {
      return jsonResponse({ error: `No Stripe price configured for ${billing_cycle} billing` }, 400);
    }

    // Check for existing Stripe customer
    let stripeCustomerId: string | null = null;
    const { data: existingSub } = await supabase
      .from('provider_subscriptions')
      .select('stripe_customer_id')
      .eq('provider_id', provider.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id;
    }

    // Create or reuse Stripe customer
    if (!stripeCustomerId) {
      const customerRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'metadata[provider_id]': provider.id,
          'metadata[user_id]': userId,
          'name': provider.business_name,
        }),
      });

      if (!customerRes.ok) {
        const errText = await customerRes.text();
        console.error('Stripe customer creation failed:', errText);
        let errMsg = 'Failed to create Stripe customer';
        try {
          const errJson = JSON.parse(errText);
          if (errJson?.error?.message) errMsg = errJson.error.message;
        } catch {}
        return jsonResponse({ error: errMsg }, 500);
      }

      const customer = await customerRes.json();
      stripeCustomerId = customer.id;
    }

    // Create Checkout Session
    const sessionParams = new URLSearchParams({
      customer: stripeCustomerId,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: 'discounty://subscription-success',
      cancel_url: 'discounty://subscription-cancel',
      'metadata[provider_id]': provider.id,
      'metadata[plan_id]': plan_id,
      'metadata[billing_cycle]': billing_cycle,
      'subscription_data[metadata][provider_id]': provider.id,
      'subscription_data[metadata][plan_id]': plan_id,
      'subscription_data[metadata][billing_cycle]': billing_cycle,
    });

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sessionParams,
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      console.error('Stripe checkout session creation failed:', errText);
      let errMsg = 'Failed to create checkout session';
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) errMsg = errJson.error.message;
      } catch {}
      return jsonResponse({ error: errMsg }, 500);
    }

    const session = await sessionRes.json();

    return jsonResponse({ url: session.url }, 200);
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ error: message }, 500);
  }
});
