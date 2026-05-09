# Boulevard Marketing Sandbox

A ready-to-go sandbox for testing marketing workflows with Boulevard. Clone it, customize it, break stuff, learn things.

**What's inside:**

- A multi-page website (GitHub Pages ready) with clearly marked snippet zones
- Boulevard API scripts for syncing client/audience data
- A webhook listener for testing Boulevard events
- A customizable brand guide template
- Setup guides for Klaviyo, HubSpot, Mailchimp, and Boulevard forms (below)

---

## Quick Start

### 1. Clone and deploy the website

```bash
# Fork this repo, then clone your fork
git clone https://github.com/YOUR_ORG/blvd-marketing-sandbox.git
cd blvd-marketing-sandbox
```

Enable GitHub Pages: **Settings > Pages > Source: Deploy from a branch > main > / (root)**

Your site will be live at `https://YOUR_ORG.github.io/blvd-marketing-sandbox/`

### 2. Set up the API tools

```bash
cd api
cp .env.example .env       # Fill in your Boulevard API key
npm install
```

### 3. Customize your brand

1. Open `css/style.css` and change the CSS variables in `:root` (colors, fonts)
2. Open `brand-guide.html` and fill in your brand details
3. Replace placeholder text across all `.html` files (search for "The Studio", "Your", "placeholder")

---

## Website Structure

| File | What it is |
|------|------------|
| `index.html` | Homepage — hero, about preview, services preview, newsletter signup, footer |
| `services.html` | Full services page with categories and a booking widget zone |
| `about.html` | About page — story, values, team grid |
| `contact.html` | Contact form, info cards, and a map embed zone |
| `brand-guide.html` | Customizable brand guide template (self-contained — its own CSS) |
| `css/style.css` | All site styles — edit the `:root` variables to rebrand instantly |
| `js/main.js` | Mobile nav, scroll animations, placeholder form handlers |

### Adding Snippets

Every page has clearly marked zones for pasting third-party code:

**In `<head>`** (tracking pixels, analytics):
```html
<!-- HEAD SNIPPETS — paste Klaviyo, GA4, Meta Pixel, HubSpot tracking here -->
```

**Before `</body>`** (widgets, popups, chat):
```html
<!-- BODY SNIPPETS — paste Boulevard SBO, Klaviyo popup, chat widgets here -->
```

**Newsletter section** in `index.html`:
Replace the `<form id="signup-form">` with your email platform's embed code.

**Contact form** in `contact.html`:
Replace the `<form id="contact-form">` with a HubSpot or Klaviyo form embed.

**Booking widget** in `services.html`:
Replace the placeholder with your Boulevard SBO embed or booking link.

---

## Boulevard API Sync

Scripts in the `api/` folder let you pull client data from Boulevard and push it to marketing platforms.

### Fetch clients

```bash
cd api
npm run fetch-clients       # Shows first 10 clients
npm run sync                # Exports all clients as JSON
npm run sync > clients.json # Save to file
```

### Push to marketing platforms

```bash
npm run push-klaviyo    # Sync clients to a Klaviyo list
npm run push-hubspot    # Sync clients to HubSpot contacts
```

Each script requires credentials in `.env` — see `.env.example` for which keys you need.

### Customize the sync

The scripts are in `api/examples/`. They're intentionally simple so you can modify them:

- Change which client fields get synced
- Add filtering (e.g., only sync clients from the last 30 days)
- Add tags or custom properties
- Schedule the sync with cron

---

## Webhooks

The webhook listener receives events from Boulevard in real time — new clients, completed appointments, orders, etc.

### Start the listener

```bash
cd api
npm run webhooks
# Listening on http://localhost:3001/webhooks/boulevard
```

### Expose it publicly for testing

