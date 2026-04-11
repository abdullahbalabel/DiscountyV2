import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';
import { jwtVerify, createRemoteJWKSet } from 'https://esm.sh/jose@6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWKS);
      userId = payload.sub as string;
    } catch (err) {
      return jsonResponse({ error: 'Invalid token', details: (err as Error).message }, 401);
    }

    if (!userId) {
      return jsonResponse({ error: 'Invalid token: missing sub claim' }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller is an active admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !adminProfile) {
      return jsonResponse({ error: 'Admin access required', details: adminError?.message }, 403);
    }

    const body = await req.json();
    const { request_id, action, admin_notes } = body;

    if (!request_id || !action) {
      return jsonResponse({ error: 'Missing required fields: request_id, action' }, 400);
    }

    if (!['process', 'reject'].includes(action)) {
      return jsonResponse({ error: 'Invalid action. Must be "process" or "reject"' }, 400);
    }

    // Fetch the data request
    const { data: dataRequest, error: fetchError } = await supabase
      .from('data_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !dataRequest) {
      return jsonResponse({ error: 'Data request not found' }, 404);
    }

    if (dataRequest.status !== 'pending') {
      return jsonResponse({ error: 'Request has already been processed' }, 400);
    }

    if (action === 'reject') {
      await supabase
        .from('data_requests')
        .update({
          status: 'rejected',
          admin_notes: admin_notes || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', request_id);

      await supabase.from('activity_logs').insert({
        actor_id: userId,
        action_type: 'reject_data_request',
        entity_type: 'data_request',
        entity_id: request_id,
      });

      return jsonResponse({ success: true, action: 'rejected' }, 200);
    }

    // action === 'process'
    const targetUserId = dataRequest.user_id;

    if (dataRequest.request_type === 'export') {
      // Gather user data
      const [customerProfile, redemptions, reviews, notifications, pushTokens] = await Promise.all([
        supabase.from('customer_profiles').select('*').eq('user_id', targetUserId).maybeSingle(),
        supabase.from('redemptions').select('*').eq('customer_id', targetUserId),
        supabase.from('reviews').select('*').eq('customer_id', targetUserId),
        supabase.from('notifications').select('*').eq('user_id', targetUserId),
        supabase.from('push_tokens').select('*').eq('user_id', targetUserId),
      ]);

      const dataPayload = {
        customer_profile: customerProfile.data,
        redemptions: redemptions.data || [],
        reviews: reviews.data || [],
        notifications: notifications.data || [],
        push_tokens: pushTokens.data || [],
        exported_at: new Date().toISOString(),
      };

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase
        .from('data_requests')
        .update({
          status: 'completed',
          data_payload: dataPayload,
          completed_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', request_id);

      await supabase.from('activity_logs').insert({
        actor_id: userId,
        action_type: 'complete_data_export',
        entity_type: 'data_request',
        entity_id: request_id,
      });

      // Notify user
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'data_request_completed',
        title: 'Data Export Ready',
        body: 'Your data export is ready. It will be available for 7 days.',
        data: { request_id },
      });
    } else if (dataRequest.request_type === 'delete') {
      // Call delete-user-data function internally using the original caller's JWT
      const deleteResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/delete-user-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: targetUserId }),
        }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error('delete-user-data failed:', errorText);
        return jsonResponse({ error: 'Failed to delete user data' }, 500);
      }

      await supabase
        .from('data_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', request_id);

      await supabase.from('activity_logs').insert({
        actor_id: userId,
        action_type: 'complete_account_deletion',
        entity_type: 'data_request',
        entity_id: request_id,
      });
    }

    return jsonResponse({ success: true, action: 'processed', request_type: dataRequest.request_type }, 200);
  } catch (error) {
    console.error('Error in process-data-request function:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
