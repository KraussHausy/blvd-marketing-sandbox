# Boulevard Marketing Sandbox

A blank canvas for testing marketing workflows with Boulevard. Clone it, run the setup wizard, and you'll have a branded site in under 2 minutes.

## 30-Second Start

Pick whichever style suits you:

**Option A — Interactive wizard** (guided prompts):
```bash
git clone https://github.com/KraussHausy/blvd-marketing-sandbox.git
cd blvd-marketing-sandbox
./setup.sh        # answer the prompts → generates your branded site
make serve         # preview at http://localhost:8080
```

**Option B — Mad libs** (fill in a template yourself):
```bash
git clone https://github.com/KraussHausy/blvd-marketing-sandbox.git
cd blvd-marketing-sandbox
make quickstart    # copies the template to brand.json
# open brand.json, replace the blanks, save
make build         # generate your site
make serve         # preview at http://localhost:8080
```

Both paths produce the same result — a branded static site generated from `brand.json`.

## Commands

| Command | What it does |
|---------|-------------|
| `./setup.sh` | Interactive setup wizard — run once to create `brand.json` and generate your site |
| `make quickstart` | Copy the mad-libs template to `brand.json` for manual editing |
| `make build` | Regenerate the site from `brand.json` + templates (after editing brand.json) |
| `make serve` | Start local preview server on port 8080 |
| `make add-page NAME=pricing` | Create a new blank page |
| `make api-setup` | Install API dependencies and create `.env` |
| `make webhooks` | Start the Boulevard webhook listener |
| `make sync` | Export all Boulevard clients as JSON |
| `make clean` | Remove generated HTML (keeps templates + config) |
| `make help` | Show all commands |

## How It Works

```
brand.json          ← your brand config (created by setup.sh)
     ↓
templates/          ← HTML templates with {{placeholders}}
     ↓
scripts/generate.js ← reads config, fills templates, writes site files
     ↓
index.html, about.html, css/style.css, etc.  ← your branded site
```

**Edit `brand.json` → run `make build` → site updates.** Change your colors, fonts, brand name, or which pages exist — all from one config file.

## What Gets Generated

The setup wizard asks which pages you want. All pages include:
- Your brand name, colors, and fonts applied automatically
- `<!-- HEAD SNIPPETS -->` zone for tracking scripts (Klaviyo, GA4, Meta Pixel, HubSpot)
- `<!-- BODY SNIPPETS -->` zone for widgets (Boulevard SBO, chat, popups)
- Nav links to all your active pages
- Footer with your contact info and social links

If you provided integration IDs during setup (Klaviyo, GA4, Meta Pixel, HubSpot), those tracking scripts are automatically injected.

### Pages

| Page | What it's for |
|------|--------------|
| **Home** (index.html) | Hero with brand name + tagline, commented-out section starters |
| **About** (about.html) | Blank page with writing prompts to fill in your story |
| **Services** (services.html) | Card grid template + Boulevard SBO booking widget zone |
| **Contact** (contact.html) | Placeholder form (replace with HubSpot/Klaviyo embed) + contact info |
| **Brand Guide** (brand-guide.html) | Auto-populated with your colors and fonts from brand.json |

### Adding more pages

```bash
make add-page NAME=pricing
make add-page NAME=gallery
make add-page NAME=faq
```

This creates a new `.html` file with your brand's nav, footer, and snippet zones already wired up. Add a link in your nav to include it in site navigation.

---

## brand.json Reference

The config file is the single source of truth. Here's the full structure:

