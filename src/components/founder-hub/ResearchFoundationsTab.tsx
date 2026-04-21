'use client';

import {
  Target,
  MessageSquare,
  BookOpen,
  Zap,
  ChevronRight,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { IntellectualConstellation } from './research/IntellectualConstellation';
import { NoiseMomentViz } from './research/NoiseMomentViz';
import { DualFrameworkAxis } from './research/DualFrameworkAxis';
import { StrebulaevPrinciples } from './research/StrebulaevPrinciples';
import { DecisionQualityChain } from './research/DecisionQualityChain';
import { DecisionHygieneQuadrants } from './research/DecisionHygieneQuadrants';
import { MethodologyTimeline } from './research/MethodologyTimeline';
import { ResearchLibrary } from './research/ResearchLibrary';
import {
  CONNECTING_THREAD,
  TAKEAWAYS,
  FOUNDER_NOTES,
  SALES_PERSONAS,
  KEY_TALKING_POINTS,
} from '@/lib/data/research-foundations';

export function ResearchFoundationsTab() {
  return (
    <div>
      {renderHero()}
      <NoiseMomentViz />
      <IntellectualConstellation />
      <MethodologyTimeline />
      <DualFrameworkAxis />
      <DecisionHygieneQuadrants />
      <DecisionQualityChain />
      <StrebulaevPrinciples />
      <ResearchLibrary />
      {renderSalesPositioning()}
      {renderKeyTalkingPoints()}
      {renderFounderNotes()}
      {renderConnectingThread()}
      {renderTakeaways()}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────

function renderHero() {
  return (
    <div
      style={{
        padding: 18,
        background: 'linear-gradient(135deg, rgba(22,163,74,0.09), rgba(139,92,246,0.08))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#16A34A',
          marginBottom: 6,
        }}
      >
        Research & Foundations
      </div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        260 years of decision science, ready to cite.
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 8,
          marginBottom: 0,
          lineHeight: 1.55,
          maxWidth: 760,
        }}
      >
        Every thinker, framework, and paper that shaped Decision Intel — visualised, searchable, and
        tied to the specific file or feature in the product. Scroll for the Noise moment (the
        &ldquo;holy shit&rdquo; stat every sales call opens with), the intellectual constellation,
        the Kahneman↔Klein synthesis, the 6-link Decision Quality Chain, Strebulaev&rsquo;s 9 VC
        principles, and the research library. End with the founder playbook and takeaways.
      </p>
    </div>
  );
}

// ─── Sales positioning (from legacy PlaybookAndResearch) ─────────

function renderSalesPositioning() {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.18)',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Target size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Sales positioning by buyer persona
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Hook · pitch · close — per-persona opener for the first 60 seconds of every call.
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {SALES_PERSONAS.map(p => (
          <div
            key={p.persona}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid #F59E0B',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              {p.persona}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#F59E0B',
                fontStyle: 'italic',
                marginBottom: 6,
                lineHeight: 1.55,
              }}
            >
              {p.hook}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginBottom: 6,
              }}
            >
              {p.pitch}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                paddingTop: 6,
                borderTop: '1px dashed var(--border-color)',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Close:</strong> {p.close}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Key talking points ──────────────────────────────────────────

function renderKeyTalkingPoints() {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(59, 130, 246, 0.18)',
            color: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MessageSquare size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Key talking points
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            The lines that consistently land in demos and investor conversations.
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {KEY_TALKING_POINTS.map(item => (
          <div
            key={item.point}
            style={{
              padding: 10,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: 10,
            }}
          >
            <ChevronRight size={14} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 2 }} />
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {item.point}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginLeft: 6,
                }}
              >
                — {item.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Founder notes ────────────────────────────────────────────────

function renderFounderNotes() {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid #16A34A',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BookOpen size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Founder notes
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Durable insights worth re-reading quarterly.
          </div>
        </div>
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {FOUNDER_NOTES.map(n => (
          <li
            key={n.headline}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              {n.headline}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {n.detail}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Connecting thread ───────────────────────────────────────────

function renderConnectingThread() {
  return (
    <section
      style={{
        padding: 18,
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.10), rgba(22, 163, 74, 0.06))',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid #8B5CF6',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(139, 92, 246, 0.18)',
            color: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Crosshair size={16} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          The connecting thread
        </div>
      </div>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {CONNECTING_THREAD}
      </p>
    </section>
  );
}

// ─── Takeaways ───────────────────────────────────────────────────

function renderTakeaways() {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid #16A34A',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Most actionable takeaways
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            The cross-cutting action items from everything above.
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 10,
        }}
      >
        {TAKEAWAYS.map(item => (
          <div
            key={item.action}
            style={{
              padding: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid #16A34A',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 4,
              }}
            >
              <Sparkles size={12} style={{ color: '#16A34A' }} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {item.action}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {item.detail}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
