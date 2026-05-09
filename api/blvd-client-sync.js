/**
 * Boulevard Client Sync
 *
 * Fetches clients from the Boulevard API (GraphQL) and outputs them
 * as JSON. Pipe the output to other scripts or use as a starting
 * point for syncing to Klaviyo, HubSpot, Mailchimp, etc.
 *
 * Usage:
 *   cp .env.example .env    # fill in your credentials
 *   npm install
 *   npm run sync
 */

import 'dotenv/config';
import fetch from 'node-fetch';

const API_URL = process.env.BLVD_API_URL || 'https://dashboard.boulevard.io/api/2020-01';
const API_KEY = process.env.BLVD_API_KEY;

if (!API_KEY) {
  console.error('Missing BLVD_API_KEY in .env — copy .env.example to .env and fill in your key.');
  process.exit(1);
}

const CLIENTS_QUERY = `
  query ListClients($first: Int, $after: String) {
    clients(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          firstName
          lastName
          email
          mobilePhone
          createdAt
          updatedAt
          tags {
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

async function fetchClients({ first = 50, after = null } = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
    },
    body: JSON.stringify({
      query: CLIENTS_QUERY,
      variables: { first, after },
    }),
  });

  if (!res.ok) {
    throw new Error(`Boulevard API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function getAllClients() {
  const allClients = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const { data, errors } = await fetchClients({ after });

    if (errors) {
      console.error('GraphQL errors:', JSON.stringify(errors, null, 2));
      break;
    }

    const { edges, pageInfo } = data.clients;
    for (const edge of edges) {
      allClients.push(edge.node);
    }

    hasNextPage = pageInfo.hasNextPage;
    after = pageInfo.endCursor;

    console.error(`Fetched ${allClients.length} clients so far...`);
  }

  return allClients;
}

const clients = await getAllClients();
console.log(JSON.stringify(clients, null, 2));
console.error(`\nDone. Total clients: ${clients.length}`);
