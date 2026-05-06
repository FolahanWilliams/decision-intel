/**
 * Playwright global-setup — opt-in test-user sign-in.
 *
 * Locked 2026-05-06. Runs ONCE before the test suite starts. When the
 * E2E_TEST_USER_EMAIL + E2E_TEST_USER_PASSWORD env vars are set, this
 * helper signs in via Supabase and writes the resulting session to
 * `e2e/.auth/storage-state.json` (gitignored). The rest of the suite
 * picks that file up via PLAYWRIGHT_STORAGE_STATE.
 *
 * This is the bridge between "no auth → public smoke tests only" (the
 * default in CI without secrets) and "real auth → money-path coverage."
 *
 * Setup for local + CI:
 *   1. Create a dedicated Supabase user (e.g. e2e+test@decision-intel.com)
 *      that has no production data attached.
 *   2. Set E2E_TEST_USER_EMAIL + E2E_TEST_USER_PASSWORD in .env.local
 *      (local) or as GitHub secrets (CI).
 *   3. Set PLAYWRIGHT_STORAGE_STATE=e2e/.auth/storage-state.json so the
 *      authenticated specs pick it up.
 *
 * When the env vars are NOT set, this helper is a no-op — the suite
 * falls back to public-route smoke tests as before.
 */

import { chromium, type FullConfig } from '@playwright/test';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const STORAGE_STATE_PATH = process.env.PLAYWRIGHT_STORAGE_STATE || 'e2e/.auth/storage-state.json';

export default async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!email || !password) {
    // No test-user credentials → no auth → authenticated specs auto-skip.
    // This is the default in CI without secrets and on any contributor
    // machine that hasn't opted in.
    return;
  }

  // Skip if a fresh storage-state file already exists (< 30 min old).
  // Lets local devs short-circuit re-login on every test run.
  if (existsSync(STORAGE_STATE_PATH) && !process.env.E2E_FORCE_RELOGIN) {
    const { statSync } = await import('node:fs');
    const stat = statSync(STORAGE_STATE_PATH);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < 30 * 60 * 1000) {
      console.log(
        `[e2e/global-setup] reusing storage-state at ${STORAGE_STATE_PATH} (${Math.round(
          ageMs / 1000
        )}s old)`
      );
      return;
    }
  }

  const baseURL =
    config.projects[0]?.use?.baseURL ||
    process.env.PLAYWRIGHT_BASE_URL ||
    'http://localhost:3000';

  // Ensure target directory exists.
  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });

  console.log(
    `[e2e/global-setup] signing in test user ${email} against ${baseURL}; saving session to ${STORAGE_STATE_PATH}`
  );

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });

    // Email + password sign-in. The login page uses Supabase Auth; the
    // exact selectors might evolve, so try a few canonical labels.
    const emailField = page
      .getByRole('textbox', { name: /email/i })
      .or(page.locator('input[type="email"]'))
      .first();
    await emailField.fill(email);

    const passwordField = page.locator('input[type="password"]').first();
    if (await passwordField.isVisible().catch(() => false)) {
      await passwordField.fill(password);
    }

    const signInButton = page
      .getByRole('button', { name: /sign in|log in|continue/i })
      .first();
    await signInButton.click();

    // Wait for redirect to /dashboard. If it doesn't happen within 30s,
    // throw — the test user is misconfigured (wrong password, or email
    // confirmation required, or a magic-link flow).
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log(`[e2e/global-setup] signed in successfully; storage-state saved.`);
  } catch (err) {
    console.error(
      `[e2e/global-setup] sign-in failed:`,
      err instanceof Error ? err.message : err
    );
    throw err;
  } finally {
    await browser.close();
  }
}
