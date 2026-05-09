/**
 * Boulevard Webhook Listener
 *
 * A simple Express server that receives webhook events from Boulevard
 * and logs them. Use this to test webhook integrations or as a starting
 * point for building automations.
 *
 * Usage:
 *   cp .env.example .env
 *   npm install
 *   npm run webhooks
 *
 * For local testing, expose this with ngrok or similar:
 *   ngrok http 3001
 *   Then paste the ngrok URL into Boulevard's webhook settings.
 */

import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

function verifySignature(req) {
  if (!WEBHOOK_SECRET) return true;

  const signature = req.headers['x-blvd-signature'];
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post('/webhooks/boulevard', (req, res) => {
  if (!verifySignature(req)) {
    console.warn('[WEBHOOK] Signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  const timestamp = new Date().toISOString();

  console.log(`\n[${timestamp}] Webhook received:`);
  console.log(`  Event:    ${event.event || 'unknown'}`);
  console.log(`  Resource: ${event.resource_type || 'unknown'}`);
  console.log(`  ID:       ${event.resource_id || 'unknown'}`);
  console.log(`  Payload:  ${JSON.stringify(event, null, 2)}`);

  // --------------------------------------------------------
  // Add your automation logic here. Examples:
  //
  // if (event.event === 'client.created') {
  //   // Sync new client to Klaviyo/HubSpot/Mailchimp
  // }
  //
  // if (event.event === 'appointment.completed') {
  //   // Trigger a follow-up email or review request
  // }
  //
  // if (event.event === 'order.completed') {
  //   // Update a CRM deal or trigger a thank-you flow
  // }
  // --------------------------------------------------------

  res.status(200).json({ received: true });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\nBoulevard webhook listener running on port ${PORT}`);
  console.log(`POST http://localhost:${PORT}/webhooks/boulevard`);
  console.log(`GET  http://localhost:${PORT}/health\n`);
  if (!WEBHOOK_SECRET) {
    console.warn('Warning: WEBHOOK_SECRET not set — signature verification disabled.\n');
  }
});
