/**
 * /dashboard/decision-quality — redirect shim.
 *
 * Consolidated into /dashboard/analytics on 2026-04-23: the old 4-tab
 * surface (Audits / Nudges / Calibration / Experiments) already lived in
 * parallel with Analytics → Performance, which rendered Audits, Nudges,
 * and Calibration. Experiments moved into Performance alongside them.
 *
 * Old ?tab=<key> deep links (Slack, docs, bookmarks) forward to the
 * equivalent view key. LEGACY_VIEW_MAP on the analytics page accepts the
 * old keys and normalises to 'performance', so the URL remap here is
 * just the route-shape translation.
 *
 * Do NOT delete this file — the redirect is the whole point of its
 * existence; deletion would 404 every inbound link.
 */

import { redirect } from 'next/navigation';

export default async function DecisionQualityRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const view = tab && tab.length > 0 ? tab : 'performance';
  redirect(`/dashboard/analytics?view=${encodeURIComponent(view)}`);
}
