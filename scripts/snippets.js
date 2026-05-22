#!/usr/bin/env node
// ============================================================
// Snippet Manager — scan, test, and inject marketing snippets
//
// Usage:
//   node scripts/snippets.js scan          — find all snippets in your HTML files
//   node scripts/snippets.js test          — scan + check if snippet URLs are reachable
//   node scripts/snippets.js add <platform> <id>  — inject a snippet into all pages
//   node scripts/snippets.js remove <platform>     — remove a snippet from all pages
//
// Supported platforms: klaviyo, ga4, meta-pixel, hubspot, mailchimp, blvd-sbo
// ============================================================

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');

// ---- Snippet patterns (what to search for) and templates (what to inject) ----

const PLATFORMS = {
  'klaviyo': {
    name: 'Klaviyo',
    zone: 'head',
    pattern: /static\.klaviyo\.com\/onsite\/js\/klaviyo\.js\?company_id=([A-Za-z0-9_-]+)/,
    testUrl: (id) => `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${id}`,
    template: (id) => `  <script async src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${id}"></script>`,
  },
  'ga4': {
    name: 'Google Analytics (GA4)',
    zone: 'head',
    pattern: /googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/,
    testUrl: (id) => `https://www.googletagmanager.com/gtag/js?id=${id}`,
    template: (id) => [
      `  <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`,
      `  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');</script>`,
    ].join('\n'),
  },
  'meta-pixel': {
    name: 'Meta Pixel',
    zone: 'head',
    pattern: /connect\.facebook\.net\/en_US\/fbevents\.js|fbq\('init',\s*'(\d+)'\)/,
    testUrl: () => `https://connect.facebook.net/en_US/fbevents.js`,
    template: (id) => [
      `  <script>`,
      `    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?`,
      `    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;`,
      `    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;`,
      `    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,`,
      `    document,'script','https://connect.facebook.net/en_US/fbevents.js');`,
      `    fbq('init', '${id}');`,
      `    fbq('track', 'PageView');`,
      `  </script>`,
    ].join('\n'),
  },
  'hubspot': {
    name: 'HubSpot',
    zone: 'head',
    pattern: /js\.hs-scripts\.com\/(\d+)\.js/,
    testUrl: (id) => `https://js.hs-scripts.com/${id}.js`,
    template: (id) => `  <script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/${id}.js"></script>`,
  },
  'mailchimp': {
    name: 'Mailchimp',
    zone: 'head',
    pattern: /chimpstatic\.com\/mcjs-connected\/js\/users\/([A-Za-z0-9]+)\/([A-Za-z0-9]+)\.js/,
    testUrl: (userId, hash) => `https://chimpstatic.com/mcjs-connected/js/users/${userId}/${hash}.js`,
    template: (id) => `  <script id="mcjs">!function(c,h,i,m,p){m=c.createElement(h),p=c.getElementsByTagName(h)[0],m.async=1,m.src=i,p.parentNode.insertBefore(m,p)}(document,"script","https://chimpstatic.com/mcjs-connected/js/users/${id}.js");</script>`,
  },
  'blvd-sbo': {
    name: 'Boulevard SBO',
    zone: 'body',
    pattern: /booking\.boulevard\.io\/widget\.js|blvd-book-button/,
    testUrl: () => `https://booking.boulevard.io/widget.js`,
    template: (id) => `  <script src="https://booking.boulevard.io/widget.js"></script>\n  <blvd-book-button business-id="${id}">Book Now</blvd-book-button>`,
  },
};

// ---- Helpers ----

function getHtmlFiles() {
  return fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(ROOT, f));
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 5000 }, (res) => {
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, status: 'unreachable' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'timeout' }); });
  });
}

// ---- Commands ----

function scanSnippets() {
  const files = getHtmlFiles();
  const results = [];

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);

    for (const [key, platform] of Object.entries(PLATFORMS)) {
      const match = html.match(platform.pattern);
      if (match) {
        results.push({
          file: fileName,
          platform: platform.name,
          key,
          id: match[1] || '(detected)',
          zone: platform.zone,
        });
      }
    }
  }

  return results;
}

