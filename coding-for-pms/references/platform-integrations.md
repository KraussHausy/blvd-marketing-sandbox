# Platform Integration Guide

Step-by-step setup for connecting marketing platforms to your Boulevard test site.
Each section is self-contained — jump to the one you need.

## Table of Contents

1. [Klaviyo](#klaviyo)
2. [HubSpot](#hubspot)
3. [Mailchimp](#mailchimp)
4. [Boulevard SBO (Self-Booking Online)](#boulevard-sbo)
5. [Google Analytics / GA4](#google-analytics)
6. [Meta Pixel](#meta-pixel)

---

## Klaviyo

### Email signup form (popup or embedded)

1. In Klaviyo, go to **Sign Up Forms > Create Form**
2. Choose popup or embedded, design it, set the target list
3. Under **Targeting & Behavior**, configure when/where it shows
4. Click **Publish** and copy the embed code

**For popups** — paste the `<script>` into your site's `<!-- HEAD SNIPPETS -->` zone.
The popup will appear based on your targeting rules.

**For embedded forms** — paste both the `<script>` (in HEAD SNIPPETS) and the `<div>`
(wherever you want the form to appear in your HTML).

### Site tracking

Tracks which pages visitors view (used for segmentation and flows):

1. In Klaviyo, go to **Settings > Setup > Active on Site**
2. Copy the JavaScript snippet
3. Paste into `<!-- HEAD SNIPPETS -->` on every page

### Syncing Boulevard clients to Klaviyo

Use the API sync script to push Boulevard clients into a Klaviyo list:

```bash
cd api
# Set these in .env:
# BLVD_API_KEY, KLAVIYO_API_KEY, KLAVIYO_LIST_ID
npm run push-klaviyo
```

The script fetches clients from Boulevard (Admin API), then adds each one to your
Klaviyo list with their name, email, and phone. It uses the Klaviyo v3 API
(`profile-subscription-bulk-create-jobs` endpoint).

### Klaviyo API keys

- **Public API key** (site ID): used in embed code, safe to put in HTML
- **Private API key**: used in server-side scripts, never in HTML. Goes in `.env`

---

## HubSpot

### Embedded contact form

1. In HubSpot, go to **Marketing > Forms > Create Form**
2. Add fields (name, email, phone, message, etc.)
3. Click **Publish**, then the **Embed** tab
4. Copy the embed code — it's a `<script>` tag plus a `<div>`
5. Replace any placeholder `<form>` in your HTML with HubSpot's embed

### Tracking code

Enables HubSpot to track page visits, form fills, and conversions:

1. Go to **Settings > Tracking & Analytics > Tracking Code**
2. Copy the JavaScript snippet
3. Paste into `<!-- HEAD SNIPPETS -->` on every page

### Syncing Boulevard clients to HubSpot

```bash
cd api
# Set these in .env:
# BLVD_API_KEY, HUBSPOT_ACCESS_TOKEN
npm run push-hubspot
```

Uses the HubSpot batch upsert API, so it won't create duplicates — it matches on email
and updates existing contacts.

### HubSpot authentication

- **Tracking code**: No auth needed, just paste the snippet
- **Forms**: No auth needed, embedded forms handle it
- **API (for syncing)**: Requires a **Private App Access Token**
  - Go to **Settings > Integrations > Private Apps > Create**
  - Grant `crm.objects.contacts.write` scope
  - Copy the access token into `.env` as `HUBSPOT_ACCESS_TOKEN`

---

## Mailchimp

### Embedded signup form

1. In Mailchimp, go to **Audience > Signup Forms > Embedded Forms**
2. Select which fields to include (email, first name, last name)
3. Copy the generated HTML
4. Paste it where you want the form in your page

Mailchimp's embedded forms are plain HTML — no JavaScript needed.

### Popup form

1. Go to **Audience > Signup Forms > Subscriber Pop-up**
2. Design your popup and configure display rules
3. Click **Publish**
4. Paste the Mailchimp site connection `<script>` into `<!-- HEAD SNIPPETS -->`

### Syncing Boulevard clients to Mailchimp

Export from Boulevard, then import to Mailchimp:

```bash
cd api
npm run sync > clients.json
```

Then in Mailchimp: **Audience > Import Contacts > CSV or Tab-delimited File**.
Or use the Mailchimp API to build a push script (follow the pattern in
`api/examples/push-to-klaviyo.js`).

### Mailchimp API keys

- **API key**: Found in **Account > Extras > API keys**
- **Server prefix**: The `us1`, `us2`, etc. part of your Mailchimp URL
- **List/Audience ID**: Found in **Audience > Settings > Audience name and defaults**

---

## Boulevard SBO

Boulevard's Self-Booking Online widget lets clients book directly from your website.

### Embed the booking widget

1. In Boulevard Dashboard: **Settings > Online Booking > Self-Booking Online**
2. Configure your booking flow (services, staff, locations)
3. Copy the embed code:

```html
<script src="https://booking.boulevard.io/widget.js"></script>
<blvd-book-button business-id="YOUR_BUSINESS_ID">Book Now</blvd-book-button>
```

4. Paste the `<script>` into `<!-- BODY SNIPPETS -->`
5. Place the `<blvd-book-button>` wherever you want the booking CTA

### Direct booking link (no widget)

If you want a simple link instead of an embedded widget:

```html
<a href="https://booking.boulevard.io/YOUR_BUSINESS_ID" class="btn">Book Online</a>
```

### Custom booking flow

For fully custom booking experiences, use the `@boulevard/blvd-book-sdk`. See the
Boulevard API reference file for SDK usage patterns. Boulevard also has a starter kit:
[github.com/Boulevard/create-booking-flow](https://github.com/Boulevard/create-booking-flow)
(Next.js + Material UI).

---

## Google Analytics

### GA4 setup

1. In Google Analytics, go to **Admin > Data Streams > Web**
2. Copy the Global Site Tag (gtag.js snippet)
3. Paste into `<!-- HEAD SNIPPETS -->` on every page

The snippet looks like:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Google Tag Manager

If using GTM instead of direct GA4:

1. In GTM, copy the container snippet (two parts — head and body)
2. Paste the `<script>` part into `<!-- HEAD SNIPPETS -->`
3. Paste the `<noscript>` part right after `<body>`

GTM lets you manage all tags (GA4, Meta Pixel, Klaviyo, etc.) from one interface.

---

## Meta Pixel

### Setup

1. In Meta Events Manager, go to **Data Sources > Pixels > Add**
2. Copy the base pixel code
3. Paste into `<!-- HEAD SNIPPETS -->` on every page

The pixel code looks like:

```html
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

### Event tracking

Add standard events for conversion tracking:

```html
<!-- On a booking confirmation page -->
<script>fbq('track', 'Schedule');</script>

<!-- On a purchase page -->
<script>fbq('track', 'Purchase', {value: 55.00, currency: 'USD'});</script>
```
