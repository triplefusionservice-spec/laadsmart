const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(res, 500, { error: 'Server not configured (env missing).' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const accessToken = String(body?.access_token || '');
  if (!accessToken) return json(res, 401, { error: 'Missing access_token' });

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(accessToken);
  if (userErr || !userData?.user) return json(res, 401, { error: 'Invalid session' });

  const user = userData.user;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: subRow } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!subRow?.stripe_customer_id) {
    return json(res, 400, { error: 'No customer found for this user yet.' });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  const origin = getOrigin(req);

  const portal = await stripe.billingPortal.sessions.create({
    customer: subRow.stripe_customer_id,
    return_url: `${origin}/?portal=return`,
  });

  return json(res, 200, { url: portal.url });
};

