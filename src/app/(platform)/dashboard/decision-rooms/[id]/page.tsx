import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Lock, Vote } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DecisionRoomDetailClient } from '@/components/decision-rooms/DecisionRoomDetailClient';

function NotFoundShell({
  title,
  body,
  Icon,
  borderColor,
}: {
  title: string;
  body: string;
  Icon: typeof Vote;
  borderColor: string;
}) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: 'var(--spacing-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <Link
          href="/dashboard/meetings?tab=rooms"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <ArrowLeft size={13} /> All Decision Rooms
        </Link>
      </div>
      <div
        style={{
          padding: 'var(--spacing-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: 14,
        }}
      >
        <Icon size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            {body}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/meetings?tab=rooms"
              className="btn btn-primary flex items-center gap-sm"
              style={{ fontSize: 13, padding: '8px 14px' }}
            >
              Browse Decision Rooms
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-ghost flex items-center gap-sm"
              style={{ fontSize: 13, padding: '8px 14px' }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DecisionRoomDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    redirect(`/login?next=/dashboard/decision-rooms/${id}`);
  }

  // Initial server-side fetch — keeps the first paint authoritative and
  // avoids the SWR flicker on a procurement-grade surface. The client
  // component refetches every 30s while in `collecting` to keep the
  // submission tally live.
  const room = await prisma.decisionRoom.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      createdBy: true,
      decisionType: true,
      status: true,
      analysisId: true,
      documentId: true,
      blindPriorDeadline: true,
      blindPriorRevealedAt: true,
      blindPriorOutcomeFrame: true,
      outcomeId: true,
      participants: { select: { userId: true, role: true } },
      decisionRoomInvites: {
        select: {
          id: true,
          userId: true,
          email: true,
          displayName: true,
          role: true,
          usedAt: true,
          remindedAt: true,
          sentAt: true,
          tokenExpiresAt: true,
          submissionToken: true,
        },
      },
    },
  });

  if (!room) {
    return (
      <NotFoundShell
        title="Decision Room not found"
        body="This Decision Room either doesn't exist, was archived, or you followed a stale link. The blind-prior submission window for old rooms eventually expires; once an outcome lands, the room moves into the Outcome Flywheel and only the creator + participants can re-open it."
        Icon={Vote}
        borderColor="var(--warning)"
      />
    );
  }

  const isCreator = room.createdBy === user.id;
  const isParticipant = room.participants.some(p => p.userId === user.id);
  const isInvited = room.decisionRoomInvites.some(i => i.userId === user.id);
  if (!isCreator && !isParticipant && !isInvited) {
    return (
      <NotFoundShell
        title="You don't have access to this Decision Room"
        body="Only the room creator, invited participants, and people the creator added directly can view a Decision Room. If you should have access, ask the creator to invite you or share a fresh submission link."
        Icon={Lock}
        borderColor="var(--severity-high)"
      />
    );
  }

  // Load my prior, if any.
  const myPrior = await prisma.decisionRoomBlindPrior.findUnique({
    where: { roomId_respondentUserId: { roomId: id, respondentUserId: user.id } },
    select: {
      id: true,
      confidencePercent: true,
      topRisks: true,
      submittedAt: true,
    },
  });

  // Find the invite for this user so we can surface their submission link
  // without exposing other people's tokens.
  const myInvite = room.decisionRoomInvites.find(i => i.userId === user.id);

  // Outcome (if linked) for the outcome_logged phase.
  const outcome = room.outcomeId
    ? await prisma.decisionOutcome.findUnique({
        where: { id: room.outcomeId },
        select: {
          id: true,
          outcome: true,
          notes: true,
          impactScore: true,
          reportedAt: true,
        },
      })
    : null;

  return (
    <ErrorBoundary sectionName="Decision Room Detail">
      <DecisionRoomDetailClient
        roomId={id}
        initialRoom={{
          id: room.id,
          title: room.title,
          decisionType: room.decisionType,
          status: room.status,
          analysisId: room.analysisId,
          documentId: room.documentId,
          isCreator,
          deadline: room.blindPriorDeadline?.toISOString() ?? null,
          revealedAt: room.blindPriorRevealedAt?.toISOString() ?? null,
          outcomeFrame: room.blindPriorOutcomeFrame,
          outcomeId: room.outcomeId,
          outcome: outcome
            ? {
                outcome: outcome.outcome,
                notes: outcome.notes ?? null,
                impactScore: outcome.impactScore ?? null,
                reportedAt: outcome.reportedAt.toISOString(),
              }
            : null,
          myInviteToken: myInvite?.submissionToken ?? null,
          myPrior: myPrior
            ? {
                submittedAt: myPrior.submittedAt.toISOString(),
                confidencePercent: myPrior.confidencePercent,
                topRisks: myPrior.topRisks,
              }
            : null,
        }}
      />
    </ErrorBoundary>
  );
}
