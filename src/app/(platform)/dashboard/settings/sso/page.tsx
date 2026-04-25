import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { isAdminUserId } from '@/lib/utils/admin';
import { SsoAdminClient } from './SsoAdminClient';

export const metadata = {
  title: 'SSO · Decision Intel',
};

// SSO admin surface — lets org admins manage SAML configurations for their
// Org. Access: any TeamMember with role='admin' in at least one Org, OR a
// super-admin listed in ADMIN_USER_IDS.

export default async function SsoAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) redirect('/login?redirect=/dashboard/settings/sso');

  const isSuperAdmin = isAdminUserId(user.id);

  const adminMemberships = await prisma.teamMember.findMany({
    where: { userId: user.id, role: 'admin' },
    select: {
      orgId: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!isSuperAdmin && adminMemberships.length === 0) {
    // Not an admin of any org and not a super-admin. Route to the regular
    // settings page with a toast-style query param the client reads.
    redirect('/dashboard/settings?sso=forbidden');
  }

  // Super-admins see every org; regular admins see only the ones they belong to.
  const orgs = isSuperAdmin
    ? await prisma.organization.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      })
    : adminMemberships.map(m => m.organization);

  return <SsoAdminClient orgs={orgs} />;
}
