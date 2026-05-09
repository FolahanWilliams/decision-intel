'use client';

/**
 * /dashboard/decisions/new — full-page wrapper around ContainerFormModal.
 * The modal handles its own create flow + redirect to the new
 * container's detail page; this route exists for direct linking from
 * sidebar / CommandPalette / onboarding tour.
 */

import { useRouter } from 'next/navigation';
import { ContainerFormModal } from '@/components/containers/ContainerFormModal';
import { defaultContainerKindForRole } from '@/hooks/useContainers';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';

export default function NewDecisionPage() {
  const router = useRouter();
  const role = useOnboardingRole();
  const defaultKind = defaultContainerKindForRole(role);

  return (
    <ContainerFormModal
      defaultKind={defaultKind}
      onClose={() => router.push('/dashboard/decisions')}
      onCreated={id => router.push(`/dashboard/decisions/${id}`)}
    />
  );
}
