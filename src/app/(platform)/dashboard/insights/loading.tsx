'use client';

import { PageSkeleton } from '@/components/ui/LoadingSkeleton';

export default function Loading() {
  return <PageSkeleton rows={6} />;
}
