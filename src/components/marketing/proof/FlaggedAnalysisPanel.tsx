import { Shield, AlertTriangle, Brain } from 'lucide-react';
import Link from 'next/link';
import { formatBiasName } from '@/lib/utils/labels';

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  red: '#DC2626',
  redLight: 'rgba(220, 38, 38, 0.08)',
  amber: '#F59E0B',
  violet: '#7C3AED',
  violetLight: 'rgba(124, 58, 237, 0.08)',
};

/**
 * Simple hypothetical DQI projection from a list of flaggable biases.
 * More biases → lower score. Calibrated to land in the 30–60 range for cases
 * with 2–5 flaggable biases (the range of our real seed data).
 */
function projectDqi(biasCount: number): { score: number; label: string; color: string } {
  const base = 80;
  const penalty = Math.min(biasCount * 9, 50);
  const score = Math.max(20, base - penalty);
  if (score < 40) return { score, label: 'HIGH RISK', color: C.red };
  if (score < 70) return { score, label: 'MODERATE', color: C.amber };
  return { score, label: 'DEFENSIBLE', color: C.green };
}

interface FlaggedAnalysisPanelProps {
  detectableRedFlags: string[];
  flaggableBiases: string[];
  hypotheticalAnalysis: string;
}

export function FlaggedAnalysisPanel({
  detectableRedFlags,
  flaggableBiases,
  hypotheticalAnalysis,
}: FlaggedAnalysisPanelProps) {
  const dqi = projectDqi(flaggableBiases.length);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Hero — the DI-stamped analysis header + DQI */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.slate200}`,
          borderRadius: 12,
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: C.greenLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Shield size={20} style={{ color: C.green }} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate400,
              marginBottom: 2,
            }}
          >
            Decision Intel · Hypothetical Audit
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: C.slate900,
              lineHeight: 1.35,
            }}
          >
            What we would have flagged — at decision time.
          </div>
        </div>
        <div
          style={{
            borderLeft: `1px solid ${C.slate200}`,
            paddingLeft: 16,
            textAlign: 'right',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: dqi.color,
              marginBottom: 2,
            }}
          >
            {dqi.label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: dqi.color,
              fontFamily: 'var(--font-mono, monospace)',
              lineHeight: 1,
            }}
          >
            {dqi.score}
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: C.slate400,
                fontFamily: 'inherit',
              }}
            >
              /100
            </span>
          </div>
          <div style={{ fontSize: 10, color: C.slate400, marginTop: 2 }}>Projected DQI</div>
        </div>
      </div>

      {/* Red flags — numbered to match the document's left-rail markers */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.slate200}`,
          borderRadius: 12,
          padding: '18px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <AlertTriangle size={14} style={{ color: C.red }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: C.slate700,
            }}
          >
            Red Flags Detectable at Decision Time
          </span>
          <span style={{ fontSize: 11, color: C.slate400 }}>
            · {detectableRedFlags.length}
          </span>
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {detectableRedFlags.map((flag, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '10px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${C.slate100}`,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: C.redLight,
                  color: C.red,
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
                aria-hidden
              >
                {i + 1}
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: C.slate700,
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {flag}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Biases panel */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.slate200}`,
          borderRadius: 12,
          padding: '18px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Brain size={14} style={{ color: C.violet }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: C.slate700,
            }}
          >
            Flaggable Biases
          </span>
          <span style={{ fontSize: 11, color: C.slate400 }}>· {flaggableBiases.length}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {flaggableBiases.map(b => (
            <Link
              key={b}
              href={`/taxonomy#${b}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '5px 11px',
                borderRadius: 999,
                background: C.violetLight,
                color: C.violet,
                border: `1px solid rgba(124, 58, 237, 0.2)`,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {formatBiasName(b)}
            </Link>
          ))}
        </div>
      </div>

      {/* Hypothetical analysis — framed quote */}
      <div
        style={{
          background: '#0F172A',
          color: C.white,
          borderRadius: 12,
          padding: '20px 22px',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: C.green,
            marginBottom: 10,
          }}
        >
          Hypothetical analysis
        </div>
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.65,
            color: 'rgba(255, 255, 255, 0.85)',
            margin: 0,
          }}
        >
          {hypotheticalAnalysis}
        </p>
      </div>
    </div>
  );
}
