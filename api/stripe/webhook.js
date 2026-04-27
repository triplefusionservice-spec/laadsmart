const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    res.statusCode = 500;
    res.end('Server not configured');
    return;
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    res.statusCode = 400;
    res.end(`Webhook Error: ${err.message}`);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const supabaseUserId = session?.metadata?.supabase_user_id;
      const plan = session?.metadata?.plan || 'pro';
      const customerId = session?.customer;
      const subscriptionId = session?.subscription;

      if (supabaseUserId) {
        await supabase.from('subscriptions').upsert({
          user_id: supabaseUserId,
          plan,
          status: 'active',
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId || null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const supabaseUserId = sub?.metadata?.supabase_user_id;
      const plan = sub?.metadata?.plan || 'pro';
      const status = sub?.status || 'unknown';
      const customerId = sub?.customer;
      const subscriptionId = sub?.id;
      const currentPeriodEnd = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

      if (supabaseUserId) {
        await supabase.from('subscriptions').upsert({
          user_id: supabaseUserId,
          plan,
          status,
          current_period_end: currentPeriodEnd,
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId || null,
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    res.statusCode = 500;
    res.end('Webhook handler failed');
    return;
  }

  res.statusCode = 200;
  res.end('ok');
};

