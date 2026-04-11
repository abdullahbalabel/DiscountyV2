import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';
import { jwtVerify, createRemoteJWKSet } from 'https://esm.sh/jose@6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');

const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

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

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  priority?: string;
  channelId?: string;
}

async function sendExpoPushNotifications(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (EXPO_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${EXPO_ACCESS_TOKEN}`;
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Expo Push API error:', response.status, errorText);
    throw new Error(`Expo Push API returned ${response.status}`);
  }

  const result = await response.json();
  console.log('Expo Push API response:', JSON.stringify(result));

  if (result.data) {
    for (const item of result.data) {
      if (item.status === 'error') {
        console.error('Push notification error:', item.message, item.details);
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT signature using JWKS (supports ES256 and HS256)
    try {
      await jwtVerify(token, JWKS);
    } catch (err) {
      return jsonResponse({ error: 'Invalid token', details: (err as Error).message }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { user_id, title, body: notifBody, data } = body;

    if (!user_id || !title || !notifBody) {
      return jsonResponse({ error: 'Missing required fields: user_id, title, body' }, 400);
    }

    // Fetch push tokens for the target user
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', user_id);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return jsonResponse({ error: 'Failed to fetch push tokens' }, 500);
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No push tokens found for user ${user_id}`);
      return jsonResponse({ success: true, sent: 0 }, 200);
    }

    // Build Expo push messages
    const messages: PushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body: notifBody,
      data: data || {},
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    }));

    // Send in batches of 100 (Expo limit)
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      await sendExpoPushNotifications(batch);
    }

    return jsonResponse({ success: true, sent: messages.length }, 200);
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
