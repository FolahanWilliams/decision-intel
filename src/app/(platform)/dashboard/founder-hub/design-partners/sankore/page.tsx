import type { Metadata } from 'next';
import { SankoreBriefClient } from './SankoreBriefClient';

export const metadata: Metadata = {
  title: 'Sankore · Capability Brief',
  description: 'Founder-only reference brief for the Sankore design-partner conversation.',
};

// Page sits at /dashboard/founder-hub/design-partners/sankore. Like every
// other Founder Hub surface it lives behind Supabase auth (the (platform)
// layout) plus the NEXT_PUBLIC_FOUNDER_HUB_PASS gate matched on the client.
// The route is intentionally NOT in the founder-hub tab system — it's a
// standalone reference page the founder can open, share-screen, or print
// during the Titi meeting.
export default function SankoreBriefPage() {
  return <SankoreBriefClient />;
}
