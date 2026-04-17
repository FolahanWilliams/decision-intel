/**
 * critical-workflows.spec.ts
 *
 * End-to-end smoke coverage of the pilot-conversion path. These tests
 * run without real Supabase credentials and focus on:
 *   1. Marketing surfaces (landing, /proof, /bias-genome, /how-it-works)
 *     that were polished during the April 2026 walkthrough audit.
 *   2. The /demo page — the cold entry point a CSO hits from the hero.
 *   3. Login hydration for the ?email= / ?mode= query params that the
 *     demo CTA now passes through.
 *   4. Admin-gated endpoints — unauthenticated access must be rejected.
 *
 * Authenticated flows (upload → SSE pipeline → DQI reveal → outcome
 * submission → recalibrated DQI) are NOT covered here because they
 * need a real Supabase session. Add them separately with Playwright
 * storageState once a test-user flow is in place.
 *
 * Run: `npm run test:e2e` or `npx playwright test e2e/critical-workflows`
 */

import { test, expect } from '@playwright/test';

// ── Marketing surfaces ────────────────────────────────────────────────────

test.describe('Marketing surfaces load without crashing', () => {
  const routes = [
    { path: '/', label: 'landing' },
    { path: '/proof', label: 'proof' },
    { path: '/bias-genome', label: 'bias genome' },
    { path: '/how-it-works', label: 'how it works' },
    { path: '/case-studies', label: 'case studies' },
    { path: '/privacy', label: 'privacy' },
    { path: '/taxonomy', label: 'taxonomy' },
    { path: '/demo', label: 'demo' },
  ];

  for (const route of routes) {
    test(`${route.label} (${route.path}) renders`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(500);
      // Body should have real content (not just a spinner skeleton)
      await expect(page.locator('body')).toBeVisible();
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(80);
    });
  }
});

// ── Landing nav promotes /bias-genome ────────────────────────────────────

test.describe('Landing page nav', () => {
  test('top nav links to /bias-genome', async ({ page }) => {
    await page.goto('/');
    const biasGenomeLink = page.getByRole('link', { name: /bias genome/i }).first();
    await expect(biasGenomeLink).toBeVisible();
    await expect(biasGenomeLink).toHaveAttribute('href', /\/bias-genome/);
  });

  test('"Try the Demo" CTA goes to /demo', async ({ page }) => {
    await page.goto('/');
    const demoLink = page.getByRole('link', { name: /try the demo/i }).first();
    await expect(demoLink).toBeVisible();
    await expect(demoLink).toHaveAttribute('href', /\/demo/);
  });
});

// ── /demo: canned samples + email capture ────────────────────────────────

test.describe('/demo page', () => {
  test('sample picker is visible', async ({ page }) => {
    await page.goto('/demo');
    // The demo surfaces famous corporate decisions; at least one sample
    // should be pickable.
    const samples = page.getByRole('button', { name: /wework|kodak|nokia|blockbuster/i });
    await expect(samples.first()).toBeVisible({ timeout: 10_000 });
  });

  test('paste-mode CTA no longer advertises as a "preview"', async ({ page }) => {
    // Copy-polish fix from commit 5fdec96 — the old "Or paste your own
    // text for a preview" framing was defensive; should read as a
    // first-class option now.
    await page.goto('/demo');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/paste your own text for a preview/i);
    expect(bodyText).toMatch(/paste your own strategic memo/i);
  });
});

// ── Login: ?mode / ?email query-param hydration ──────────────────────────

test.describe('Login page query-param hydration', () => {
  test('?email= pre-fills the email field', async ({ page }) => {
    await page.goto('/login?mode=signup&email=test%40example.com');
    const emailInput = page
      .getByRole('textbox', { name: /email/i })
      .or(page.locator('input[type="email"]'))
      .first();
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('?mode=signup shows the signup variant', async ({ page }) => {
    await page.goto('/login?mode=signup');
    // Signup mode typically surfaces "Sign up" / "Create account" copy
    // somewhere on the page. Loose match — don't couple to a single
    // button label.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/sign up|create account|create your account/i);
  });
});

// ── Admin-gated routes reject unauthenticated access ─────────────────────

test.describe('Admin routes require auth', () => {
  test('/api/admin/whoami returns 403 without session', async ({ request }) => {
    const res = await request.get('/api/admin/whoami');
    expect([401, 403]).toContain(res.status());
  });

  test('/api/admin/trigger-cron returns 403 without session', async ({ request }) => {
    const res = await request.get('/api/admin/trigger-cron?job=daily-linkedin');
    expect([401, 403]).toContain(res.status());
  });

  test('/api/cron/dispatch returns 401 without Bearer token', async ({ request }) => {
    const res = await request.get('/api/cron/dispatch');
    // Either 401 (Unauthorized) when CRON_SECRET is set, or 500
    // ("CRON_SECRET not configured") in a bare dev env. Both prove the
    // route isn't publicly firing the dispatcher.
    expect([401, 500]).toContain(res.status());
  });
});

// ── Marketing copy tone — catch regressions on the tone sweep ────────────

test.describe('CSO-tone copy regressions', () => {
  test('landing page does not contain "click in" / "receipts" / "trust-us"', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/click in/i);
    expect(bodyText).not.toMatch(/read the receipts/i);
    expect(bodyText).not.toMatch(/trust, not trust-us/i);
    expect(bodyText).not.toMatch(/every claim we make is a page/i);
  });

  test('landing pricing H2 is the calmer 2026-04 version', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/one avoided bad call pays for the year/i);
    expect(bodyText).toMatch(/a fraction of what a single misjudged decision/i);
  });
});

// ── /how-it-works includes the outcome-loop section ──────────────────────

test.describe('/how-it-works structure', () => {
  test('outcome loop section renders', async ({ page }) => {
    await page.goto('/how-it-works');
    await expect(page.locator('#outcome-loop')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/closing the loop/i);
  });
});

// ── /bias-genome methodology viz renders ─────────────────────────────────

test.describe('/bias-genome methodology viz', () => {
  test('"How the genome is built" section appears', async ({ page }) => {
    await page.goto('/bias-genome');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/how the genome is built/i);
    expect(bodyText).toMatch(/20.*20 interaction matrix/i);
  });
});
