import { headers } from 'next/headers';
import { ShieldCheck } from 'lucide-react';
import { BlindPriorAggregateView } from '@/components/decision-rooms/BlindPriorAggregateView';
import type { BlindPriorAggregate } from '@/lib/learning/blind-prior-aggregate';

interface Props {
  // 4.1 deep — the public-aggregate route lives under [token]/aggregate
  // alongside the survey form. The dynamic param keeps the same name
  // ('token') because Next.js requires sibling/child routes to share
  // param names; at runtime, the survey page treats it as a single-use
  // submission token, while this aggregate page treats it as the
  // DecisionRoomInvite.id (the API distinguishes by route path).
  params: Promise<{ token: string }>;
}

interface AggregateResp {
  ok: true;
  room: {
    id: string;
    title: string;
    outcomeFrame: string | null;
    deadline: string | null;
    revealedAt: string;
    outcomeLogged: boolean;
  };
  aggregate: BlindPriorAggregate;
}

interface AggregateError {
  error: string;
}

async function loadAggregate(id: string): Promise<AggregateResp | AggregateError> {
  const h = await headers();
  const protocol = h.get('x-forwarded-proto') || 'https';
  const host = h.get('host') || 'localhost:3000';
  const url = `${protocol}://${host}/api/blind-prior/${encodeURIComponent(id)}/aggregate`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return (await res.json()) as AggregateResp | AggregateError;
  } catch {
    return { error: 'Aggregate could not be loaded.' };
  }
}

export const dynamic = 'force-dynamic';

export default async function PublicAggregatePage({ params }: Props) {
  const { token } = await params;
  const data = await loadAggregate(token);

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
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 22 }}>
            Aggregate unavailable
          </h1>
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>{data.error}</p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          <ShieldCheck size={13} color="#16A34A" />
          <span>Decision Intel · Aggregated Pre-IC Priors</span>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          {data.room.title}
        </h1>
        {data.room.outcomeFrame && (
          <p
            style={{
              margin: '14px 0 0',
              color: 'var(--text-secondary)',
              fontSize: 16,
              lineHeight: 1.5,
            }}
          >
            {data.room.outcomeFrame}
          </p>
        )}
        <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>
          Revealed {new Date(data.room.revealedAt).toLocaleString()}
        </p>

        <div style={{ marginTop: 20 }}>
          <BlindPriorAggregateView
            aggregate={data.aggregate}
            phase={data.room.outcomeLogged ? 'outcome_logged' : 'revealed'}
          />
        </div>
      </div>
    </main>
  );
}
