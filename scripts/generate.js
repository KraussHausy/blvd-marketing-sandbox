#!/usr/bin/env node

/**
 * Site Generator
 *
 * Reads brand.json and templates/ to produce a fully branded static site.
 * Run directly: node scripts/generate.js
 * Or via make: make build
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Load brand config ──────────────────────────────────────

const configPath = join(ROOT, 'brand.json');
if (!existsSync(configPath)) {
  console.error('brand.json not found. Run ./setup.sh first, or create it manually.');
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const { brand, contact, social, colors, fonts, pages, boulevard, integrations } = config;

// ── Template helpers ───────────────────────────────────────

function readTemplate(name) {
  return readFileSync(join(ROOT, 'templates', name), 'utf-8');
}

function googleFontsLink() {
  const families = [];
  if (fonts.heading && fonts.heading !== 'system-ui') {
    families.push(fonts.heading.replace(/ /g, '+') + ':wght@400;600;700');
  }
  if (fonts.body && fonts.body !== 'system-ui' && fonts.body !== fonts.heading) {
    families.push(fonts.body.replace(/ /g, '+') + ':wght@300;400;500');
  }
  if (families.length === 0) return '';
  return `  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap" rel="stylesheet">\n`;
}

function fontCSS(name) {
  if (!name || name === 'system-ui') return 'system-ui, -apple-system, sans-serif';
  return `'${name}', system-ui, sans-serif`;
}

function snippet(id, template) {
  if (!id) return '';
  return template.replace(/{{ID}}/g, id) + '\n';
}

// ── Build snippet blocks ───────────────────────────────────

const klaviyoSnippet = snippet(integrations.klaviyoSiteId,
  `  <script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id={{ID}}"></script>\n`);

const gaSnippet = snippet(integrations.googleAnalyticsId,
  `  <script async src="https://www.googletagmanager.com/gtag/js?id={{ID}}"></script>\n  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','{{ID}}');</script>\n`);

const metaPixelSnippet = snippet(integrations.metaPixelId,
  `  <script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','{{ID}}');fbq('track','PageView');</script>\n`);

const hubspotSnippet = snippet(integrations.hubspotPortalId,
  `  <script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/{{ID}}.js"></script>\n`);

const sboSnippet = boulevard.businessId
  ? `  <script src="https://booking.boulevard.io/widget.js"></script>\n`
  : '';

// ── Build nav links ────────────────────────────────────────

function navLink(page, file, label) {
  if (pages[page] !== 'y') return '';
  return `      <li><a href="${file}"{{${page.toUpperCase()}_ACTIVE}}>${label}</a></li>\n`;
}

const navAbout = navLink('about', 'about.html', 'About');
const navServices = navLink('services', 'services.html', 'Services');
const navContact = navLink('contact', 'contact.html', 'Contact');
const navBrandGuide = navLink('brandGuide', 'brand-guide.html', 'Brand Guide');

// ── Social links ───────────────────────────────────────────

function buildSocialLinks() {
  const links = [];
  if (social.instagram) links.push(`        <a href="${social.instagram}">Instagram</a>`);
  if (social.tiktok) links.push(`        <a href="${social.tiktok}">TikTok</a>`);
  if (social.facebook) links.push(`        <a href="${social.facebook}">Facebook</a>`);
  return links.length ? links.join('\n') + '\n' : '';
}

// ── Hero action links ──────────────────────────────────────

const heroServicesLink = pages.services === 'y'
  ? '        <a href="services.html" class="btn btn-primary">View Services</a>\n'
  : '';
const heroContactLink = pages.contact === 'y'
  ? '        <a href="contact.html" class="btn btn-outline">Get in Touch</a>\n'
  : '';

// ── Global replacements ────────────────────────────────────

const replacements = {
  '{{BRAND_NAME}}': brand.name,
  '{{TAGLINE}}': brand.tagline,
  '{{ADDRESS}}': contact.address,
  '{{CITY_STATE}}': contact.cityState,
  '{{PHONE}}': contact.phone,
  '{{EMAIL}}': contact.email,
  '{{COLOR_BG}}': colors.background,
  '{{COLOR_TEXT}}': colors.text,
  '{{COLOR_ACCENT}}': colors.accent,
  '{{COLOR_BORDER}}': colors.border,
  '{{FONT_HEADING}}': fonts.heading,
  '{{FONT_BODY}}': fonts.body,
  '{{FONT_HEADING_CSS}}': fontCSS(fonts.heading),
  '{{FONT_BODY_CSS}}': fontCSS(fonts.body),
  '{{GOOGLE_FONTS_LINK}}': googleFontsLink(),
  '{{KLAVIYO_SNIPPET}}': klaviyoSnippet,
  '{{GA_SNIPPET}}': gaSnippet,
  '{{META_PIXEL_SNIPPET}}': metaPixelSnippet,
  '{{HUBSPOT_SNIPPET}}': hubspotSnippet,
  '{{SBO_SNIPPET}}': sboSnippet,
  '{{NAV_ABOUT}}': navAbout,
  '{{NAV_SERVICES}}': navServices,
  '{{NAV_CONTACT}}': navContact,
  '{{NAV_BRAND_GUIDE}}': navBrandGuide,
  '{{SOCIAL_LINKS}}': buildSocialLinks(),
  '{{HERO_SERVICES_LINK}}': heroServicesLink,
  '{{HERO_CONTACT_LINK}}': heroContactLink,
};

function applyReplacements(text, extra = {}) {
  const all = { ...replacements, ...extra };
  for (const [token, value] of Object.entries(all)) {
    text = text.replaceAll(token, value);
  }
  // Clean up any unused active markers
  text = text.replace(/\{\{[A-Z_]+_ACTIVE\}\}/g, '');
  return text;
}

// ── Build partials ─────────────────────────────────────────

function buildHead(pageTitle) {
  return applyReplacements(readTemplate('head.html'), { '{{PAGE_TITLE}}': pageTitle });
}

function buildNav(activePage) {
  const activeMarker = `{{${activePage.toUpperCase()}_ACTIVE}}`;
  let nav = readTemplate('nav.html');
  nav = nav.replace(activeMarker, ' class="active"');
  return applyReplacements(nav);
}

function buildFooter() {
  return applyReplacements(readTemplate('footer.html'));
}

// ── Generate pages ─────────────────────────────────────────

function generatePage(templateFile, outputFile, pageTitle, activePage) {
  let html = readTemplate(templateFile);
  html = html.replace('{{HEAD}}', buildHead(pageTitle));
  html = html.replace('{{NAV}}', buildNav(activePage));
  html = html.replace('{{FOOTER}}', buildFooter());
  html = applyReplacements(html);
  writeFileSync(join(ROOT, outputFile), html);
  console.log(`  ✓ ${outputFile}`);
}

// ── Generate CSS ───────────────────────────────────────────

function generateCSS() {
  const css = `:root {
  --color-bg:      ${colors.background};
  --color-text:    ${colors.text};
  --color-muted:   #777777;
  --color-accent:  ${colors.accent};
  --color-border:  ${colors.border};
  --font-body:     ${fontCSS(fonts.body)};
  --font-heading:  ${fontCSS(fonts.heading)};
  --max-width:     1100px;
  --space:         2rem;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
}

img { max-width: 100%; display: block; }
a { color: inherit; }
ul { list-style: none; }

.container { max-width: var(--max-width); margin: 0 auto; padding: 0 var(--space); }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
}

nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem var(--space);
  border-bottom: 1px solid var(--color-border);
}

nav ul { display: flex; list-style: none; gap: 1.5rem; }
nav a { text-decoration: none; font-size: 0.9rem; }
nav a:hover, nav a.active { color: var(--color-accent); }

.hero {
  text-align: center;
  padding: 6rem var(--space) 4rem;
}

.hero h1 {
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 6vw, 4rem);
  margin-bottom: 0.75rem;
}

.tagline {
  color: var(--color-muted);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

.page-header {
  padding: 4rem var(--space) 2rem;
}

.page-header h1 {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 5vw, 3rem);
}

main { min-height: 60vh; padding: 0 var(--space) var(--space); }
main section { margin-bottom: 3rem; }

.contact-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 3rem;
}

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-weight: 500; font-size: 0.85rem; margin-bottom: 0.3rem; }
.form-group input, .form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 0.9rem;
}
.form-group input:focus, .form-group textarea:focus { border-color: var(--color-accent); outline: none; }

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
}
.btn-primary { background: var(--color-text); color: var(--color-bg); }
.btn-primary:hover { background: var(--color-accent); }
.btn-outline { border: 1.5px solid var(--color-text); background: transparent; }
.btn-outline:hover { background: var(--color-text); color: var(--color-bg); }

footer {
  border-top: 1px solid var(--color-border);
  padding: 3rem var(--space) 1.5rem;
  margin-top: 2rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-grid a { display: inline-block; margin-right: 1rem; font-size: 0.9rem; }

.footer-bottom {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-muted);
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}

.text-center { text-align: center; }
.text-muted { color: var(--color-muted); }

@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
  .contact-grid { grid-template-columns: 1fr; }
  nav ul { gap: 0.75rem; }
}
`;
  writeFileSync(join(ROOT, 'css', 'style.css'), css);
  console.log('  ✓ css/style.css');
}

// ── Run ────────────────────────────────────────────────────

console.log(`\nGenerating site for "${brand.name}"...\n`);

generateCSS();

if (pages.home !== 'n') {
  generatePage('page-home.html', 'index.html', 'Home', 'home');
}

if (pages.about === 'y') {
  generatePage('page-about.html', 'about.html', 'About', 'about');
}

if (pages.services === 'y') {
  generatePage('page-services.html', 'services.html', 'Services', 'services');
}

if (pages.contact === 'y') {
  generatePage('page-contact.html', 'contact.html', 'Contact', 'contact');
}

if (pages.brandGuide !== 'n') {
  let html = readTemplate('page-brand-guide.html');
  html = applyReplacements(html);
  writeFileSync(join(ROOT, 'brand-guide.html'), html);
  console.log('  ✓ brand-guide.html');
}

console.log('\nDone.\n');
