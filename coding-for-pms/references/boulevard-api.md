# Boulevard API Reference

Quick reference for Boulevard's APIs. For the full schema and docs, see
[developers.joinblvd.com](https://developers.joinblvd.com).

## Table of Contents

1. [API Types](#api-types)
2. [Authentication](#authentication)
3. [Common Queries](#common-queries)
4. [Webhooks](#webhooks)
5. [Rate Limiting](#rate-limiting)
6. [SDK](#sdk)

---

## API Types

Boulevard has three APIs. Most PM use cases involve the Client API or Admin API.

| API | Purpose | Auth | Base URL (Sandbox) |
|-----|---------|------|--------------------|
| **Client API** | Booking flows, public data | API key (Basic) | `sandbox.joinblvd.com/api/2020-01/{business_id}/client` |
| **Admin API** | Business operations, client data | HMAC-signed token | `sandbox.joinblvd.com/api/2020-01/admin` |
| **Tokenization API** | Credit card tokenization (PCI) | API key | `vault-sandbox.joinblvd.com` |

Production URLs use `dashboard.boulevard.io` instead of `sandbox.joinblvd.com`.

All primary APIs use GraphQL (not REST). You send queries describing exactly what data
you want, and get back only that data.

---

## Authentication

### Client API (public / unauthenticated)

Simple Basic auth with just the API key (no secret needed):

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
};
```

Note the trailing colon after the API key — that's intentional (empty password).

### Admin API (HMAC-signed)

Admin API requires signing a token with your secret key:

```javascript
import crypto from 'crypto';

function generateAdminToken(apiKey, secretKey, businessId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `blvd-admin-v1${businessId}${timestamp}`;

  const decodedSecret = Buffer.from(secretKey, 'base64');
  const signature = crypto
    .createHmac('sha256', decodedSecret)
    .update(payload)
    .digest('base64');

  const token = `${signature}${payload}`;
  return `Basic ${Buffer.from(`${apiKey}:${token}`).toString('base64')}`;
}

// Usage:
const headers = {
  'Content-Type': 'application/json',
  'Authorization': generateAdminToken(API_KEY, SECRET_KEY, BUSINESS_ID),
};
```

The token includes a timestamp and is only valid for a short window.

---

## Common Queries

### Fetch clients (Admin API)

```graphql
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
```

Use `first` and `after` for pagination. Maximum 1,000 edges per query.

### Fetch services (Client API)

```graphql
query {
  business(id: "BUSINESS_ID") {
    services(first: 50) {
      edges {
        node {
          id
          name
          description
          duration
          price
        }
      }
    }
  }
}
```

### Fetch locations (Client API)

```graphql
query {
  business(id: "BUSINESS_ID") {
    locations(first: 20) {
      edges {
        node {
          id
          name
          address {
            line1
            city
            state
            zip
          }
        }
      }
    }
  }
}
```

### Create a booking cart (Client API)

```graphql
mutation {
  cartBookingQuestionAddAnswer(input: {
    # Cart creation and booking flow — use the book-sdk instead
    # of building this from scratch. See SDK section below.
  })
}
```

For booking flows, use the `@boulevard/blvd-book-sdk` instead of raw GraphQL.

---

## Webhooks

### Receiving webhooks

Boulevard sends POST requests to your endpoint with a JSON payload. Every webhook includes:

```json
{
  "idempotencyKey": "unique-key-for-deduplication",
  "businessId": "urn:blvd:Business:...",
  "apiApplicationId": "urn:blvd:ApiApplication:...",
  "event": "client.created",
  "eventType": "client",
  "resource": { "id": "urn:blvd:Client:..." },
  "timestamp": "2026-05-11T...",
  "webhookId": "urn:blvd:Webhook:...",
  "data": {
    "node": {
      "firstName": "...",
      "lastName": "...",
      "email": "..."
    }
  }
}
```

### Verifying signatures

Boulevard signs every webhook with HMAC-SHA256. Always verify:

```javascript
import crypto from 'crypto';

function verifyWebhookSignature(rawBody, headers, appSecret) {
  const salt = headers['x-blvd-hmac-salt'];
  const signature = headers['x-blvd-hmac-sha256'];

  if (!salt || !signature) return false;

  const decodedSecret = Buffer.from(appSecret, 'base64');
  const hmacPayload = `${salt}:${rawBody}`;
  const expected = crypto
    .createHmac('sha256', decodedSecret)
    .update(hmacPayload)
    .digest('base64');

  // Timing-safe comparison prevents timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Common webhook events

| Event | Fires when |
|-------|-----------|
| `client.created` | New client added |
| `client.updated` | Client profile changed |
| `appointment.created` | Appointment booked |
| `appointment.updated` | Appointment rescheduled or modified |
| `appointment.completed` | Appointment marked complete |
| `appointment.cancelled` | Appointment cancelled |
| `order.completed` | Product or service order completed |

Full list: 19 categories covering appointments, clients, orders, gift cards,
memberships, products, staff, locations, and more.

### Local testing with ngrok

Your laptop isn't on the public internet, so Boulevard can't send webhooks to it
directly. ngrok creates a temporary tunnel — a public URL that forwards to your laptop.

```bash
# Terminal 1: start the webhook listener
cd api && npm run webhooks

# Terminal 2: start the tunnel
ngrok http 3001
# Copy the https://xxxx.ngrok.io URL
```

Then paste the ngrok URL into Boulevard > Settings > Developers > Webhooks as:
`https://xxxx.ngrok.io/webhooks/boulevard`

**Important context on ngrok:**
- ngrok is **not officially endorsed** by Boulevard, but it's widely used across
  Boulevard's own internal repos (shopify-app, google-reserve-app, sched test fixtures)
  for local webhook development.
- ngrok is **SOC 2 Type 2 certified** and HIPAA/GDPR compliant.
- For **production** webhook routing, Boulevard uses **Hookdeck** instead.
- The free tier has a 2-hour session limit and shows an interstitial warning page.
- Some enterprise security teams block ngrok — **check with your security team** if
  you're unsure whether it's allowed at your org.
- You can also use Boulevard's `pingWebhook` GraphQL mutation to test without any
  tunnel at all — it sends a test PING payload to your registered URL.

### Webhook best practices

- **Return 2xx within 5-10 seconds.** Do heavy processing asynchronously.
- **Use idempotencyKey to deduplicate.** Events may arrive more than once or out of order.
- **Auto-disabled on failure.** After 8+ hours of failures (15+ attempts), Boulevard
  disables the webhook. Monitor your endpoint.
- **429 is safe.** Returning 429 (rate limited) doesn't count as a failure.

---

## Rate Limiting

Boulevard uses **cost-based** rate limiting, not request-count.

- **Bucket size:** 10,000 cost points
- **Leak rate:** 50 points per second
- **Query depth limit:** 10 levels
- **Connection limit:** 1,000 edges max per query

Every GraphQL field has an integer cost. Your query's total cost is the sum of all
requested field costs. Request only what you need.

If you get rate limited (HTTP 429), wait and retry. Don't increase request frequency.

For high-volume use, contact dev-support@blvd.co to discuss higher rate limit tiers.

---

## SDK

### @boulevard/blvd-book-sdk

The official TypeScript SDK for building booking flows. Use this instead of raw GraphQL
for anything involving the booking workflow.

```bash
npm install @boulevard/blvd-book-sdk
```

```javascript
import { Blvd } from '@boulevard/blvd-book-sdk';

const client = new Blvd({ apiKey: 'your-api-key', businessId: 'your-business-id' });

// Get business info
const business = await client.businesses.get();

// Get locations
const locations = await client.locations.list();

// Create a cart (starts the booking flow)
const cart = await client.carts.create({ locationId: 'location-id' });

// Browse available services
const categories = await cart.getAvailableCategories();
const items = await categories[0].getAvailableItems();

// Add a service to the cart
await cart.addBookableItem({ itemId: items[0].id });

// Get available dates and times
const dates = await cart.getBookableDates({ searchRangeLower: '2026-05-15', searchRangeUpper: '2026-06-15' });
const times = await cart.getBookableTimes({ date: dates[0] });

// Reserve a time
await cart.reserveBookableItems({ bookableTimeId: times[0].id });

// Set client info and checkout
await cart.setClientInformation({ firstName: 'Test', lastName: 'User', email: 'test@example.com' });
await cart.checkout();
```

The SDK handles pagination, auth, and the GraphQL layer. Documentation:
[boulevard.github.io/book-sdk](https://boulevard.github.io/book-sdk/)
