/**
 * Demo → claim URL builder — pure function.
 *
 * Locked 2026-05-10 (first-impression audit). The /demo page produces a
 * wow-moment audit owned by DEMO_USER_ID. The Save Audit CTA on the
 * results card routes through:
 *
 *   /demo
 *     → /login?mode=signup&redirect=<claim path>
 *     → /onboarding/claim?demoAnalysisId=X&demoDocumentId=Y
 *     → /documents/[id]?claimed=true
 *
 * This builder constructs the two URLs in lockstep so the demo page,
 * post-audit results card, and any future claim entry point produce
 * identical hrefs. Pure function; trivially testable.
 *
 * Why this matters: a Strategy World prospect lands on /demo from a
 * LinkedIn DM, runs an audit, and the Save CTA must route them to the
 * right login → claim → document chain. A typo in any href silently
 * orphans the demo audit at the 24h window expiry. The pure function +
 * tests are the structural defense against that.
 */

export interface DemoClaimIds {
  /** Analysis row ID (preferred when present). */
  analysisId: string | null;
  /** Document row ID (always populated; analysis can be null on partial pipeline). */
  documentId: string;
}

/**
 * Builds the /onboarding/claim path with the demo analysis / document
 * query params. Returns a path-only string (no origin) suitable for
 * router.replace + redirect query construction.
 */
export function buildClaimPath({ analysisId, documentId }: DemoClaimIds): string {
  const query = new URLSearchParams();
  if (analysisId) query.set('demoAnalysisId', analysisId);
  if (documentId) query.set('demoDocumentId', documentId);
  return `/onboarding/claim?${query.toString()}`;
}

/**
 * Builds the /login signup href that, post-auth, redirects to the claim
 * page. Always uses `mode=signup` because the wedge motion is "convert
 * a fresh prospect", not "log returning user back in".
 */
export function buildSaveAuditHref(ids: DemoClaimIds): string {
  const claimPath = buildClaimPath(ids);
  return `/login?mode=signup&redirect=${encodeURIComponent(claimPath)}`;
}
