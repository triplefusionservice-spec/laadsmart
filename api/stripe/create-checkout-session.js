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
  const pricePro = process.env.STRIPE_PRICE_PRO;
  const priceBusiness = process.env.STRIPE_PRICE_BUSINESS;

  if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey) {
    return json(res, 500, { error: 'Server not configured (Stripe/Supabase env missing).' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const plan = String(body?.plan || 'pro');
  const accessToken = String(body?.access_token || '');
  if (!accessToken) return json(res, 401, { error: 'Missing access_token' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
  if (userErr || !userData?.user) return json(res, 401, { error: 'Invalid session' });

  const user = userData.user;

  const priceId = plan === 'business' ? priceBusiness : pricePro;
  if (!priceId) return json(res, 500, { error: 'Server not configured (price id missing).' });

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

  const origin = getOrigin(req);
  const successUrl = `${origin}/?checkout=success`;
  const cancelUrl = `${origin}/?checkout=cancel`;

  const customer = await stripe.customers.create({
    email: user.email || undefined,
    metadata: { supabase_user_id: user.id },
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: { metadata: { supabase_user_id: user.id, plan } },
    metadata: { supabase_user_id: user.id, plan },
  });

  return json(res, 200, { url: session.url });
};

