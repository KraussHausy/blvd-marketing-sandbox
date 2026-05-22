# Boulevard Marketing Sandbox

A blank canvas for testing marketing workflows with Boulevard. Clone it, paste a prompt, and you'll have a branded site in 30 seconds.

## 30-Second Start

```bash
git clone https://github.com/KraussHausy/blvd-marketing-sandbox.git
cd blvd-marketing-sandbox
```

Then copy the prompt below, fill in the blanks, and paste it into Claude Code:

---

> **Set up my marketing sandbox.**
>
> - **Brand name:** ___________
> - **Tagline:** ___________
> - **Industry:** salon / spa / medspa / barbershop / wellness / other
> - **Colors:** accent = ___________ , background = ___________ (color names or hex codes)
> - **Fonts:** heading = ___________ , body = ___________ (Google Fonts or "system-ui")
> - **Pages I want:** home, about, services, contact, brand guide (delete any you don't need)
> - **Address:** ___________
> - **Phone:** ___________
> - **Email:** ___________
> - **Instagram:** ___________
>
> Generate my brand.json, run `make build`, and start the preview server.

---

That's it. Claude creates your config, generates the site, and opens a preview. Change anything later by editing `brand.json` and running `make build`.

### Without Claude

You can also set up manually:
- `./setup.sh` — interactive terminal wizard
- `make quickstart` — copy a template to `brand.json`, fill it in, run `make build`

## Commands

| Command | What it does |
|---------|-------------|
| `make build` | Generate (or regenerate) the site from `brand.json` |
| `make serve` | Start local preview server on port 8080 |
| `make add-page NAME=pricing` | Create a new blank page |
| `make api-setup` | Install API dependencies and create `.env` |
| `make webhooks` | Start the Boulevard webhook listener |
| `make sync` | Export all Boulevard clients as JSON |
| `make clean` | Remove generated HTML (keeps templates + config) |
| `make help` | Show all commands |
| `./setup.sh` | Interactive terminal wizard (alternative to the prompt) |
| `make quickstart` | Copy a fill-in-the-blanks template to `brand.json` |

## How It Works

```
Your prompt → Claude writes brand.json → make build → branded site
```

Everything flows from `brand.json` — one config file that drives the whole site. Edit it and run `make build` anytime to regenerate.

## What Gets Generated

Every page includes:
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
1. Klaviyo > Sign Up Forms > Create Form > choose **Popup** or **Flyout**
2. Design your form, set targeting/triggers, click Publish
3. Paste the Klaviyo site snippet into `<!-- HEAD SNIPPETS -->`:
   ```html
   <script async src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=YOUR_SITE_ID"></script>
   ```
4. That's it — the popup loads automatically based on your Klaviyo targeting rules. No extra HTML needed on the page.

### Mailchimp
1. Mailchimp > Audience > Signup Forms > **Subscriber Pop-up**
2. Design your popup, set display rules, click Save
3. Mailchimp gives you a JS snippet — paste it into `<!-- HEAD SNIPPETS -->`:
   ```html
   <script id="mcjs">!function(c,h,i,m,p){m=c.createElement(h),p=c.getElementsByTagName(h)[0],m.async=1,m.src=i,p.parentNode.insertBefore(m,p)}(document,"script","https://chimpstatic.com/mcjs-connected/js/users/YOUR_ID/YOUR_HASH.js");</script>
   ```
4. The popup fires automatically based on your Mailchimp display rules.

### HubSpot
1. HubSpot > Marketing > Forms > Create Form > Publish > Embed
2. Paste the `<script>` + `<div>` into your page, replacing the placeholder form

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
