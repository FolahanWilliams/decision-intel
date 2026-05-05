// DPR specimen renderer — used both as a dev preview AND as the
// build-time replacement for scripts/generate-legal-pdfs.mjs (the legacy
// jsPDF sample generator). When DPR_OUTPUT points at public/, this
// script regenerates the public-facing sample PDFs from the new HTML/CSS
// Next.js route. Dev server must be running on PORT (default 3000).
//
// Usage:
//   # Preview (write to /tmp):
//   node scripts/dev-dpr-preview.mjs
//
//   # Regenerate the public sample:
//   DPR_URL='http://localhost:3000/dpr-render/specimen/wework' \
//     DPR_OUTPUT='public/dpr-sample-wework.pdf' \
//     node scripts/dev-dpr-preview.mjs

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
  margin: { top: '0', bottom: '12mm', left: '0', right: '0' },
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `
    <div style="
      width: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 7.5pt;
      color: #78716c;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0 16mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <span style="flex: 1; text-align: left;">Decision Provenance Record</span>
      <span style="flex: 1; text-align: center;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </span>
      <span style="flex: 1; text-align: right;">decision-intel.com</span>
    </div>
  `,
});
console.log(`[test] PDF generated in ${Date.now() - pdfStart}ms (${pdf.length} bytes).`);

writeFileSync(OUTPUT, pdf);
console.log(`[test] Saved to ${OUTPUT}.`);

await browser.close();
