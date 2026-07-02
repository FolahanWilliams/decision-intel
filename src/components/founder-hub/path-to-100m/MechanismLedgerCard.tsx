'use client';

/**
 * Mechanism Hit-Rate Ledger — the proof that matters (locked 2026-07-02).
 *
 * The DQI is risk-density; it can't headline until it calibrates over tens of
 * audits. The buyer cares about ONE thing: on a decision that went badly, did
 * the blind audit NAME the mechanism that actually materialized? This card is
 * that question made measurable + un-cherry-pickable — the validation program
 * AND the advisor/investor artifact. Reads the SSOT in
 * src/lib/proof/mechanism-ledger.ts (seed + math + caveats).
 */

import { CheckCircle2, CircleDot, XCircle, Clock, ShieldQuestion } from 'lucide-react';
import {
  MECHANISM_LEDGER_SEED,
  MECHANISM_LEDGER_CAVEATS,
  MECHANISM_LEDGER_MIN_N,
  computeMechanismHitRate,
  formatHitRate,
  type MechanismLedgerVerdict,
} from '@/lib/proof/mechanism-ledger';

const VERDICT_META: Record<
  MechanismLedgerVerdict,
  { label: string; color: string; icon: React.ReactNode }
> = {
  hit: { label: 'HIT', color: 'var(--success)', icon: <CheckCircle2 size={13} /> },
  partial: { label: 'PARTIAL', color: 'var(--warning)', icon: <CircleDot size={13} /> },
  miss: { label: 'MISS', color: 'var(--error)', icon: <XCircle size={13} /> },
  pending: { label: 'PENDING', color: 'var(--text-muted)', icon: <Clock size={13} /> },
};

export function MechanismLedgerCard() {
  const m = computeMechanismHitRate(MECHANISM_LEDGER_SEED);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* The frame — this is the proof, not the DQI */}
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        The number is not the proof. <strong>This</strong> is: on a decision that went badly, did
        the <em>blind</em> audit name the mechanism that actually materialized, before anyone knew
        the outcome? Every row carries the verbatim finding AND the verbatim outcome, so a reader
        judges the hit themselves. It is measurable now (no waiting for the DQI to calibrate), and
        it is what you put in front of an advisor.
      </p>

      {/* Aggregate — N-floor honest */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(22, 163, 74, 0.06)',
          border: '1px solid var(--accent-primary)',
        }}
      >
        <Stat
          label="Blind mechanism hit-rate"
          value={m.meetsNFloor ? formatHitRate(m.strictHitRate) : `${m.hits}/${m.settled}`}
          sub={
            m.meetsNFloor
              ? `${m.hits} exact + ${m.partials} partial of ${m.settled} settled`
              : `${MECHANISM_LEDGER_MIN_N - m.settled} more settled cases to headline a rate`
          }
        />
        <Stat label="Confirmed hits" value={String(m.hits)} sub="blind retro, documented outcome" />
        <Stat
          label="Misses"
          value={String(m.misses)}
          sub={m.misses === 0 ? 'none logged yet' : 'kept in — un-cherry-pickable'}
        />
        <Stat
          label="Forward pre-registered"
          value={String(m.pending)}
          sub="current audits awaiting outcomes"
        />
      </div>

      {!m.meetsNFloor && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-2xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <ShieldQuestion size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Below the N-floor of {MECHANISM_LEDGER_MIN_N} — the same discipline as the calibration
          surfaces. Do not headline a percentage yet; show the cases. Your grading run fills this.
        </p>
      )}

      {/* The ledger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MECHANISM_LEDGER_SEED.map(e => {
          const v = VERDICT_META[e.verdict];
          return (
            <div
              key={e.id}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${v.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                  {e.company}
                </strong>
                <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                  {e.sector} · {e.decisionYear}
                </span>
                {e.blindAudit && (
                  <span
                    style={{
                      fontSize: 'var(--fs-3xs)',
                      color: 'var(--info)',
                      border: '1px solid var(--info)',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 7px',
                      fontWeight: 600,
                    }}
                  >
                    BLIND
                  </span>
                )}
                <span
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 700,
                    color: v.color,
                  }}
                >
                  {v.icon}
                  {v.label}
                </span>
              </div>

              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                <Line eyebrow="What the audit named, blind" body={e.mechanismNamed} />
                {e.outcome ? (
                  <Line
                    eyebrow={`What happened (${e.outcome.materialisedOn})`}
                    body={e.outcome.summary}
                  />
                ) : (
                  <Line
                    eyebrow="Outcome"
                    body="Pending — pre-registered, awaiting the outcome."
                    muted
                  />
                )}
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  {e.verdictNote}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Honesty caveats — load-bearing */}
      <div style={{ display: 'grid', gap: 8 }}>
        <Caveat title="On the retro cases" body={MECHANISM_LEDGER_CAVEATS.retro} />
        <Caveat
          title="The bulletproof version is forward"
          body={MECHANISM_LEDGER_CAVEATS.forward}
        />
        <Caveat title="Scope" body={MECHANISM_LEDGER_CAVEATS.scope} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>{label}</div>
      <div
        style={{
          fontSize: 'var(--fs-xl)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function Line({ eyebrow, body, muted }: { eyebrow: string; body: string; muted?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: 'var(--fs-xs)',
          color: muted ? 'var(--text-muted)' : 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function Caveat({ title, body }: { title: string; body: string }) {
  return (
    <p
      style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', lineHeight: 1.55 }}
    >
      <strong style={{ color: 'var(--text-secondary)' }}>{title}.</strong> {body}
    </p>
  );
}
