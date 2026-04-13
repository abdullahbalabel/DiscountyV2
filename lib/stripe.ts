import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

export async function createCheckoutSession(
  planId: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

  const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      billing_cycle: billingCycle,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Failed to create checkout session');
  }

  const data = await res.json();
  return data.url;
}

export async function openStripeCheckout(
  planId: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<boolean> {
  const url = await createCheckoutSession(planId, billingCycle);

  const result = await WebBrowser.openBrowserAsync(url, {
    dismissButtonStyle: 'close',
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
  });

  // After the browser closes, check if we got redirected to a deep link
  // The deep link handling is done by the app's linking setup
  // We return true if the browser was dismissed (user completed or cancelled)
  if (result.type === 'cancel' || result.type === 'dismiss') {
    // Check for pending deep link
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl?.includes('subscription-success')) {
      return true;
    }
  }

  return result.type === 'cancel';
}