function printScan(results) {
  const files = getHtmlFiles();
  const fileNames = files.map(f => path.basename(f));

  console.log('');
  console.log('\x1b[1mSnippet Scan\x1b[0m');
  console.log('════════════════════════════════════════');

  if (results.length === 0) {
    console.log('');
    console.log('  No snippets found in any HTML files.');
    console.log('');
    console.log('  \x1b[2mAdd one with: make add-snippet PLATFORM=klaviyo ID=your_site_id\x1b[0m');
    console.log('');
    return;
  }

  // Group by platform
  const byPlatform = {};
  for (const r of results) {
    if (!byPlatform[r.platform]) byPlatform[r.platform] = [];
    byPlatform[r.platform].push(r);
  }

  for (const [platform, entries] of Object.entries(byPlatform)) {
    const id = entries[0].id;
    const zone = entries[0].zone === 'head' ? 'HEAD SNIPPETS' : 'BODY SNIPPETS';
    const pageCount = new Set(entries.map(e => e.file)).size;
    const pages = [...new Set(entries.map(e => e.file))].join(', ');

    console.log('');
    console.log(`  \x1b[36m${platform}\x1b[0m`);
    console.log(`    ID:    ${id}`);
    console.log(`    Zone:  ${zone}`);
    console.log(`    Pages: ${pages} (${pageCount}/${fileNames.length})`);

    if (pageCount < fileNames.length) {
      const missing = fileNames.filter(f => !entries.some(e => e.file === f));
      console.log(`    \x1b[33mMissing from: ${missing.join(', ')}\x1b[0m`);
    }
  }

  // Check for platforms NOT found
  const foundKeys = new Set(results.map(r => r.key));
  const missing = Object.entries(PLATFORMS).filter(([k]) => !foundKeys.has(k));
  if (missing.length > 0) {
    console.log('');
    console.log('  \x1b[2mNot installed:\x1b[0m');
    for (const [key, p] of missing) {
      console.log(`    \x1b[2m${p.name} — make add-snippet PLATFORM=${key} ID=your_id\x1b[0m`);
    }
  }

  console.log('');
}

async function testSnippets() {
  const results = scanSnippets();
  printScan(results);

  if (results.length === 0) return;

  console.log('\x1b[1mConnection Test\x1b[0m');
  console.log('════════════════════════════════════════');

  // Dedupe by platform
  const tested = new Set();
  for (const r of results) {
    if (tested.has(r.key)) continue;
    tested.add(r.key);

    const platform = PLATFORMS[r.key];
    const url = platform.testUrl(r.id);

    process.stdout.write(`  ${platform.name}... `);
    const { ok, status } = await checkUrl(url);

    if (ok) {
      console.log(`\x1b[32m✓ reachable\x1b[0m (${status})`);
    } else {
      console.log(`\x1b[31m✗ ${status}\x1b[0m`);
      if (r.id === '(detected)' || r.id.includes('YOUR_')) {
        console.log(`    \x1b[33m↳ Looks like a placeholder ID — replace with your real one\x1b[0m`);
      }
    }
  }
  console.log('');
}

function addSnippet(platformKey, id) {
  const platform = PLATFORMS[platformKey];
  if (!platform) {
    console.error(`\n  Unknown platform: ${platformKey}`);
    console.error(`  Available: ${Object.keys(PLATFORMS).join(', ')}\n`);
    process.exit(1);
  }

  if (!id) {
    console.error(`\n  Missing ID. Usage: make add-snippet PLATFORM=${platformKey} ID=your_id\n`);
    process.exit(1);
  }

  const files = getHtmlFiles();
  const snippet = platform.template(id);
  const marker = platform.zone === 'head'
    ? 'HEAD SNIPPETS — paste tracking scripts here'
    : 'BODY SNIPPETS — paste widget scripts here';

  let injected = 0;
  let skipped = 0;

  for (const file of files) {
    let html = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);

    // Skip if this snippet is already present
    if (platform.pattern.test(html)) {
      console.log(`  \x1b[2mskip\x1b[0m  ${fileName} (already has ${platform.name})`);
      skipped++;
      continue;
    }

    // Find the marker comment and inject after it
    const markerLine = `       ${marker}`;
    const closingLine = '       ============================================================ -->';
    const markerIdx = html.indexOf(marker);

    if (markerIdx === -1) {
      console.log(`  \x1b[33mskip\x1b[0m  ${fileName} (no ${platform.zone.toUpperCase()} SNIPPETS zone found)`);
      skipped++;
      continue;
    }

    // Find the closing comment line after the marker
    const afterMarker = html.indexOf('-->', markerIdx);
    if (afterMarker === -1) {
      console.log(`  \x1b[33mskip\x1b[0m  ${fileName} (malformed snippet zone)`);
      skipped++;
      continue;
    }

    const insertPoint = afterMarker + 3; // after '-->'
    html = html.slice(0, insertPoint) + '\n' + snippet + html.slice(insertPoint);

    fs.writeFileSync(file, html);
    console.log(`  \x1b[32m  ✓  \x1b[0m  ${fileName}`);
    injected++;
  }

  console.log('');
  if (injected > 0) {
    console.log(`  \x1b[32m✓ ${platform.name} injected into ${injected} page(s)\x1b[0m`);
  }
  if (skipped > 0) {
    console.log(`  \x1b[2m${skipped} page(s) skipped\x1b[0m`);
  }
  console.log('');
}

