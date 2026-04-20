import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.rpc('get_maintenance_status');

    if (error) {
      console.error('Error calling get_maintenance_status:', error);
      return jsonResponse({ error: 'Failed to check maintenance status' }, 500);
    }

    return jsonResponse(data, 200);
  } catch (error) {
    console.error('Error in check-maintenance function:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