```json
{
  "brand": {
    "name": "My Brand",
    "tagline": "Your tagline here",
    "industry": "salon"
  },
  "contact": {
    "address": "123 Main Street",
    "cityState": "Your City, ST 00000",
    "phone": "(555) 123-4567",
    "email": "hello@yourbrand.com"
  },
  "social": {
    "instagram": "https://instagram.com/yourbrand",
    "tiktok": "",
    "facebook": ""
  },
  "colors": {
    "background": "#ffffff",
    "text": "#222222",
    "accent": "#2a5bd7",
    "border": "#e5e5e5"
  },
  "fonts": {
    "heading": "DM Serif Display",
    "body": "DM Sans"
  },
  "pages": {
    "home": "y",
    "about": "y",
    "services": "y",
    "contact": "n",
    "brandGuide": "y"
  },
  "boulevard": {
    "businessId": "",
    "apiKey": "",
    "environment": "sandbox"
  },
  "integrations": {
    "klaviyoSiteId": "",
    "hubspotPortalId": "",
    "googleAnalyticsId": "",
    "metaPixelId": ""
  }
}
```

Edit any value and run `make build` to regenerate.

---

## Boulevard API & Webhooks

### Sync client data

```bash
make api-setup              # install deps, create .env
# edit api/.env with your Boulevard API key

make sync                   # export all clients as JSON
make sync > clients.json    # save to file
cd api && npm run push-klaviyo    # sync to Klaviyo
cd api && npm run push-hubspot    # sync to HubSpot
```

### Webhook listener

```bash
make webhooks
# Listening on http://localhost:3001/webhooks/boulevard
```

For local testing, expose your listener with a tunnel:
```bash
ngrok http 3001
# paste the https URL into Boulevard > Settings > Developers > Webhooks
```

Note: ngrok is widely used for local webhook development (including across Boulevard's own repos) but is not officially endorsed. For production webhook routing, Boulevard uses Hookdeck. Check with your security team if you're unsure whether ngrok is approved at your org.

---

## Setting Up Forms

### Klaviyo
1. Klaviyo > Sign Up Forms > Create Form > Publish
2. Paste the `<script>` into `<!-- HEAD SNIPPETS -->`
3. For embedded forms, paste the `<div>` where you want it

### HubSpot
1. HubSpot > Marketing > Forms > Create Form > Publish > Embed
2. Paste the `<script>` + `<div>` into your page, replacing the placeholder form

### Mailchimp
1. Mailchimp > Audience > Signup Forms > Embedded Forms
2. Copy the HTML and paste where you want the form

### Boulevard SBO (booking widget)
1. Boulevard > Settings > Online Booking > Self-Booking Online
2. Paste the embed code into `<!-- BODY SNIPPETS -->`:
   ```html
   <blvd-book-button business-id="YOUR_ID">Book Now</blvd-book-button>
   ```

If you entered your Boulevard Business ID during setup, the SBO script tag is already injected.

---

## File Structure

```
blvd-marketing-sandbox/
├── setup.sh                    # Interactive setup wizard
├── brand-quickstart.json       # Mad-libs template (make quickstart)
├── brand.json                  # Your brand config (generated by setup.sh or quickstart)
├── Makefile                    # All commands (make help)
├── templates/                  # HTML templates with {{placeholders}}
│   ├── head.html, nav.html, footer.html
│   ├── page-home.html, page-about.html, ...
│   └── page-brand-guide.html
├── scripts/
│   ├── generate.js             # Reads brand.json → writes site files
│   └── add-page.js             # Creates new pages
├── index.html                  # Generated (don't edit directly — edit templates)
├── css/style.css               # Generated from brand.json colors/fonts
├── js/main.js                  # Your custom JS
├── images/                     # Your images
├── api/
│   ├── .env.example
│   ├── blvd-client-sync.js
│   ├── webhook-server.js
│   └── examples/
│       ├── push-to-klaviyo.js
│       └── push-to-hubspot.js
├── coding-for-pms/             # Spec-driven dev skill for PMs
│   ├── SKILL.md
│   └── references/
└── README.md
```

## Tips

- **Don't edit generated HTML directly.** Edit `brand.json` or the files in `templates/`, then run `make build`. Direct edits get overwritten.
- **Don't commit `.env` files.** They contain API keys. `.gitignore` handles this.
- **Deploy to GitHub Pages:** Settings > Pages > Source: main branch > / (root). Free.
- **Boulevard API docs:** [developers.joinblvd.com](https://developers.joinblvd.com)