Use [ngrok](https://ngrok.com) (free) to create a public URL:

```bash
ngrok http 3001
# Copy the https://xxxx.ngrok.io URL
```

Then in Boulevard: **Settings > Developers > Webhooks** — add a new webhook pointing to:
```
https://xxxx.ngrok.io/webhooks/boulevard
```

### Available events

The webhook server logs all incoming events. Common ones to test:

| Event | When it fires |
|-------|--------------|
| `client.created` | New client added |
| `client.updated` | Client profile changed |
| `appointment.created` | New appointment booked |
| `appointment.completed` | Appointment marked complete |
| `order.completed` | Product or service order completed |

Add your automation logic in `webhook-server.js` where the comment block says `Add your automation logic here`.

---

## Setting Up Forms on Marketing Platforms

### Klaviyo

**Email signup form (popup or embedded):**

1. In Klaviyo, go to **Sign Up Forms > Create Form**
2. Design your form and set the target list
3. Under **Targeting & Behavior**, set your display rules
4. Click **Publish** and copy the embed code
5. Paste the `<script>` tag into the `<!-- HEAD SNIPPETS -->` zone in your HTML files
6. For embedded forms, also paste the `<div>` into the newsletter section of `index.html`

**Klaviyo tracking (for website activity):**

1. In Klaviyo, go to **Settings > Setup > Active on Site**
2. Copy the JavaScript snippet (starts with `<script>`)
3. Paste it into the `<!-- HEAD SNIPPETS -->` zone on every page

**Klaviyo + Boulevard sync:**

Use `api/examples/push-to-klaviyo.js` to push Boulevard clients into a Klaviyo list. Set this up as a one-time import or schedule it to run regularly.

---

### HubSpot

**Embedded contact form:**

1. In HubSpot, go to **Marketing > Forms > Create Form**
2. Build your form (name, email, phone, message, etc.)
3. Click **Publish** and go to the **Embed** tab
4. Copy the embed code (it's a `<script>` + `<div>`)
5. Replace the placeholder `<form>` in `contact.html` with HubSpot's embed code

**HubSpot tracking code (for website analytics):**

1. In HubSpot, go to **Settings > Tracking & Analytics > Tracking Code**
2. Copy the JavaScript snippet
3. Paste it into the `<!-- HEAD SNIPPETS -->` zone on every page

**HubSpot + Boulevard sync:**

Use `api/examples/push-to-hubspot.js` to push Boulevard clients into HubSpot as contacts. The script uses the batch upsert API so it won't create duplicates.

---

### Mailchimp

**Email signup form (embedded):**

1. In Mailchimp, go to **Audience > Signup Forms > Embedded Forms**
2. Customize the fields you want (email, first name, last name)
3. Copy the generated HTML
4. Replace the placeholder `<form>` in the newsletter section of `index.html`

**Mailchimp popup:**

1. Go to **Audience > Signup Forms > Subscriber Pop-up**
2. Design and configure your popup
3. Click **Publish** — Mailchimp adds it via the connected site script
4. Paste the Mailchimp site connection `<script>` into `<!-- HEAD SNIPPETS -->`

**Mailchimp + Boulevard sync:**

The pattern is the same as Klaviyo/HubSpot. Use the Boulevard client sync script (`npm run sync`) to export clients as JSON, then use Mailchimp's API or CSV import to add them to an audience. A Mailchimp push script can be built following the pattern in `api/examples/push-to-klaviyo.js`.

---

### Boulevard Self-Booking Online (SBO)

**Add booking to your website:**

1. In Boulevard Dashboard, go to **Settings > Online Booking > Self-Booking Online**
2. Configure your booking flow (services, locations, etc.)
3. Copy the embed code — it looks like:
   ```html
   <script src="https://booking.boulevard.io/widget.js"></script>
   <blvd-book-button business-id="YOUR_BUSINESS_ID">Book Now</blvd-book-button>
   ```
4. Paste the `<script>` into `<!-- BODY SNIPPETS -->`
5. Add the `<blvd-book-button>` wherever you want the booking CTA

**Full-page booking:**

If you want a dedicated booking page instead of a widget, link directly to your Boulevard booking URL:
```html
<a href="https://booking.boulevard.io/YOUR_BUSINESS_ID" class="btn btn--primary">Book Online</a>
```

---

## Creating Your Own Brand Guide

The `brand-guide.html` file is a self-contained template. To customize it:

1. **Colors:** Update the CSS variables in the `<style>` block at the top
2. **Fonts:** Change the Google Fonts `<link>` to your brand fonts
3. **Logo:** Add your logo files to `images/` and update the `src` paths
4. **Content:** Replace all placeholder text with your real brand copy

The brand guide uses its own inline CSS (not `style.css`) so it can be shared independently.

### Quick brand customization checklist

- [ ] Update `:root` variables in `css/style.css` (site) and `brand-guide.html` (guide)
- [ ] Change Google Fonts in all HTML `<head>` sections
- [ ] Replace "The Studio" with your brand name (all HTML files)
- [ ] Add your logo to `images/`
- [ ] Fill in address, phone, email, and social links
- [ ] Write real service names, descriptions, and prices
- [ ] Complete the tone-of-voice section in the brand guide

---

## File Structure

```
blvd-marketing-sandbox/
├── index.html              # Homepage
├── services.html           # Services + booking widget zone
├── about.html              # About, values, team
├── contact.html            # Contact form + info
├── brand-guide.html        # Brand guide template
├── css/
│   └── style.css           # All styles (edit :root to rebrand)
├── js/
│   └── main.js             # Nav, animations, form handlers
├── images/                 # Drop your images here
├── api/
│   ├── package.json        # Node.js dependencies
│   ├── .env.example        # Credential template
│   ├── blvd-client-sync.js # Full client export from Boulevard
│   ├── webhook-server.js   # Webhook event listener
│   └── examples/
│       ├── fetch-clients.js    # Quick client fetch
│       ├── push-to-klaviyo.js  # Sync clients to Klaviyo
│       └── push-to-hubspot.js  # Sync clients to HubSpot
├── .gitignore
└── README.md               # This file
```

---

## Hosting

The website is pure HTML/CSS/JS — no build step, no framework, no backend. Deploy it anywhere:

- **GitHub Pages** (free) — just enable it in repo settings
- **Netlify** — drag and drop the repo
- **Vercel** — connect the repo
- Any static hosting

The `api/` scripts run separately on your local machine (or a server). They're not part of the hosted website.

---

## Tips

- **Don't commit `.env` files.** They contain API keys. The `.gitignore` already excludes them.
- **Test webhooks locally** with ngrok before pointing Boulevard at a real server.
- **Start small.** Get the website running first, then add snippets one at a time.
- **Check the Boulevard API docs** at [developers.joinblvd.com](https://developers.joinblvd.com) for the full GraphQL schema and available queries.
