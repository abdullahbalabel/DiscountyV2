import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, stripe-signature',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  const elements: Record<string, string> = {};
  for (const part of sigHeader.split(',')) {
    const [key, val] = part.split('=');
    if (key && val) elements[key.trim()] = val.trim();
  }

  const timestamp = elements['t'];
  const signature = elements['v1'];
  if (!timestamp || !signature) return { valid: false, error: 'Missing t or v1 in signature header' };

  // Tolerance: 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return { valid: false, error: 'Timestamp outside tolerance' };
  }

  const signedPayload = `${timestamp}.${payload}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(signedPayload);

  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  const computedSig = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (computedSig !== signature) {
    return { valid: false, error: 'Signature mismatch' };
  }

  return { valid: true };
}

interface StripeSubscription {
  id: string;
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  items: { data: Array<{ price: { id: string }; current_period_start?: number; current_period_end?: number }> };
  metadata: Record<string, string>;
  customer: string;
  cancel_at_period_end: boolean;
}

async function getStripeSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Failed to fetch Stripe subscription:', subscriptionId, res.status, errText);
    return null;
  }
  const data = await res.json();
  console.log('Stripe subscription fields:', JSON.stringify({
    id: data.id,
    status: data.status,
    current_period_start: data.current_period_start,
    current_period_end: data.current_period_end,
    items_period_start: data.items?.data?.[0]?.current_period_start,
    items_period_end: data.items?.data?.[0]?.current_period_end,
  }));
  return data;
}

interface StripeInvoice {
  id: string;
  subscription: string;
  status: string;
  amount_paid: number;
  currency: string;
}

async function getStripeInvoice(invoiceId: string): Promise<StripeInvoice | null> {
  const res = await fetch(`https://api.stripe.com/v1/invoices/${invoiceId}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const rawBody = await req.text();
    const sigHeader = req.headers.get('stripe-signature');

    if (!sigHeader) {
      return jsonResponse({ error: 'Missing stripe-signature header' }, 400);
    }

    // Verify webhook signature
    const sigResult = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
    if (!sigResult.valid) {
      console.error('Signature verification failed:', sigResult.error);
      return jsonResponse({ error: `Invalid signature: ${sigResult.error}` }, 400);
    }

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const debugInfo: Record<string, unknown> = { event_type: event.type };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = (session.metadata || {}) as Record<string, string>;
        const { provider_id, plan_id, billing_cycle } = metadata;

        debugInfo.metadata = metadata;
        debugInfo.customer = session.customer;
        debugInfo.subscription = session.subscription;
        debugInfo.session_keys = Object.keys(session);

        if (!provider_id || !plan_id || !billing_cycle) {
          debugInfo.error = 'Missing metadata';
          debugInfo.metadata_raw = JSON.stringify(session.metadata);
          console.error('Missing metadata:', JSON.stringify(debugInfo));
          // Return 200 with debug info so Stripe doesn't retry, but include the error
          return jsonResponse({ received: true, debug: debugInfo }, 200);
        }

        // Get the full subscription from Stripe
        const stripeSubId = session.subscription as string;
        if (!stripeSubId) {
          debugInfo.error = 'No subscription ID';
          console.error('No subscription ID in checkout session');
          return jsonResponse({ received: true, debug: debugInfo }, 200);
        }

        const stripeSub = await getStripeSubscription(stripeSubId);
        if (!stripeSub) {
          debugInfo.error = 'Failed to fetch Stripe subscription';
          console.error('Failed to fetch Stripe subscription:', stripeSubId);
          return jsonResponse({ received: true, debug: debugInfo }, 200);
        }

        debugInfo.stripe_sub_status = stripeSub.status;
        debugInfo.stripe_sub_period_start = stripeSub.current_period_start;
        debugInfo.stripe_sub_period_end = stripeSub.current_period_end;

        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', plan_id)
          .single();

        if (planError || !plan) {
          debugInfo.error = 'Plan not found';
          debugInfo.plan_error = planError;
          console.error('Plan not found:', plan_id, planError);
          return jsonResponse({ received: true, debug: debugInfo }, 200);
        }

        const amountSar = billing_cycle === 'yearly'
          ? plan.yearly_price_sar
          : plan.monthly_price_sar;

        // Cancel any existing active subscription for this provider
        const { error: cancelError } = await supabase
          .from('provider_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('provider_id', provider_id)
          .eq('status', 'active');

        if (cancelError) {
          console.error('Failed to cancel existing subscription:', cancelError);
        }

        // Insert new subscription
        // In newer Stripe API versions, period fields are on items, not the subscription
        const item = stripeSub.items?.data?.[0];
        const periodStart = stripeSub.current_period_start ?? item?.current_period_start;
        const periodEndTs = stripeSub.current_period_end ?? item?.current_period_end;

        const startsAt = typeof periodStart === 'number' && periodStart > 0
          ? new Date(periodStart * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = typeof periodEndTs === 'number' && periodEndTs > 0
          ? new Date(periodEndTs * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { error: insertError } = await supabase
          .from('provider_subscriptions')
          .insert({
            provider_id,
            plan_id,
            billing_cycle,
            amount_sar: amountSar || 0,
            stripe_subscription_id: stripeSubId,
            stripe_customer_id: session.customer as string,
            status: 'active',
            starts_at: startsAt,
            current_period_end: periodEnd,
            pending_plan_id: null,
            pending_cycle: null,
          });

        if (insertError) {
          debugInfo.error = 'Insert failed';
          debugInfo.insert_error = insertError;
          console.error('Failed to insert subscription:', JSON.stringify(insertError));
        } else {
          debugInfo.success = true;
          debugInfo.message = `Subscription created for provider ${provider_id}, plan ${plan_id}`;
          console.log(`Subscription created for provider ${provider_id}, plan ${plan_id}`);

          await supabase.rpc('reevaluate_ticket_priority', { p_provider_id: provider_id });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as StripeInvoice;
        if (!invoice.subscription) {
          console.log('invoice.paid: no subscription ID');
          break;
        }

        const stripeSub = await getStripeSubscription(invoice.subscription as string);
        if (!stripeSub) {
          console.error('invoice.paid: failed to fetch Stripe subscription');
          break;
        }

        // Find subscription by stripe_subscription_id
        const { data: sub } = await supabase
          .from('provider_subscriptions')
          .select('id, provider_id, status')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .maybeSingle();

        if (!sub) {
          console.log('invoice.paid: no subscription found for stripe ID:', invoice.subscription);
          break;
        }

        // Update period end and reset status if past_due
        const invItem = stripeSub.items?.data?.[0];
        const invPeriodEnd = stripeSub.current_period_end ?? invItem?.current_period_end;
        const updateData: Record<string, unknown> = {
          current_period_end: typeof invPeriodEnd === 'number' && invPeriodEnd > 0
            ? new Date(invPeriodEnd * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (sub.status === 'past_due') {
          updateData.status = 'active';
        }

        const { error: updateError } = await supabase
          .from('provider_subscriptions')
          .update(updateData)
          .eq('id', sub.id);

        if (updateError) {
          console.error('Failed to update subscription on invoice.paid:', updateError);
        } else {
          console.log(`Invoice paid for subscription ${sub.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as StripeInvoice;
        if (!invoice.subscription) break;

        // Set subscription status to past_due
        const { data: sub } = await supabase
          .from('provider_subscriptions')
          .select('id, provider_id')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .maybeSingle();

        if (!sub) {
          console.log('invoice.payment_failed: no subscription found');
          break;
        }

        await supabase
          .from('provider_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        // Create notification for provider
        const { data: providerProfile } = await supabase
          .from('provider_profiles')
          .select('user_id')
          .eq('id', sub.provider_id)
          .single();

        if (providerProfile) {
          await supabase.from('notifications').insert({
            user_id: providerProfile.user_id,
            type: 'account_activity',
            title: 'Payment Failed',
            body: 'Payment failed for your subscription. Please update your payment method to continue enjoying premium features.',
            data: { subscription_id: sub.id },
            is_read: false,
          });
        }

        console.log(`Payment failed for subscription ${sub.id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as StripeSubscription;
        const metadata = stripeSub.metadata;

        // Find existing subscription
        const { data: existingSub } = await supabase
          .from('provider_subscriptions')
          .select('id, provider_id, plan_id, billing_cycle, pending_plan_id')
          .eq('stripe_subscription_id', stripeSub.id)
          .maybeSingle();

        if (!existingSub) {
          console.log('customer.subscription.updated: no subscription found for stripe ID:', stripeSub.id);
          break;
        }

        const updateData: Record<string, unknown> = {
          status: stripeSub.status === 'active' ? 'active'
            : stripeSub.status === 'past_due' ? 'past_due'
            : stripeSub.status === 'canceled' ? 'cancelled'
            : stripeSub.status,
          current_period_end: (() => {
            const updItem = stripeSub.items?.data?.[0];
            const ts = stripeSub.current_period_end ?? updItem?.current_period_end;
            return typeof ts === 'number' && ts > 0
              ? new Date(ts * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          })(),
          updated_at: new Date().toISOString(),
        };

        // If metadata has plan_id, sync it
        if (metadata?.plan_id) {
          updateData.plan_id = metadata.plan_id;
        }
        if (metadata?.billing_cycle) {
          updateData.billing_cycle = metadata.billing_cycle;
        }

        // If plan changed via Stripe (upgrade/proration), fetch amount from new plan
        if (metadata?.plan_id && metadata.plan_id !== existingSub.plan_id) {
          const { data: newPlan } = await supabase
            .from('subscription_plans')
            .select('monthly_price_sar, yearly_price_sar')
            .eq('id', metadata.plan_id)
            .single();

          if (newPlan) {
            const cycle = metadata.billing_cycle || existingSub.billing_cycle;
            updateData.amount_sar = cycle === 'yearly'
              ? newPlan.yearly_price_sar
              : newPlan.monthly_price_sar;
          }
        }

        await supabase
          .from('provider_subscriptions')
          .update(updateData)
          .eq('id', existingSub.id);

        await supabase.rpc('reevaluate_ticket_priority', { p_provider_id: existingSub.provider_id });

        console.log(`Subscription updated: ${stripeSub.id}, status: ${stripeSub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as StripeSubscription;

        // Find subscription
        const { data: sub } = await supabase
          .from('provider_subscriptions')
          .select('id, provider_id, pending_plan_id, pending_cycle')
          .eq('stripe_subscription_id', stripeSub.id)
          .maybeSingle();

        if (!sub) break;

        // Set current subscription to expired
        await supabase
          .from('provider_subscriptions')
          .update({
            status: 'expired',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        if (sub.pending_plan_id) {
          const { data: pendingPlan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', sub.pending_plan_id)
            .single();

          if (pendingPlan) {
            const cycle = sub.pending_cycle || 'monthly';
            const amountSar = cycle === 'yearly'
              ? pendingPlan.yearly_price_sar
              : pendingPlan.monthly_price_sar;

            const now = new Date();
            const periodEnd = new Date(now);
            if (cycle === 'yearly') {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            await supabase.from('provider_subscriptions').insert({
              provider_id: sub.provider_id,
              plan_id: sub.pending_plan_id,
              billing_cycle: cycle,
              amount_sar: amountSar || 0,
              stripe_subscription_id: null,
              stripe_customer_id: null,
              status: 'active',
              starts_at: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
            });

            await supabase.rpc('reevaluate_ticket_priority', { p_provider_id: sub.provider_id });

            console.log(`Downgrade applied for provider ${sub.provider_id} to plan ${sub.pending_plan_id}`);
          }
        } else {
          const { data: freePlan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('name', 'Free')
            .eq('is_active', true)
            .single();

          if (freePlan) {
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setFullYear(periodEnd.getFullYear() + 100);

            await supabase.from('provider_subscriptions').insert({
              provider_id: sub.provider_id,
              plan_id: freePlan.id,
              billing_cycle: 'monthly',
              amount_sar: 0,
              stripe_subscription_id: null,
              stripe_customer_id: null,
              status: 'active',
              starts_at: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
            });

            console.log(`Provider ${sub.provider_id} reverted to Free plan`);
          }

          // Pause deals exceeding Free plan limit (1 deal)
          if (freePlan) {
            const { data: activeDeals } = await supabase
              .from('discounts')
              .select('id')
              .eq('provider_id', sub.provider_id)
              .eq('status', 'active')
              .order('created_at', { ascending: false });

            if (activeDeals && activeDeals.length > freePlan.max_active_deals) {
              const dealsToPause = activeDeals.slice(freePlan.max_active_deals);

              if (dealsToPause.length > 0) {
                const pauseIds = dealsToPause.map(d => d.id);
                await supabase
                  .from('discounts')
                  .update({ status: 'paused', updated_at: new Date().toISOString() })
                  .in('id', pauseIds);

                console.log(`Paused ${pauseIds.length} deals exceeding Free plan limit`);
              }
            }

            // Un-feature all deals (Free plan does not include homepage placement)
            await supabase
              .from('discounts')
              .update({ is_featured: false, featured_until: null, updated_at: new Date().toISOString() })
              .eq('provider_id', sub.provider_id)
              .eq('is_featured', true);
          }

          await supabase.rpc('reevaluate_ticket_priority', { p_provider_id: sub.provider_id });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true, debug: debugInfo }, 200);
  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ error: message }, 500);
  }
});
