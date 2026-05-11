# Boulevard Marketing Sandbox

A blank canvas for testing marketing workflows with Boulevard. Clone it, build whatever you need, break stuff, learn things.

## What's in the box

| Thing | What it is |
|-------|-----------|
| `index.html` | Empty starter page with snippet zones for tracking/widgets |
| `brand-guide.html` | Blank brand guide template — fill in as you go |
| `css/style.css` | Minimal CSS with brand variables at the top |
| `js/main.js` | Empty JS file — add what you need |
| `api/` | Boulevard API sync scripts + webhook listener |

---

## Quick Start

### 1. Get the site running

```bash
git clone https://github.com/YOUR_ORG/blvd-marketing-sandbox.git
cd blvd-marketing-sandbox
```

**Local preview:** open `index.html` in a browser, or:
```bash
python3 -m http.server 8080
# visit http://localhost:8080
```

**Deploy to GitHub Pages:** Settings > Pages > Source: main branch > / (root). Done.

### 2. Make it yours

Open `css/style.css` and change the variables at the top:

```css
:root {
  --color-bg:      #ffffff;    /* page background */
  --color-text:    #222222;    /* body text */
  --color-accent:  #2a5bd7;    /* links, buttons, highlights */
  --color-border:  #e5e5e5;    /* borders, dividers */
  --font-body:     system-ui;  /* swap for Google Fonts, etc. */
}
```

### 3. Add pages

Create new `.html` files as needed. Copy the structure from `index.html` — the `<head>`, `<nav>`, and snippet zones.

### 4. Set up the API tools (optional)

```bash
cd api
cp .env.example .env    # fill in your credentials
npm install
```

---

## Adding Snippets

Every page has two clearly marked zones for pasting third-party code:

```html
<!-- HEAD SNIPPETS — tracking pixels, analytics -->
<!-- (in the <head> section) -->

<!-- BODY SNIPPETS — widgets, popups, chat -->
<!-- (before </body>) -->
```

Just paste the code from your platform into the right zone.

---

## Boulevard API & Webhooks

### Sync client data

```bash
cd api
npm run fetch-clients       # preview first 10 clients
npm run sync                # export all clients as JSON
npm run sync > clients.json # save to file
npm run push-klaviyo        # sync clients to Klaviyo
npm run push-hubspot        # sync clients to HubSpot
```

Each script needs credentials in `.env` — see `.env.example` for which keys.

### Listen for webhooks

```bash
cd api
npm run webhooks
# Listening on http://localhost:3001/webhooks/boulevard
```

Expose locally with [ngrok](https://ngrok.com) for testing:
```bash
ngrok http 3001
# paste the https URL into Boulevard > Settings > Developers > Webhooks
```

The server logs every event it receives. Add your automation logic in `webhook-server.js` where the comments say to.

---

## Setting Up Forms

### Klaviyo

**Signup form (popup or embedded):**
1. Klaviyo > Sign Up Forms > Create Form
2. Design it, set the target list
3. Publish and copy the embed code
4. Paste the `<script>` into `<!-- HEAD SNIPPETS -->`
5. For embedded forms, paste the `<div>` wherever you want it in your HTML

**Site tracking:**
1. Klaviyo > Settings > Setup > Active on Site
2. Copy the JS snippet
3. Paste into `<!-- HEAD SNIPPETS -->` on every page

**Boulevard client sync:** `npm run push-klaviyo` (see API section above)

---

### HubSpot

**Embedded form:**
1. HubSpot > Marketing > Forms > Create Form
2. Build your form, click Publish > Embed tab
3. Copy the embed code (`<script>` + `<div>`)
4. Paste into your HTML where you want the form

**Tracking code:**
1. HubSpot > Settings > Tracking & Analytics > Tracking Code
2. Copy the JS snippet
3. Paste into `<!-- HEAD SNIPPETS -->` on every page

**Boulevard client sync:** `npm run push-hubspot` (see API section above)

---

### Mailchimp

**Embedded signup form:**
1. Mailchimp > Audience > Signup Forms > Embedded Forms
2. Customize fields, copy the HTML
3. Paste into your page where you want the form

**Popup:**
1. Mailchimp > Audience > Signup Forms > Subscriber Pop-up
2. Design and publish
3. Paste the Mailchimp site connection `<script>` into `<!-- HEAD SNIPPETS -->`

**Boulevard client sync:** Export clients with `npm run sync > clients.json`, then import via Mailchimp's audience CSV import or build a push script following the pattern in `api/examples/push-to-klaviyo.js`.

---

### Boulevard Self-Booking Online (SBO)

**Booking widget:**
1. Boulevard Dashboard > Settings > Online Booking > Self-Booking Online
2. Copy the embed code:
   ```html
   <script src="https://booking.boulevard.io/widget.js"></script>
   <blvd-book-button business-id="YOUR_BUSINESS_ID">Book Now</blvd-book-button>
   ```
3. Paste the `<script>` into `<!-- BODY SNIPPETS -->`
4. Put the `<blvd-book-button>` wherever you want it

**Direct link (no widget):**
```html
<a href="https://booking.boulevard.io/YOUR_BUSINESS_ID">Book Online</a>
```

---

## File Structure

```
blvd-marketing-sandbox/
├── index.html              # Starter page (blank canvas + snippet zones)
├── brand-guide.html        # Brand guide template (fill in as you go)
├── css/style.css           # Minimal CSS with brand variables
├── js/main.js              # Empty — add your own JS
├── images/                 # Drop images here
├── api/
│   ├── .env.example        # Credential template (never commit .env)
│   ├── package.json
│   ├── blvd-client-sync.js # Export all clients from Boulevard
│   ├── webhook-server.js   # Receive Boulevard webhook events
│   └── examples/
│       ├── fetch-clients.js
│       ├── push-to-klaviyo.js
│       └── push-to-hubspot.js
└── README.md
```

## Tips

- **Don't commit `.env` files.** They contain API keys. `.gitignore` already handles this.
- **Test webhooks locally** with ngrok before connecting Boulevard to a real endpoint.
- **Check the Boulevard API docs** at [developers.joinblvd.com](https://developers.joinblvd.com) for the full GraphQL schema.
- **Add pages freely.** Just create a new `.html` file and copy the snippet zones from `index.html`.
