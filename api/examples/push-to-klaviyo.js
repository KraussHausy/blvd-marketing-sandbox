/**
 * Push Boulevard clients to a Klaviyo list.
 *
 * Fetches clients from Boulevard, then adds/updates each profile
 * in Klaviyo and subscribes them to a list.
 *
 * Usage: npm run push-klaviyo
 *
 * Requires BLVD_API_KEY, KLAVIYO_API_KEY, and KLAVIYO_LIST_ID in .env
 */

import 'dotenv/config';
import fetch from 'node-fetch';

const BLVD_API_URL = process.env.BLVD_API_URL || 'https://dashboard.boulevard.io/api/2020-01';
const BLVD_API_KEY = process.env.BLVD_API_KEY;
const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
const KLAVIYO_LIST_ID = process.env.KLAVIYO_LIST_ID;

if (!BLVD_API_KEY || !KLAVIYO_API_KEY || !KLAVIYO_LIST_ID) {
  console.error('Missing required env vars. Check .env.example for: BLVD_API_KEY, KLAVIYO_API_KEY, KLAVIYO_LIST_ID');
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

// Step 2: Upsert profiles into Klaviyo and subscribe to list
async function pushToKlaviyo(clients) {
  let synced = 0;
  let skipped = 0;

  for (const client of clients) {
    const payload = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: [{
              type: 'profile',
              attributes: {
                email: client.email,
                first_name: client.firstName,
                last_name: client.lastName,
                phone_number: client.mobilePhone || undefined,
                properties: {
                  source: 'boulevard-sync',
                },
              },
            }],
          },
        },
        relationships: {
          list: {
            data: { type: 'list', id: KLAVIYO_LIST_ID },
          },
        },
      },
    };

    const res = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        'revision': '2024-02-15',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      synced++;
      console.log(`  Synced: ${client.firstName} ${client.lastName} (${client.email})`);
    } else {
      skipped++;
      console.warn(`  Skipped: ${client.email} — ${res.status} ${res.statusText}`);
    }
  }

  return { synced, skipped };
}

console.log('Fetching clients from Boulevard...');
const clients = await fetchBlvdClients();
console.log(`Found ${clients.length} clients with email addresses.\n`);

console.log('Pushing to Klaviyo...');
const { synced, skipped } = await pushToKlaviyo(clients);
console.log(`\nDone. Synced: ${synced}, Skipped: ${skipped}`);
