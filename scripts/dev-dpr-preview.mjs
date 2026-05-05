// Quick visual verification: render the DPR Phase 1 specimen via
// local full Puppeteer (not chromium-min) so we don't have to wait
// for the CDN chromium download. Dev-only.

import puppeteer from 'puppeteer';
import { writeFileSync } from 'node:fs';

const URL = process.env.DPR_URL || 'http://localhost:3000/dpr-render/specimen/wework';
const OUTPUT = process.env.DPR_OUTPUT || '/tmp/dpr-phase1-preview.pdf';

console.log(`[test] Launching local Chromium...`);
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

console.log(`[test] Navigating to ${URL}...`);
const start = Date.now();
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30_000 });
await page.evaluate(async () => {
  await document.fonts.ready;
});
console.log(`[test] Page loaded in ${Date.now() - start}ms.`);

console.log(`[test] Generating PDF...`);
const pdfStart = Date.now();
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
});
console.log(`[test] PDF generated in ${Date.now() - pdfStart}ms (${pdf.length} bytes).`);

writeFileSync(OUTPUT, pdf);
console.log(`[test] Saved to ${OUTPUT}.`);

await browser.close();
