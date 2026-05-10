'use client';

/**
 * /dashboard/decision-rooms — standalone page (locked 2026-05-10).
 *
 * Restored as its own surface after the meetings → document type cascade
 * retired /dashboard/meetings entirely. Decision Rooms had been routed
 * through /dashboard/meetings?tab=rooms as a tab; with meetings cut, the
 * rooms surface lives on its own URL again. The DecisionRoomsContent
 * component is unchanged — only the wrapping page is restored.
 *
 * Decision Rooms is a SEPARATE concept from meetings: it's the
 * collaborative blind-prior voting workflow attached to a high-stakes
 * call. The /dashboard/decisions surface is for the audit pipeline; rooms
 * are the human-vote layer above it.
 */

import { Suspense } from 'react';
import { Vote } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { DecisionRoomsContent } from '@/components/decision-rooms/DecisionRoomsContent';

export default function DecisionRoomsPage() {
  return (
    <ErrorBoundary sectionName="Decision Rooms">
      <Suspense fallback={<PageSkeleton />}>
        <div>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Vote size={24} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div>
                <h1>Decision Rooms</h1>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--fs-sm)',
                    margin: '4px 0 0',
                  }}
                >
                  Blind-prior voting before the committee meets — capture team priors anonymously so
                  the IC vote isn&rsquo;t anchored on the loudest voice.
                </p>
              </div>
            </div>
          </div>
          <DecisionRoomsContent />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
