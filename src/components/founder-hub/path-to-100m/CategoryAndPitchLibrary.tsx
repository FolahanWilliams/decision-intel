'use client';

import { useState } from 'react';
import { Skull, Snowflake, Zap, Flame, X } from 'lucide-react';
import { CATEGORY_DEFINITION, PERSONA_PITCH_LIBRARY, LANGUAGE_PATTERNS } from './data';

const VOCAB_ACCENT = ['#0EA5E9', '#7C3AED', '#16A34A'];
const VOCAB_ICON = [Snowflake, Zap, Flame];

export function CategoryAndPitchLibrary() {
  const [activePersona, setActivePersona] = useState(PERSONA_PITCH_LIBRARY[0].id);
  const persona =
    PERSONA_PITCH_LIBRARY.find(p => p.id === activePersona) ?? PERSONA_PITCH_LIBRARY[0];

  return (
    <div>
      {/* WARM CLAIM + COLD DESCRIPTIVE */}
      <div className="cat-claim-grid">
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.04))',
            border: '1px solid rgba(22,163,74,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Warm category claim
          </div>
          <div
            style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}
          >
            {CATEGORY_DEFINITION.warmCategoryClaim}
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.10), rgba(14,165,233,0.04))',
            border: '1px solid rgba(14,165,233,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#0EA5E9',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Cold descriptive
          </div>
          <div
            style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}
          >
            {CATEGORY_DEFINITION.coldDescriptive}
          </div>
        </div>
      </div>

      {/* WHAT IT IS */}
      <div
        style={{
          marginTop: 14,
          padding: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#16A34A',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          What it IS
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          {CATEGORY_DEFINITION.whatItIs}
        </p>
      </div>

      {/* WHAT IT IS NOT */}
      <div
        style={{
          marginTop: 12,
          padding: 14,
          background: 'rgba(220,38,38,0.04)',
          border: '1px solid rgba(220,38,38,0.18)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 800,
            color: '#DC2626',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          <Skull size={11} /> What it IS NOT
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
          {CATEGORY_DEFINITION.whatItIsNot.map(n => (
            <li
              key={n}
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginBottom: 4,
                lineHeight: 1.5,
              }}
            >
              {n}
            </li>
          ))}
        </ul>
      </div>

      {/* WHY NOW */}
      <div className="cat-why-grid" style={{ marginTop: 12 }}>
        <div
          style={{
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #D97706',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#D97706',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            What problem it solves
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
            {CATEGORY_DEFINITION.whatProblemItSolves}
          </p>
          <div
            style={{
              marginTop: 10,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}
          >
            The four-tool graveyard
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORY_DEFINITION.fourToolGraveyard.map(t => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  background: 'rgba(220,38,38,0.08)',
                  color: '#DC2626',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {t.split(' — ')[0]}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #16A34A',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Why it is possible NOW
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
            {CATEGORY_DEFINITION.whyItIsPossibleNow}
          </p>
        </div>
      </div>

      {/* VOCABULARY BY CONTEXT */}
      <div
        style={{
          marginTop: 16,
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        Vocabulary by reader temperature
      </div>
      <div className="cat-vocab-grid">
        {CATEGORY_DEFINITION.vocabularyByContext.map((v, i) => {
          const Icon = VOCAB_ICON[i] ?? Zap;
          const accent = VOCAB_ACCENT[i] ?? '#7C3AED';
          return (
            <div
              key={v.context}
              style={{
                padding: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderTop: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: accent,
                  marginBottom: 8,
                }}
              >
                <Icon size={12} /> {v.context}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                {v.useThisLanguage}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  padding: 8,
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {v.example}
              </div>
            </div>
          );
        })}
      </div>

      {/* PERSONA PITCH LIBRARY */}
      <div
        style={{
          marginTop: 18,
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        Persona pitch library · click any persona for the full pitch
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {PERSONA_PITCH_LIBRARY.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePersona(p.id)}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${p.id === activePersona ? '#16A34A' : 'var(--border-color)'}`,
              background: p.id === activePersona ? 'rgba(22,163,74,0.10)' : 'var(--bg-card)',
              color: p.id === activePersona ? '#16A34A' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {p.persona}
          </button>
        ))}
      </div>

      <div
        style={{
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#DC2626',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            Their pain
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {persona.theirPain}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            The pitch
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
              padding: 10,
              background: 'rgba(22,163,74,0.04)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {persona.pitch}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#7C3AED',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            The closing move
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {persona.closingMove}
          </div>
        </div>
      </div>

      {/* LANGUAGE PATTERNS */}
      <div
        style={{
          marginTop: 18,
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        Language patterns · feature → protected revenue
      </div>
      {LANGUAGE_PATTERNS.map(l => (
        <div
          key={l.id}
          style={{
            padding: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            {l.pattern}
          </div>

          <div className="lang-pattern-grid">
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#DC2626',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <X size={10} /> Don&apos;t say
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  padding: 8,
                  background: 'rgba(220,38,38,0.04)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {l.featureFraming}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#16A34A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}
              >
                Say
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  padding: 8,
                  background: 'rgba(22,163,74,0.06)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {l.protectedRevenueFraming}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            Why it works: {l.whyItWorks}
          </div>
        </div>
      ))}

      <style>{`
        .cat-claim-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .cat-why-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 12px;
        }
        .cat-vocab-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .lang-pattern-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 900px) {
          .cat-claim-grid,
          .cat-why-grid,
          .cat-vocab-grid,
          .lang-pattern-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
