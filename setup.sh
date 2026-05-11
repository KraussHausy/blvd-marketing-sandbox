#!/bin/bash
# ============================================================
# Boulevard Marketing Sandbox — Setup Wizard
# Run this once after cloning to configure your brand.
# Usage: ./setup.sh
# ============================================================

set -e

BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   Boulevard Marketing Sandbox — Setup        ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${DIM}Answer the prompts below to generate your branded site.${RESET}"
echo -e "${DIM}Press Enter to accept the default [shown in brackets].${RESET}"
echo ""

# ---- Brand basics ----
echo -e "${CYAN}── Brand ──${RESET}"

read -p "Brand name [My Brand]: " BRAND_NAME
BRAND_NAME="${BRAND_NAME:-My Brand}"

read -p "Tagline [Your tagline here]: " TAGLINE
TAGLINE="${TAGLINE:-Your tagline here}"

read -p "Industry (salon, spa, medspa, barbershop, wellness, other) [salon]: " INDUSTRY
INDUSTRY="${INDUSTRY:-salon}"

# ---- Contact info ----
echo ""
echo -e "${CYAN}── Contact Info ──${RESET}"

read -p "Address line 1 [123 Main Street]: " ADDRESS
ADDRESS="${ADDRESS:-123 Main Street}"

read -p "City, State ZIP [Your City, ST 00000]: " CITY_STATE
CITY_STATE="${CITY_STATE:-Your City, ST 00000}"

read -p "Phone [(555) 123-4567]: " PHONE
PHONE="${PHONE:-(555) 123-4567}"

read -p "Email [hello@yourbrand.com]: " EMAIL
EMAIL="${EMAIL:-hello@yourbrand.com}"

# ---- Social links ----
echo ""
echo -e "${CYAN}── Social (leave blank to skip) ──${RESET}"

read -p "Instagram URL: " INSTAGRAM
read -p "TikTok URL: " TIKTOK
read -p "Facebook URL: " FACEBOOK

# ---- Colors ----
echo ""
echo -e "${CYAN}── Brand Colors (hex codes) ──${RESET}"
echo -e "${DIM}Tip: use your brand guide or pick from coolors.co${RESET}"

read -p "Background color [#ffffff]: " COLOR_BG
COLOR_BG="${COLOR_BG:-#ffffff}"

read -p "Text color [#222222]: " COLOR_TEXT
COLOR_TEXT="${COLOR_TEXT:-#222222}"

read -p "Accent color [#2a5bd7]: " COLOR_ACCENT
COLOR_ACCENT="${COLOR_ACCENT:-#2a5bd7}"

read -p "Border color [#e5e5e5]: " COLOR_BORDER
COLOR_BORDER="${COLOR_BORDER:-#e5e5e5}"

# ---- Fonts ----
echo ""
echo -e "${CYAN}── Typography ──${RESET}"
echo -e "${DIM}Enter a Google Fonts family name, or press Enter for system fonts.${RESET}"

read -p "Heading font [system-ui]: " FONT_HEADING
FONT_HEADING="${FONT_HEADING:-system-ui}"

read -p "Body font [system-ui]: " FONT_BODY
FONT_BODY="${FONT_BODY:-system-ui}"

# ---- Pages ----
echo ""
echo -e "${CYAN}── Pages ──${RESET}"
echo -e "${DIM}Which pages do you want generated? (y/n for each)${RESET}"

read -p "Homepage? [Y/n]: " WANT_HOME
WANT_HOME="${WANT_HOME:-y}"

read -p "About page? [y/N]: " WANT_ABOUT
WANT_ABOUT="${WANT_ABOUT:-n}"

read -p "Services page? [y/N]: " WANT_SERVICES
WANT_SERVICES="${WANT_SERVICES:-n}"

read -p "Contact page? [y/N]: " WANT_CONTACT
WANT_CONTACT="${WANT_CONTACT:-n}"

read -p "Brand guide? [Y/n]: " WANT_BRAND_GUIDE
WANT_BRAND_GUIDE="${WANT_BRAND_GUIDE:-y}"

