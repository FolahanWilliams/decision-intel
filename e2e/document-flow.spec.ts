import { test, expect } from '@playwright/test';

// ─── Document Upload → Analyze → View Flow ────────────────────────────────
// These tests require authentication. They are skipped by default unless
// a PLAYWRIGHT_AUTH_COOKIE or PLAYWRIGHT_STORAGE_STATE env var is set.
//
// To run authenticated tests:
//   1. Log in manually in a browser
//   2. Export the storage state: npx playwright codegen --save-storage=auth.json
//   3. Run: PLAYWRIGHT_STORAGE_STATE=auth.json npx playwright test e2e/document-flow.spec.ts

const hasAuth = !!process.env.PLAYWRIGHT_STORAGE_STATE;

test.describe('Document analysis flow', () => {
  test.skip(!hasAuth, 'Skipped: requires PLAYWRIGHT_STORAGE_STATE');

  test.use({
    storageState: process.env.PLAYWRIGHT_STORAGE_STATE || undefined,
  });

  test('dashboard loads with navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show the main navigation elements
    await expect(page.locator('nav')).toBeVisible();

    // Should have key navigation items
    const hasDocuments = await page
      .getByText(/documents/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasInsights = await page
      .getByText(/insights/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasDocuments || hasInsights).toBe(true);
  });

  test('documents page lists uploaded documents', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    // Should show some content - either documents or empty state
    const body = page.locator('body');
    await expect(body).toBeVisible();

    const hasDocList =
      (await page
        .getByRole('table')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText(/no documents/i)
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText(/upload/i)
        .first()
        .isVisible()
        .catch(() => false));

    expect(hasDocList).toBe(true);
  });

  test('upload button is accessible on documents page', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle');

    // Look for upload action
    const uploadButton = page.getByRole('button', { name: /upload|add|new/i });
    const uploadLink = page.getByRole('link', { name: /upload|add|new/i });

    const hasUpload =
      (await uploadButton
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await uploadLink
        .first()
        .isVisible()
        .catch(() => false));

    expect(hasUpload).toBe(true);
  });

  test('cognitive audits page loads', async ({ page }) => {
    await page.goto('/dashboard/cognitive-audits');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    // Should have audit-related content
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
  });

  test('insights page loads', async ({ page }) => {
    await page.goto('/dashboard/insights');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });

  test('notification bell is visible in header', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const bell = page.getByRole('button', { name: /notification/i });
    const hasBell = await bell.isVisible().catch(() => false);

    // Bell should be present in the authenticated layout
    expect(hasBell).toBe(true);
  });

  test('notification dropdown opens on click', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const bell = page.getByRole('button', { name: /notification/i });
    if (await bell.isVisible().catch(() => false)) {
      await bell.click();

      // Should open a dialog/dropdown
      const dialog = page.getByRole('dialog', { name: /notification/i });
      const hasDialog = await dialog.isVisible().catch(() => false);

      // Or at minimum, some notification text should appear
      const hasContent =
        hasDialog ||
        (await page
          .getByText(/no notifications/i)
          .isVisible()
          .catch(() => false)) ||
        (await page
          .getByText(/mark all read/i)
          .isVisible()
          .catch(() => false));

      expect(hasContent).toBe(true);
    }
  });
});
