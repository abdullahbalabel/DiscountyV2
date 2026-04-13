import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

interface StripeProduct {
  id: string;
  name: string;
  active: boolean;
  metadata: Record<string, string>;
}

interface StripePrice {
  id: string;
  product: string;
  active: boolean;
  type: string;
  recurring: { interval: string; interval_count: number } | null;
  unit_amount: number;
  currency: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Verify JWT
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

    // Verify admin role
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return jsonResponse({ error: 'Admin access required' }, 403);
    }

    // Test Stripe connection
    if (req.method === 'GET') {
      // Fetch Stripe products
      const productsRes = await fetch('https://api.stripe.com/v1/products?limit=100&active=true', {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
      });

      if (!productsRes.ok) {
        const errText = await productsRes.text();
        return jsonResponse({
          connected: false,
          error: `Stripe API error: ${productsRes.status}`,
          details: errText,
          webhookConfigured: !!STRIPE_WEBHOOK_SECRET,
        }, 200);
      }

      const productsData = await productsRes.json();
      const products: StripeProduct[] = productsData.data || [];

      // Fetch all prices
      const pricesRes = await fetch('https://api.stripe.com/v1/prices?limit=100&active=true', {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
      });

      let prices: StripePrice[] = [];
      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        prices = pricesData.data || [];
      }

      // Fetch local plans
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, name, name_ar, monthly_price_sar, yearly_price_sar, stripe_product_id, stripe_monthly_price_id, stripe_yearly_price_id, is_active, sort_order')
        .order('sort_order');

      // Build price map by product
      const priceMap: Record<string, StripePrice[]> = {};
      for (const price of prices) {
        if (!priceMap[price.product]) priceMap[price.product] = [];
        priceMap[price.product].push(price);
      }

      return jsonResponse({
        connected: true,
        webhookConfigured: !!STRIPE_WEBHOOK_SECRET,
        products,
        prices,
        plans: plans || [],
        priceMap,
      }, 200);
    }

    // POST: Sync or update
    if (req.method === 'POST') {
      const body = await req.json();
      const { action } = body;

      if (action === 'sync') {
        // Fetch all Stripe products
        const productsRes = await fetch('https://api.stripe.com/v1/products?limit=100&active=true', {
          headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
        });

        if (!productsRes.ok) {
          return jsonResponse({ error: 'Failed to fetch Stripe products' }, 500);
        }

        const productsData = await productsRes.json();
        const products: StripeProduct[] = productsData.data || [];

        // Fetch all prices
        const pricesRes = await fetch('https://api.stripe.com/v1/prices?limit=100&active=true', {
          headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
        });

        let prices: StripePrice[] = [];
        if (pricesRes.ok) {
          const pricesData = await pricesRes.json();
          prices = pricesData.data || [];
        }

        // Fetch local plans
        const { data: plans } = await supabase
          .from('subscription_plans')
          .select('id, name, name_ar, stripe_product_id, stripe_monthly_price_id, stripe_yearly_price_id')
          .order('sort_order');

        if (!plans) {
          return jsonResponse({ error: 'No plans found' }, 404);
        }

        // Build price map
        const priceMap: Record<string, { monthly: StripePrice | null; yearly: StripePrice | null }> = {};
        for (const product of products) {
          const productPrices = prices.filter(p => p.product === product.id && p.recurring);
          priceMap[product.id] = {
            monthly: productPrices.find(p => p.recurring?.interval === 'month') || null,
            yearly: productPrices.find(p => p.recurring?.interval === 'year') || null,
          };
        }

        // Match products to plans by name (case-insensitive)
        const updates: Array<{
          planId: string;
          planName: string;
          productId: string | null;
          monthlyPriceId: string | null;
          yearlyPriceId: string | null;
        }> = [];

        for (const plan of plans) {
          const matchedProduct = products.find(
            p => p.name.toLowerCase() === plan.name.toLowerCase()
          );

          if (matchedProduct) {
            const pair = priceMap[matchedProduct.id] || { monthly: null, yearly: null };
            updates.push({
              planId: plan.id,
              planName: plan.name,
              productId: matchedProduct.id,
              monthlyPriceId: pair.monthly?.id || null,
              yearlyPriceId: pair.yearly?.id || null,
            });
          }
        }

        // Apply updates
        let updatedCount = 0;
        for (const update of updates) {
          const { error } = await supabase
            .from('subscription_plans')
            .update({
              stripe_product_id: update.productId,
              stripe_monthly_price_id: update.monthlyPriceId,
              stripe_yearly_price_id: update.yearlyPriceId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', update.planId);

          if (!error) updatedCount++;
        }

        return jsonResponse({
          success: true,
          matched: updates.length,
          updated: updatedCount,
          details: updates,
        }, 200);
      }

      if (action === 'update-plan') {
        const { plan_id, stripe_product_id, stripe_monthly_price_id, stripe_yearly_price_id } = body;

        if (!plan_id) {
          return jsonResponse({ error: 'plan_id is required' }, 400);
        }

        const { error } = await supabase
          .from('subscription_plans')
          .update({
            stripe_product_id: stripe_product_id || null,
            stripe_monthly_price_id: stripe_monthly_price_id || null,
            stripe_yearly_price_id: stripe_yearly_price_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', plan_id);

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({ success: true }, 200);
      }

      if (action === 'cancel-subscription') {
        const { stripe_subscription_id } = body;

        if (!stripe_subscription_id) {
          return jsonResponse({ error: 'stripe_subscription_id is required' }, 400);
        }

        // Cancel immediately on Stripe
        const cancelRes = await fetch(`https://api.stripe.com/v1/subscriptions/${stripe_subscription_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
        });

        if (!cancelRes.ok) {
          const errText = await cancelRes.text();
          console.error('Failed to cancel Stripe subscription:', stripe_subscription_id, cancelRes.status, errText);
          return jsonResponse({ error: 'Failed to cancel Stripe subscription', details: errText }, 500);
        }

        return jsonResponse({ success: true }, 200);
      }

      if (action === 'update-subscription-period') {
        const { stripe_subscription_id, period_end } = body;

        if (!stripe_subscription_id) {
          return jsonResponse({ error: 'stripe_subscription_id is required' }, 400);
        }

        if (!period_end) {
          return jsonResponse({ error: 'period_end is required' }, 400);
        }

        // Update Stripe subscription trial/billing cycle anchor
        const periodEndTs = Math.floor(new Date(period_end).getTime() / 1000);
        const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${stripe_subscription_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'trial_end': periodEndTs.toString(),
            'proration_behavior': 'none',
          }),
        });

        if (!updateRes.ok) {
          const errText = await updateRes.text();
          console.error('Failed to update Stripe subscription period:', stripe_subscription_id, updateRes.status, errText);
          return jsonResponse({ error: 'Failed to update Stripe subscription period', details: errText }, 500);
        }

        return jsonResponse({ success: true }, 200);
      }

      return jsonResponse({ error: 'Unknown action' }, 400);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Error in stripe-settings:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