# ---- Boulevard ----
echo ""
echo -e "${CYAN}── Boulevard Integration (optional) ──${RESET}"
echo -e "${DIM}Leave blank if you don't have these yet.${RESET}"

read -p "Boulevard Business ID: " BLVD_BUSINESS_ID
read -p "Boulevard API Key: " BLVD_API_KEY

read -p "Use sandbox environment? [Y/n]: " USE_SANDBOX
USE_SANDBOX="${USE_SANDBOX:-y}"

# ---- Marketing platforms ----
echo ""
echo -e "${CYAN}── Marketing Platforms (optional) ──${RESET}"

read -p "Klaviyo public site ID (for embed code): " KLAVIYO_SITE_ID
read -p "HubSpot portal ID: " HUBSPOT_PORTAL_ID
read -p "Google Analytics measurement ID (G-XXXXXXX): " GA_ID
read -p "Meta Pixel ID: " META_PIXEL_ID

# ============================================================
# Save to brand.json
# ============================================================

echo ""
echo -e "${YELLOW}Saving configuration...${RESET}"

cat > brand.json << ENDJSON
{
  "brand": {
    "name": "$BRAND_NAME",
    "tagline": "$TAGLINE",
    "industry": "$INDUSTRY"
  },
  "contact": {
    "address": "$ADDRESS",
    "cityState": "$CITY_STATE",
    "phone": "$PHONE",
    "email": "$EMAIL"
  },
  "social": {
    "instagram": "$INSTAGRAM",
    "tiktok": "$TIKTOK",
    "facebook": "$FACEBOOK"
  },
  "colors": {
    "background": "$COLOR_BG",
    "text": "$COLOR_TEXT",
    "accent": "$COLOR_ACCENT",
    "border": "$COLOR_BORDER"
  },
  "fonts": {
    "heading": "$FONT_HEADING",
    "body": "$FONT_BODY"
  },
  "pages": {
    "home": "$(echo $WANT_HOME | tr '[:upper:]' '[:lower:]' | head -c1)",
    "about": "$(echo $WANT_ABOUT | tr '[:upper:]' '[:lower:]' | head -c1)",
    "services": "$(echo $WANT_SERVICES | tr '[:upper:]' '[:lower:]' | head -c1)",
    "contact": "$(echo $WANT_CONTACT | tr '[:upper:]' '[:lower:]' | head -c1)",
    "brandGuide": "$(echo $WANT_BRAND_GUIDE | tr '[:upper:]' '[:lower:]' | head -c1)"
  },
  "boulevard": {
    "businessId": "$BLVD_BUSINESS_ID",
    "apiKey": "$BLVD_API_KEY",
    "environment": "$([ "$(echo $USE_SANDBOX | tr '[:upper:]' '[:lower:]' | head -c1)" = "n" ] && echo 'production' || echo 'sandbox')"
  },
  "integrations": {
    "klaviyoSiteId": "$KLAVIYO_SITE_ID",
    "hubspotPortalId": "$HUBSPOT_PORTAL_ID",
    "googleAnalyticsId": "$GA_ID",
    "metaPixelId": "$META_PIXEL_ID"
  }
}
ENDJSON

echo -e "${GREEN}✓ Saved brand.json${RESET}"

# ============================================================
# Generate site files
# ============================================================

echo -e "${YELLOW}Generating site...${RESET}"

# Run the Node.js generator
node scripts/generate.js

echo ""
echo -e "${GREEN}${BOLD}✓ Setup complete!${RESET}"
echo ""
echo -e "  Your site is ready. Here's what to do next:"
echo ""
echo -e "  ${BOLD}Preview locally:${RESET}"
echo -e "    make serve"
echo ""
echo -e "  ${BOLD}Regenerate after editing brand.json:${RESET}"
echo -e "    make build"
echo ""
echo -e "  ${BOLD}Set up API tools:${RESET}"
echo -e "    make api-setup"
echo ""
echo -e "  ${BOLD}See all commands:${RESET}"
echo -e "    make help"
echo ""
