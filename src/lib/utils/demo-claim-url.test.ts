/**
 * Tests for demo-claim-url builder. Locks the wedge-motion routing so a
 * typo in the href chain can't silently orphan a Strategy World prospect's
 * demo audit at the 24h window.
 */

import { describe, it, expect } from 'vitest';
import { buildClaimPath, buildSaveAuditHref } from './demo-claim-url';

describe('buildClaimPath', () => {
  it('builds the claim path with both analysisId and documentId', () => {
    const path = buildClaimPath({
      analysisId: 'analysis-123',
      documentId: 'doc-456',
    });
    expect(path).toBe(
      '/onboarding/claim?demoAnalysisId=analysis-123&demoDocumentId=doc-456'
    );
  });

  it('omits analysisId when null (partial pipeline case)', () => {
    const path = buildClaimPath({
      analysisId: null,
      documentId: 'doc-456',
    });
    expect(path).toBe('/onboarding/claim?demoDocumentId=doc-456');
    expect(path).not.toContain('demoAnalysisId');
  });

  it('URL-encodes special characters in IDs', () => {
    const path = buildClaimPath({
      analysisId: 'a&b=c',
      documentId: 'd/e',
    });
    expect(path).toBe(
      '/onboarding/claim?demoAnalysisId=a%26b%3Dc&demoDocumentId=d%2Fe'
    );
  });

  it('always returns a path (never includes origin)', () => {
    const path = buildClaimPath({ analysisId: null, documentId: 'doc-1' });
    expect(path.startsWith('/onboarding/claim')).toBe(true);
    expect(path).not.toMatch(/^https?:/);
  });
});

describe('buildSaveAuditHref', () => {
  it('always uses mode=signup so a fresh prospect lands on signup not login', () => {
    const href = buildSaveAuditHref({
      analysisId: 'a1',
      documentId: 'd1',
    });
    expect(href).toContain('mode=signup');
  });

  it('encodes the claim path inside the redirect parameter', () => {
    const href = buildSaveAuditHref({
      analysisId: 'a1',
      documentId: 'd1',
    });
    // The redirect param value is the URL-encoded claim path. The %3F
    // is the ? separator; the inner & in the claim path becomes %26.
    expect(href).toContain(
      'redirect=%2Fonboarding%2Fclaim%3FdemoAnalysisId%3Da1%26demoDocumentId%3Dd1'
    );
  });

  it('survives null analysisId (partial-pipeline demo)', () => {
    const href = buildSaveAuditHref({
      analysisId: null,
      documentId: 'd1',
    });
    expect(href).toContain('mode=signup');
    expect(href).toContain('demoDocumentId%3Dd1');
    expect(href).not.toContain('demoAnalysisId');
  });

  it('produces a deterministic href for the same inputs', () => {
    const ids = { analysisId: 'analysis-x', documentId: 'doc-y' };
    expect(buildSaveAuditHref(ids)).toBe(buildSaveAuditHref(ids));
  });

  it('decoded redirect parameter exactly matches buildClaimPath', () => {
    // Defense in depth: round-trip the encoded redirect back to the claim
    // path and confirm it equals what buildClaimPath emits. A drift
    // between the two builders would silently break the post-auth
    // redirect chain.
    const ids = { analysisId: 'a-z', documentId: 'd-y' };
    const href = buildSaveAuditHref(ids);
    const url = new URL(href, 'https://test.local');
    const redirectParam = url.searchParams.get('redirect');
    expect(redirectParam).toBe(buildClaimPath(ids));
  });
});