function removeSnippet(platformKey) {
  const platform = PLATFORMS[platformKey];
  if (!platform) {
    console.error(`\n  Unknown platform: ${platformKey}`);
    console.error(`  Available: ${Object.keys(PLATFORMS).join(', ')}\n`);
    process.exit(1);
  }

  const files = getHtmlFiles();
  let removed = 0;

  // Build broader patterns to catch the full script tags
  const removalPatterns = {
    'klaviyo':     /\s*<script[^>]*static\.klaviyo\.com[^>]*><\/script>/g,
    'ga4':         /\s*<script[^>]*googletagmanager\.com\/gtag[^>]*><\/script>\s*<script>window\.dataLayer[^<]*<\/script>/g,
    'meta-pixel':  /\s*<script>\s*!function\(f,b,e,v[\s\S]*?fbq\('track',\s*'PageView'\);\s*<\/script>/g,
    'hubspot':     /\s*<script[^>]*hs-script-loader[^>]*><\/script>/g,
    'mailchimp':   /\s*<script[^>]*id="mcjs"[^>]*>[^<]*<\/script>/g,
    'blvd-sbo':    /\s*<script[^>]*booking\.boulevard\.io\/widget\.js[^>]*><\/script>\s*(<blvd-book-button[^>]*>[^<]*<\/blvd-book-button>)?/g,
  };

  const removalPattern = removalPatterns[platformKey];
  if (!removalPattern) {
    console.error(`\n  Removal not supported for ${platformKey} yet.\n`);
    process.exit(1);
  }

  for (const file of files) {
    let html = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);

    if (!platform.pattern.test(html)) {
      continue;
    }

    html = html.replace(removalPattern, '');
    fs.writeFileSync(file, html);
    console.log(`  \x1b[32m✓\x1b[0m  Removed ${platform.name} from ${fileName}`);
    removed++;
  }

  console.log('');
  if (removed > 0) {
    console.log(`  \x1b[32m✓ ${platform.name} removed from ${removed} page(s)\x1b[0m`);
  } else {
    console.log(`  \x1b[2m${platform.name} not found in any pages.\x1b[0m`);
  }
  console.log('');
}

// ---- CLI ----

const [,, command, ...args] = process.argv;

switch (command) {
  case 'scan':
    printScan(scanSnippets());
    break;
  case 'test':
    testSnippets();
    break;
  case 'add':
    console.log('');
    console.log(`\x1b[1mInjecting ${args[0]}...\x1b[0m`);
    console.log('');
    addSnippet(args[0], args[1]);
    break;
  case 'remove':
    console.log('');
    console.log(`\x1b[1mRemoving ${args[0]}...\x1b[0m`);
    removeSnippet(args[0]);
    break;
  default:
    console.log('');
    console.log('  \x1b[1mSnippet Manager\x1b[0m');
    console.log('');
    console.log('  Commands:');
    console.log('    make snippets                              Scan all pages for installed snippets');
    console.log('    make test-snippets                         Scan + test if snippet URLs are reachable');
    console.log('    make add-snippet PLATFORM=klaviyo ID=xxx   Inject a snippet into all pages');
    console.log('    make remove-snippet PLATFORM=klaviyo       Remove a snippet from all pages');
    console.log('');
    console.log('  Platforms:');
    for (const [key, p] of Object.entries(PLATFORMS)) {
      console.log(`    ${key.padEnd(14)} ${p.name}`);
    }
    console.log('');
    break;
}
