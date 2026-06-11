import { PageSkeleton } from '@/components/ui/LoadingSkeleton';

// DESIGN.md loading-state pattern: skeleton, never a centered spinner.
export default function Loading() {
  return <PageSkeleton />;
}
