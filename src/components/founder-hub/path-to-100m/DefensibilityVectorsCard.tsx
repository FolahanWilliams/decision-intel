'use client';

/**
 * Defensibility Vectors — the "is it just a wrapper?" reference
 * surface (locked 2026-05-17, audit FH-5.1).
 *
 * The founder spends 50-70hr/wk in the Founder Hub and rehearses the
 * wrapper-rebuttal most in the next 90 days of advisor/investor rooms
 * (Strategy World London ~T-23d). The verbatim spoken answer lives in
 * KillerResponsesPlaybook; THIS is the daily visual reference: the 7
 * non-wrapper vectors with live shipped/queued status, the
 * acqui-hire-vs-scale-binary-is-false reframe, and the do-not-quote
 * guardrail. Resolves from the data/defensibility-vectors SSOT so it
 * can never drift from the CLAUDE.md lock.
 */

import { CheckCircle2, CircleDot, Circle, CircleDashed, AlertTriangle, Quote } from 'lucide-react';
import {
  DEFENSIBILITY_VECTORS,
  ACQUIHIRE_BINARY_REFRAME,
  DO_NOT_QUOTE,
  WRAPPER_ANSWER_POINTER,
  type VectorStatus,
  type Buildability,
} from './data/defensibility-vectors';

const STATUS_META: Record<VectorStatus, { label: string; color: string; icon: React.ReactNode }> = {
  shipped: { label: 'SHIPPED', color: 'var(--success)', icon: <CheckCircle2 size={13} /> },
  partial: { label: 'PARTIAL', color: 'var(--warning)', icon: <CircleDot size={13} /> },
  next: { label: 'NEXT', color: 'var(--accent-secondary, #6366f1)', icon: <Circle size={13} /> },
  queued: { label: 'REQUIRES SCALE', color: 'var(--text-muted)', icon: <CircleDashed size={13} /> },
};

const BUILDABILITY_LABEL: Record<Buildability, string> = {
  immediately_buildable: 'immediately buildable',
  requires_scale: 'requires scale',
  hybrid: 'hybrid (build now · compounds at scale)',
};

export function DefensibilityVectorsCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* The honest frame */}
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        The audit engine <strong>is</strong> a replicable prompt-wrapper — never flatter that. The
        company is what accumulates <em>around</em> it that a fast-follower, an incumbent, or the
        model provider cannot trivially reconstruct: the enforced decision process, the
        tamper-evident institutional record, and the per-org calibration data. The wrapper is the
        wedge; the accumulating decision→outcome graph is the company.
      </p>

      {/* Acqui-hire binary reframe */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.07)',
          border: '1px solid var(--accent-secondary, #6366f1)',
        }}
      >
        <div
          style={{
            fontSize: 'var(--fs-2xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--accent-secondary, #6366f1)',
            marginBottom: 6,
          }}
        >
          {ACQUIHIRE_BINARY_REFRAME.headline}
        </div>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          {ACQUIHIRE_BINARY_REFRAME.body}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            lineHeight: 1.55,
          }}
        >
          {ACQUIHIRE_BINARY_REFRAME.experiment}
        </p>
      </div>

      {/* 7 vectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DEFENSIBILITY_VECTORS.map(v => {
          const s = STATUS_META[v.status];
          return (
            <div
              key={v.n}
              style={{
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${s.color}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                background: 'var(--bg-card)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {v.n}. {v.name}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 700,
                    color: s.color,
                    background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {s.icon}
                  {s.label}
                </span>
                <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--text-muted)' }}>
                  {BUILDABILITY_LABEL[v.buildability]} · {v.moatClass}
                </span>
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 5,
                }}
              >
                {v.claim}
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}
              >
                {v.sharpening}
              </div>
              {v.ref && (
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 'var(--fs-3xs)',
                    color: s.color,
                    fontWeight: 600,
                  }}
                >
                  {v.ref}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Do-not-quote guardrail */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.07)',
          border: '1px solid var(--error)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--fs-2xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--error)',
            marginBottom: 8,
          }}
        >
          <AlertTriangle size={13} />
          Do not quote in advisor / investor rooms
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {DO_NOT_QUOTE.map(d => (
            <div key={d.value} style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: 'var(--error)' }}>{d.value}</span>
              <span style={{ color: 'var(--text-secondary)' }}> — {d.rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pointer to the rehearsable verbatim answer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)',
          padding: '8px 0',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <Quote size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent-primary)' }} />
        <span>{WRAPPER_ANSWER_POINTER}</span>
      </div>
    </div>
  );
}
