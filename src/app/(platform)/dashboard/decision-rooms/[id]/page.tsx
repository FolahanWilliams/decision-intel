import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DecisionRoomDetailClient } from '@/components/decision-rooms/DecisionRoomDetailClient';

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
      <div style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Room not found</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          This decision room either doesn&rsquo;t exist or has been archived.
        </p>
      </div>
    );
  }

  const isCreator = room.createdBy === user.id;
  const isParticipant = room.participants.some(p => p.userId === user.id);
  const isInvited = room.decisionRoomInvites.some(i => i.userId === user.id);
  if (!isCreator && !isParticipant && !isInvited) {
    return (
      <div style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>Access denied</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          You aren&rsquo;t a participant in this room.
        </p>
      </div>
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
