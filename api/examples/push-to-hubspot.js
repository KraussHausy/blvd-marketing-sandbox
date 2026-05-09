/**
 * Push Boulevard clients to HubSpot as contacts.
 *
 * Fetches clients from Boulevard, then creates/updates contacts
 * in HubSpot using the Contacts API.
 *
 * Usage: npm run push-hubspot
 *
 * Requires BLVD_API_KEY and HUBSPOT_ACCESS_TOKEN in .env
 */

import 'dotenv/config';
import fetch from 'node-fetch';

const BLVD_API_URL = process.env.BLVD_API_URL || 'https://dashboard.boulevard.io/api/2020-01';
const BLVD_API_KEY = process.env.BLVD_API_KEY;
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

if (!BLVD_API_KEY || !HUBSPOT_TOKEN) {
  console.error('Missing required env vars. Check .env.example for: BLVD_API_KEY, HUBSPOT_ACCESS_TOKEN');
  process.exit(1);
}

// Step 1: Fetch clients from Boulevard
async function fetchBlvdClients() {
  const query = `
    query {
      clients(first: 100) {
        edges {
          node {
            firstName
            lastName
            email
            mobilePhone
          }
        }
      }
    }
  `;

  const res = await fetch(BLVD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(BLVD_API_KEY + ':').toString('base64')}`,
    },
    body: JSON.stringify({ query }),
  });

  const { data, errors } = await res.json();
  if (errors) throw new Error(`Boulevard API errors: ${JSON.stringify(errors)}`);

  return data.clients.edges
    .map(e => e.node)
    .filter(c => c.email);
}

// Step 2: Upsert contacts in HubSpot (batch)
async function pushToHubSpot(clients) {
  const inputs = clients.map(c => ({
    properties: {
      email: c.email,
      firstname: c.firstName,
      lastname: c.lastName,
      phone: c.mobilePhone || '',
      blvd_sync_source: 'boulevard-sandbox',
    },
    idProperty: 'email',
  }));

  const batchSize = 100;
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);

    // Try batch create first
    const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      },
      body: JSON.stringify({ inputs: batch }),
    });

    if (createRes.ok) {
      const result = await createRes.json();
      const count = result.results?.length || 0;
      updated += count;
      console.log(`  Batch ${Math.floor(i / batchSize) + 1}: upserted ${count} contacts`);
    } else {
      const err = await createRes.text();
      failed += batch.length;
      console.warn(`  Batch ${Math.floor(i / batchSize) + 1} failed: ${createRes.status} — ${err}`);
    }
  }

  return { created, updated, failed };
}

console.log('Fetching clients from Boulevard...');
const clients = await fetchBlvdClients();
console.log(`Found ${clients.length} clients with email addresses.\n`);

console.log('Pushing to HubSpot...');
const { updated, failed } = await pushToHubSpot(clients);
console.log(`\nDone. Upserted: ${updated}, Failed: ${failed}`);
