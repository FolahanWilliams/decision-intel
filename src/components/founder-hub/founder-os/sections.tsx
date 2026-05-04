'use client';

/**
 * Founder OS content sections — composed into FounderOSTab below the
 * checkin + visualizations. Three pieces:
 *   - BibleVersePill: small daily-rotating verse, top-of-tab.
 *   - WhySfcSection: research-backed reasoning, sabotage tables.
 *   - CommitmentRecord: the "physical record" — captures + displays
 *     personal commitments the founder writes once and re-reads when
 *     unmotivated.
 */

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, ScrollText, Plus, X, Sparkles, Megaphone } from 'lucide-react';
import {
  WHY_SFC_IS_BAD,
  HOW_SFC_SABOTAGES_DI,
  HOW_SFC_SABOTAGES_STANFORD,
  verseForDate,
  PRODUCER_CONSUMER_ASYMMETRY_RULE,
  BUILD_IN_PUBLIC_FORMAT_TABLE,
  BUILD_IN_PUBLIC_HONEST_TEST,
  BUILD_IN_PUBLIC_EXAMPLES,
  type BibleVerse,
} from './content';

// =============================================================================
// BIBLE VERSE PILL — small daily-rotating anchor at the top of the tab
// =============================================================================

export function BibleVersePill() {
  const [verse, setVerse] = useState<BibleVerse | null>(null);

  useEffect(() => {
    setVerse(verseForDate(new Date()));
  }, []);

  if (!verse) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 18px',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--info) 5%, transparent) 0%, color-mix(in srgb, var(--info) 1%, transparent) 100%)',
        border: '1px solid color-mix(in srgb, var(--info) 30%, transparent)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 16,
      }}
    >
      <Sparkles
        size={16}
        style={{ color: 'var(--info)', flexShrink: 0, marginTop: 4 }}
        aria-hidden
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--info)',
            marginBottom: 4,
          }}
        >
          Verse for today · {verse.ref}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--text-primary)',
            lineHeight: 1.55,
            fontStyle: 'italic',
          }}
        >
          &ldquo;{verse.text}&rdquo;
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// WHY SFC IS BAD — research + sabotage tables
// =============================================================================

export function WhySfcSection() {
  return (
    <div
      style={{
        marginTop: 28,
        padding: '20px 22px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--severity-high)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <AlertTriangle size={16} style={{ color: 'var(--severity-high)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          The reasoning · come back here when unmotivated
        </span>
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          margin: 0,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}
      >
        Why short-form content is the single biggest threat to v3.5 + Stanford.
      </h3>
      <p
        style={{
          fontSize: 13.5,
          color: 'var(--text-secondary)',
          margin: '6px 0 18px',
          lineHeight: 1.55,
        }}
      >
        Bookmark this section. When the urge to scroll hits and discipline feels arbitrary, come
        re-read it. The mechanism by which SFC sabotages the plan is concrete and physical, not
        abstract willpower talk.
      </p>

      {/* WHY SFC IS BAD — six research-backed reasons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {WHY_SFC_IS_BAD.map(item => (
          <div
            key={item.heading}
            style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
                lineHeight: 1.35,
              }}
            >
              {item.heading}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {item.body}
            </div>
          </div>
        ))}
      </div>

      {/* HOW SFC SABOTAGES DI — concrete consequence table */}
      <h4
        style={{
          fontSize: 15,
          fontWeight: 700,
          margin: '24px 0 8px',
          color: 'var(--text-primary)',
        }}
      >
        How SFC sabotages Decision Intel specifically
      </h4>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.55 }}>
        Each row maps a cognitive failure mode caused by SFC to a specific v3.5 phase failure. The
        consequences are not vibes — they&apos;re the exact mechanism by which the £10M ARR target
        becomes a quiet shutdown.
      </p>
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 1fr) minmax(300px, 2fr)',
            background: 'var(--bg-secondary)',
            padding: '10px 14px',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border-color)',
            gap: 16,
          }}
        >
          <div>Cognitive failure mode</div>
          <div>v3.5 business consequence</div>
        </div>
        {HOW_SFC_SABOTAGES_DI.map((row, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 1fr) minmax(300px, 2fr)',
              padding: '12px 14px',
              gap: 16,
              borderBottom:
                idx < HOW_SFC_SABOTAGES_DI.length - 1 ? '1px solid var(--border-color)' : 'none',
              fontSize: 13,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 600 }}>{row.cognitiveFailureMode}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{row.v35BusinessConsequence}</div>
          </div>
        ))}
      </div>

      {/* HOW SFC SABOTAGES STANFORD */}
      <h4
        style={{
          fontSize: 15,
          fontWeight: 700,
          margin: '24px 0 8px',
          color: 'var(--text-primary)',
        }}
      >
        How SFC sabotages Stanford
      </h4>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.55 }}>
        The Nov 2027 application is 18 months out. The cognitive substrate that produces the
        application competitiveness gets built (or eroded) every single day between now and then.
      </p>
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 1fr) minmax(300px, 2fr)',
            background: 'var(--bg-secondary)',
            padding: '10px 14px',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border-color)',
            gap: 16,
          }}
        >
          <div>Cognitive failure mode</div>
          <div>Stanford application consequence</div>
        </div>
        {HOW_SFC_SABOTAGES_STANFORD.map((row, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 1fr) minmax(300px, 2fr)',
              padding: '12px 14px',
              gap: 16,
              borderBottom:
                idx < HOW_SFC_SABOTAGES_STANFORD.length - 1
                  ? '1px solid var(--border-color)'
                  : 'none',
              fontSize: 13,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 600 }}>{row.cognitiveFailureMode}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{row.v35BusinessConsequence}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// COMMITMENT RECORD — the physical record for unmotivated moments
