'use client';

import { useState } from 'react';
import { CheckCircle2, ShieldCheck, Loader2, Lock } from 'lucide-react';

interface Props {
  token: string;
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

function formatDeadline(iso: string | null): string {
  if (!iso) return 'No deadline';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function BlindPriorSubmitClient({ token, room, invite, existingPrior }: Props) {
  const [confidence, setConfidence] = useState<number>(existingPrior?.confidencePercent ?? 50);
  const initialRisks = existingPrior?.topRisks ?? [];
  const [risk1, setRisk1] = useState(initialRisks[0] ?? '');
  const [risk2, setRisk2] = useState(initialRisks[1] ?? '');
  const [risk3, setRisk3] = useState(initialRisks[2] ?? '');
  const [rationale, setRationale] = useState('');
  const [shareRationale, setShareRationale] = useState(existingPrior?.shareRationale ?? false);
  const [shareIdentity, setShareIdentity] = useState(existingPrior?.shareIdentity ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(existingPrior?.submittedAt ?? null);

  const isObserver = invite.role === 'observer';

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const topRisks = [risk1, risk2, risk3]
        .map(r => r.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (topRisks.length === 0) {
        setError('Add at least one top-risk statement.');
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/blind-prior/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidencePercent: confidence,
          topRisks,
          privateRationale: rationale.trim() || undefined,
          shareRationale,
          shareIdentity,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        submittedAt?: string;
      };
      if (!res.ok) {
        setError(data.error || 'Submission failed.');
        return;
      }
      if (data.submittedAt) setSubmittedAt(data.submittedAt);
    } finally {
      setSubmitting(false);
    }
  };

  if (isObserver) {
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
          <Lock size={28} style={{ color: 'var(--text-muted)' }} />
          <h1 style={{ margin: '12px 0 6px', color: 'var(--text-primary)', fontSize: 22 }}>
            Observer access
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            You were invited as an observer for &ldquo;{room.title}&rdquo;. Observers don&rsquo;t
            submit a blind prior. You&rsquo;ll receive a notification when the aggregate is
            revealed.
          </p>
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
          <span>Decision Intel · Pre-IC Blind Prior</span>
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
          {room.title}
        </h1>

        {room.outcomeFrame && (
          <p
            style={{
              margin: '14px 0 0',
              color: 'var(--text-secondary)',
              fontSize: 16,
              lineHeight: 1.5,
            }}
          >
            {room.outcomeFrame}
          </p>
        )}

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          <span>
            Deadline:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {formatDeadline(room.deadline)}
            </strong>
          </span>
          <span>·</span>
          <span>
            Submitting as{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {invite.displayName || invite.recipientHint || 'You'}
            </strong>
          </span>
        </div>

        {submittedAt && (
          <div
            style={{
              marginTop: 20,
              padding: 'var(--spacing-md)',
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <CheckCircle2 size={18} color="#16A34A" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                Submitted on {new Date(submittedAt).toLocaleString()}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                You can revise your prior until the deadline. Other participants don&rsquo;t see
                your answer.
              </div>
            </div>
          </div>
        )}

        <section
          style={{
            marginTop: 24,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            display: 'grid',
            gap: 22,
          }}
        >
          <Field
            label="Confidence the decision succeeds"
            description="Your subjective probability — 0% (certain failure) to 100% (certain success)."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={confidence}
                onChange={e => setConfidence(parseInt(e.target.value, 10))}
                style={{ flex: 1 }}
              />
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  minWidth: 80,
                  textAlign: 'right',
                }}
              >
                {confidence}%
              </div>
            </div>
          </Field>

          <Field
            label="Top three risks"
            description="What's most likely to cause this decision to fail? Up to three; one per box."
          >
            <div style={{ display: 'grid', gap: 8 }}>
              <RiskInput
                value={risk1}
                onChange={setRisk1}
                placeholder="e.g. FX volatility outpaces hedge"
              />
              <RiskInput
                value={risk2}
                onChange={setRisk2}
                placeholder="e.g. Integration timeline slips past Q2"
              />
              <RiskInput
                value={risk3}
                onChange={setRisk3}
                placeholder="e.g. Counsel review surfaces material disclosure gap"
              />
            </div>
          </Field>

          <Field
            label="Private rationale (optional)"
            description="One sentence on why you set your confidence here. Defaults to private — only shown if you opt in."
          >
            <textarea
              value={rationale}
              onChange={e => setRationale(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="One-sentence rationale, ≤500 chars."
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 13,
                fontFamily: 'inherit',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                resize: 'vertical',
              }}
            />
            <div
              style={{
                marginTop: 8,
                display: 'grid',
                gap: 6,
              }}
            >
              <Toggle
                checked={shareRationale}
                onChange={setShareRationale}
                disabled={rationale.trim().length === 0}
                label="Share my rationale in the aggregate"
              />
              <Toggle
                checked={shareIdentity}
                onChange={setShareIdentity}
                label="Attach my name to the rationale + risks"
              />
            </div>
          </Field>

          {error && (
            <div
              style={{
                color: 'var(--severity-high)',
                fontSize: 13,
                padding: '8px 10px',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, maxWidth: 360 }}>
              Your submission stays hidden until the deadline or until everyone has voted. Brier
              scoring runs after the actual outcome lands.
            </p>
            <button
              onClick={onSubmit}
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {submittedAt ? 'Update prior' : 'Submit prior'}
            </button>
          </div>
        </section>

        <p
          style={{
            marginTop: 18,
            color: 'var(--text-muted)',
            fontSize: 11,
            textAlign: 'center',
          }}
        >
          Powered by Decision Intel · the native reasoning layer for boardroom decisions.
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <p
        style={{
          margin: '0 0 10px',
          color: 'var(--text-muted)',
          fontSize: 12,
          lineHeight: 1.4,
        }}
      >
        {description}
      </p>
      {children}
    </div>
  );
}

function RiskInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value.slice(0, 200))}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '8px 10px',
        fontSize: 13,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
      }}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
