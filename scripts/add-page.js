#!/usr/bin/env node

/**
 * Add a new page to the site.
 * Usage: node scripts/add-page.js pricing
 *        make add-page NAME=pricing
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const pageName = process.argv[2];
if (!pageName) {
  console.error('Usage: node scripts/add-page.js <page-name>');
  console.error('Example: node scripts/add-page.js pricing');
  process.exit(1);
}

const fileName = `${pageName}.html`;
const filePath = join(ROOT, fileName);

if (existsSync(filePath)) {
  console.error(`${fileName} already exists.`);
  process.exit(1);
}

const configPath = join(ROOT, 'brand.json');
if (!existsSync(configPath)) {
  console.error('brand.json not found. Run ./setup.sh first.');
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const brandName = config.brand.name;
const title = pageName.charAt(0).toUpperCase() + pageName.slice(1);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${brandName}</title>
  <link rel="stylesheet" href="css/style.css">

  <!-- HEAD SNIPPETS -->

</head>
<body>

  <nav>
    <a href="index.html"><strong>${brandName}</strong></a>
    <ul>
      <li><a href="index.html">Home</a></li>
      <li><a href="${fileName}" class="active">${title}</a></li>
    </ul>
  </nav>

  <main>
    <header class="page-header">
      <h1>${title}</h1>
    </header>

    <section>
      <!-- Build your ${pageName} page here -->
    </section>
  </main>

  <footer>
    <p>&copy; 2026 ${brandName}</p>
  </footer>

  <script src="js/main.js"></script>

  <!-- BODY SNIPPETS -->

</body>
</html>
`;

writeFileSync(filePath, html);
console.log(`✓ Created ${fileName}`);
console.log(`→ Add a link in your nav to include it in navigation.`);