// =============================================================================

interface CommitmentItem {
  id: string;
  text: string;
  title: string | null;
  createdAt: string;
}

export function CommitmentRecord() {
  const [commitments, setCommitments] = useState<CommitmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formText, setFormText] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchCommitments = useCallback(async () => {
    try {
      const res = await fetch('/api/founder-os/commitments', {
        cache: 'no-store',
        headers: { 'x-founder-pass': getFounderPass() },
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const json = (await res.json()) as { data?: { commitments?: CommitmentItem[] } };
      setCommitments(json.data?.commitments ?? []);
    } catch {
      // silent — empty state acceptable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  const handleSubmit = async () => {
    if (!formText.trim()) {
      setError('Write the commitment first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/founder-os/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-founder-pass': getFounderPass() },
        body: JSON.stringify({
          text: formText.trim(),
          title: formTitle.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? 'Save failed');
      }
      setFormText('');
      setFormTitle('');
      setShowForm(false);
      await fetchCommitments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const mostRecent = commitments[0];

  return (
    <div
      style={{
        marginTop: 28,
        padding: '20px 22px',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 6%, transparent) 0%, color-mix(in srgb, var(--accent-primary) 1%, transparent) 100%)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--accent-primary)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ScrollText size={15} style={{ color: 'var(--accent-primary)' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
              }}
            >
              Personal commitment · the physical record
            </span>
          </div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            What you committed to your future self.
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(s => !s)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: showForm ? 'var(--bg-card)' : 'var(--accent-primary)',
            color: showForm ? 'var(--text-primary)' : '#fff',
            border: showForm
              ? '1px solid var(--border-color)'
              : '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}{' '}
          {showForm ? 'Cancel' : 'Add commitment'}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            padding: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <input
            type="text"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value.slice(0, 200))}
            placeholder='Title (optional, e.g. "Day 1 commitment", "After Sankore call")'
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
          <textarea
            value={formText}
            onChange={e => setFormText(e.target.value.slice(0, 4000))}
            placeholder="Write what you're committing to your future self. Speak it out loud after writing. The OS will surface this when you're unmotivated."
            rows={6}
            style={{
              padding: '12px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 14,
              lineHeight: 1.55,
              resize: 'vertical',
            }}
          />
          {error && (
            <div
              style={{
                padding: '8px 12px',
                background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !formText.trim()}
              style={{
                padding: '8px 18px',
                background: 'var(--accent-primary)',
                color: '#fff',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: submitting || !formText.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? 'Saving…' : 'Save commitment'}
            </button>
          </div>
        </div>
      )}

      {mostRecent && (
        <div
          style={{
            padding: '16px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 12,
          }}
        >
          {mostRecent.title && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--accent-primary)',
                marginBottom: 6,
              }}
            >
              {mostRecent.title} · {new Date(mostRecent.createdAt).toLocaleDateString()}
            </div>
          )}
          <div
            style={{
              fontSize: 15,
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              fontStyle: 'italic',
            }}
          >
            {mostRecent.text}
          </div>
        </div>
      )}

      {!mostRecent && !loading && !showForm && (
        <div
          style={{
            padding: '16px 18px',
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          No commitment written yet. <strong style={{ color: 'var(--text-primary)' }}>Write
          one.</strong> A specific, dated, signed-off commitment to your future self about WHO you
          are choosing to be in the next 6 years. Re-read it whenever the discipline feels
          arbitrary. The point of writing it is so the future-you who is tired and tempted has a
          message from the present-you who is clear and committed.
        </div>
      )}

      {commitments.length > 1 && (
        <details
          style={{
            marginTop: 8,
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              padding: '4px 0',
            }}
          >
            {commitments.length - 1} earlier commitment{commitments.length - 1 === 1 ? '' : 's'}
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {commitments.slice(1).map(c => (
              <div
                key={c.id}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  {c.title ?? 'Commitment'} · {new Date(c.createdAt).toLocaleDateString()}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontStyle: 'italic',
                  }}
                >
                  {c.text}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// Read founder pass from the env at module load. The component is mounted
// behind the founder hub which gates access; the public env var is the
// in-app credential by design (the server-only FOUNDER_HUB_PASS is the
// real secret per CLAUDE.md). Falling back to '' returns 401 from the
// API — never a silent failure.
function getFounderPass(): string {
  return process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS ?? '';
}

// =============================================================================
// BUILD-IN-PUBLIC PROTOCOL — the resolution to the SFC ↔ audience-building
// paradox. Producer-consumer asymmetry rule + format-locked table + 90-day
// honest test + anchor examples.
// =============================================================================

export function BuildInPublicSection() {
  return (
    <div
      style={{
        marginTop: 28,
        padding: '20px 22px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--info)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Megaphone size={16} style={{ color: 'var(--info)' }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          The build-in-public protocol · the SFC paradox dissolved
        </span>
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          margin: 0,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}
      >
        How to build in public without breaking the OS.
      </h3>
      <p
        style={{
          fontSize: 13.5,
          color: 'var(--text-secondary)',
          margin: '6px 0 18px',
          lineHeight: 1.55,
        }}
      >
        Audience-building and SFC-elimination are not in tension when you separate consumption
        from production. Composition uses System 2 + the prefrontal cortex you are protecting.
        Passive feed-receiving uses System 1 + the variable-reward cycle that suppresses it. The
        cognitive damage the OS is built to prevent comes from the latter, not the former.
      </p>

      {/* THE ASYMMETRY RULE */}
      <div
        style={{
          padding: '14px 16px',
          background: 'color-mix(in srgb, var(--info) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--info) 30%, transparent)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.45,
            marginBottom: 10,
          }}
        >
          {PRODUCER_CONSUMER_ASYMMETRY_RULE.rule}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
          {PRODUCER_CONSUMER_ASYMMETRY_RULE.why}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}
        >
          The four mechanics
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {PRODUCER_CONSUMER_ASYMMETRY_RULE.fourMechanics.map((m, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {m}
            </li>
          ))}
        </ol>
      </div>

      {/* FORMAT TABLE */}
      <h4
        style={{
          fontSize: 15,
          fontWeight: 700,
          margin: '0 0 8px',
          color: 'var(--text-primary)',
        }}
      >
        Format rules — what production looks like per surface
      </h4>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.55 }}>
        The moment a format pulls you back INTO the algorithmic ecosystem to study it (Shorts,
        Reels, daily shitposting), the asymmetry breaks and the OS starts losing.
      </p>
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(120px, 0.7fr) minmax(280px, 1.6fr) minmax(280px, 1.4fr)',
            background: 'var(--bg-secondary)',
            padding: '10px 14px',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border-color)',
            gap: 16,
          }}
        >
          <div>Format</div>
          <div>Rule</div>
          <div>Why</div>
        </div>
        {BUILD_IN_PUBLIC_FORMAT_TABLE.map((row, idx) => {
          const isBan = row.format.includes('TikTok') || row.format.includes('Shorts');
          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 0.7fr) minmax(280px, 1.6fr) minmax(280px, 1.4fr)',
                padding: '12px 14px',
                gap: 16,
                borderBottom:
                  idx < BUILD_IN_PUBLIC_FORMAT_TABLE.length - 1
                    ? '1px solid var(--border-color)'
                    : 'none',
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.55,
                background: isBan
                  ? 'color-mix(in srgb, var(--error) 4%, transparent)'
                  : 'transparent',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: isBan ? 'var(--error)' : 'var(--text-primary)',
                }}
              >
                {row.format}
              </div>
              <div style={{ color: 'var(--text-primary)' }}>{row.rule}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{row.why}</div>
            </div>
          );
        })}
      </div>

      {/* THE HONEST TEST */}
      <div
        style={{
          marginTop: 18,
          padding: '14px 16px',
          background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-primary)',
            marginBottom: 6,
          }}
        >
          The honest test · {BUILD_IN_PUBLIC_HONEST_TEST.cadence}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            marginBottom: 10,
          }}
        >
          {BUILD_IN_PUBLIC_HONEST_TEST.question}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: 'var(--success)' }}>If yes:</strong>{' '}
            {BUILD_IN_PUBLIC_HONEST_TEST.ifYes}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text-primary)',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: 'var(--error)' }}>If no:</strong>{' '}
            {BUILD_IN_PUBLIC_HONEST_TEST.ifNo}
          </div>
        </div>
      </div>

      {/* EXAMPLES */}
      <h4
        style={{
          fontSize: 15,
          fontWeight: 700,
          margin: '24px 0 4px',
          color: 'var(--text-primary)',
        }}
      >
        Anchor cases — solo founders who proved the asymmetry works
      </h4>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.55 }}>
        Five primary-source existence proofs that compounding audiences get built without an
        algorithmic-feed motion. None of them have a TikTok strategy.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {BUILD_IN_PUBLIC_EXAMPLES.map(ex => (
          <div
            key={ex.founder}
            style={{
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
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
              {ex.founder}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 4 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Motion:</strong> {ex.motion}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--accent-primary)' }}>Outcome:</strong> {ex.outcome}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
