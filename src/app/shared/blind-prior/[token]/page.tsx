import { headers } from 'next/headers';
import { BlindPriorSubmitClient } from '@/components/decision-rooms/BlindPriorSubmitClient';

interface Props {
  params: Promise<{ token: string }>;
}

interface SurveyData {
  ok: true;
  room: {
    id: string;
    title: string;
    decisionType: string | null;
    outcomeFrame: string | null;
    deadline: string | null;
  };
  invite: {
    id: string;
    displayName: string | null;
    role: string;
    recipient: 'platform_user' | 'external';
    recipientHint: string | null;
  };
  existingPrior: {
    id: string;
    confidencePercent: number;
    topRisks: string[];
    shareRationale: boolean;
    shareIdentity: boolean;
    submittedAt: string;
  } | null;
}

interface SurveyError {
  error: string;
  expired?: boolean;
  revealed?: boolean;
  deadline?: string | null;
}

async function loadSurvey(token: string): Promise<SurveyData | SurveyError> {
  const h = await headers();
  const protocol = h.get('x-forwarded-proto') || 'https';
  const host = h.get('host') || 'localhost:3000';
  const url = `${protocol}://${host}/api/blind-prior/${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = (await res.json()) as SurveyData | SurveyError;
    return data;
  } catch {
    return { error: 'Survey could not be loaded.' };
  }
}

export const dynamic = 'force-dynamic';

export default async function BlindPriorSubmissionPage({ params }: Props) {
  const { token } = await params;
  const data = await loadSurvey(token);

  if (!('ok' in data)) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          padding: 'var(--spacing-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--severity-high)',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Blind prior survey unavailable
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              color: 'var(--text-primary)',
              fontWeight: 700,
            }}
          >
            {data.error}
          </h1>
          <p
            style={{
              marginTop: 12,
              color: 'var(--text-muted)',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {data.expired
              ? 'This link is past its expiry. Ask the room owner for a fresh invite.'
              : data.revealed
                ? 'The aggregate is already visible to participants. Submissions are closed.'
                : 'If you believe this is wrong, contact the person who invited you.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <BlindPriorSubmitClient
      token={token}
      room={data.room}
      invite={data.invite}
      existingPrior={data.existingPrior}
    />
  );
}
