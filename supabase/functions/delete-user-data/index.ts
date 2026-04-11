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

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller is an active admin
    const { data: adminProfile, error: adminError } = await supabaseAuth
      .from('admin_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !adminProfile) {
      return jsonResponse({ error: 'Admin access required', details: adminError?.message }, 403);
    }

    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return jsonResponse({ error: 'Missing required field: user_id' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Delete in order respecting FK constraints
    await supabase.from('push_tokens').delete().eq('user_id', user_id);
    await supabase.from('notifications').delete().eq('user_id', user_id);
    await supabase.from('reviews').delete().eq('customer_id', user_id);
    await supabase.from('redemptions').delete().eq('customer_id', user_id);
    await supabase.from('rejection_reports').delete().eq('customer_id', user_id);

    // saved_deals table may or may not exist
    try {
      await supabase.from('saved_deals').delete().eq('customer_id', user_id);
    } catch {
      // Table doesn't exist, skip
    }

    await supabase.from('customer_profiles').delete().eq('user_id', user_id);
    await supabase.from('provider_profiles').delete().eq('user_id', user_id);
    await supabase.from('user_roles').delete().eq('user_id', user_id);
    await supabase.from('data_requests').delete().eq('user_id', user_id);

    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return jsonResponse({ error: 'Failed to delete auth user', details: deleteError.message }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error('Error in delete-user-data function:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
