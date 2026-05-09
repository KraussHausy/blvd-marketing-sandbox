/**
 * Fetch Boulevard clients and display a summary.
 * Usage: npm run fetch-clients
 */

import 'dotenv/config';
import fetch from 'node-fetch';

const API_URL = process.env.BLVD_API_URL || 'https://dashboard.boulevard.io/api/2020-01';
const API_KEY = process.env.BLVD_API_KEY;

if (!API_KEY) {
  console.error('Missing BLVD_API_KEY — see .env.example');
  process.exit(1);
}

const query = `
  query {
    clients(first: 10) {
      edges {
        node {
          id
          firstName
          lastName
          email
          mobilePhone
          createdAt
        }
      }
    }
  }
`;

const res = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
  },
  body: JSON.stringify({ query }),
});

const { data, errors } = await res.json();

if (errors) {
  console.error('API errors:', errors);
  process.exit(1);
}

console.log('\nFirst 10 clients from Boulevard:\n');
for (const { node } of data.clients.edges) {
  console.log(`  ${node.firstName} ${node.lastName} — ${node.email || 'no email'} — ${node.mobilePhone || 'no phone'}`);
}
console.log(`\nTotal returned: ${data.clients.edges.length}`);
