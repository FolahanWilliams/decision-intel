'use client';

/**
 * Buyer Brief — founder-private "know their world like an insider" tab.
 *
 * On a first call a pre-revenue founder has no brand trust. The fastest way to
 * earn it is to show you genuinely understand the searcher's world. This tab is
 * the field-fluency reference: who they are, the words (with definitions), the
 * numbers to know cold (tagged by confidence), their journey, and how to turn
 * it into credibility on the call. Reads the SSOT in buyer-brief/.
 */

import {
  User,
  Flame,
  Map as MapIcon,
  BookOpen,
  Calculator,
  CheckCircle2,
  Quote,
  Handshake,
  ShieldAlert,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import { BuyerJourneyViz } from './buyer-brief/BuyerJourneyViz';
import {
  BUYER_ONE_LINER,
  WHO_THEY_ARE,
  EMOTIONAL_ARC,
  FEARS_VERBATIM,
  INSIDER_VOCAB,
  AVOID_VOCAB,
  KNOW_COLD_NUMBERS,
  WHAT_GOOD_LOOKS_LIKE,
  JOURNEY_STAGES,
  INSIDER_PHRASES,
  CREDIBILITY_MOVES,
  DO_NOT_QUOTE,
  type KnowColdNumber,
} from './buyer-brief/buyer-brief-data';

const SectionHead = ({
  icon,
  kicker,
  title,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
    <span style={{ color: 'var(--accent-primary)', display: 'inline-flex' }}>{icon}</span>
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
        }}
      >
        {kicker}
      </div>
      <h2
        style={{
          margin: '2px 0 0',
          fontSize: 'var(--fs-lg)',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h2>
    </div>
  </div>
);

const CONF_META: Record<KnowColdNumber['confidence'], { label: string; color: string }> = {
  hard: { label: 'SAFE TO QUOTE', color: 'var(--success)' },
  soft: { label: 'SOFT · HEDGE IT', color: 'var(--warning)' },
  attribute: { label: 'ATTRIBUTE IT', color: 'var(--warning)' },
};

export function BuyerBriefTab() {
  return (
    <div style={{ maxWidth: 940, margin: '0 auto', display: 'grid', gap: 28 }}>
      {/* header + the buyer thesis */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--fs-page-h1-platform)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          Buyer Brief · know their world
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}
        >
          You have no brand trust yet. You earn it on the first call by showing you genuinely know
          the searcher&rsquo;s world — the SBA mechanics, the QoE, the broken-deal math, the 3 a.m.
          fear — <em>before</em> you mention the product. That is what makes them think &ldquo;this
          person actually gets it.&rdquo;
        </p>
        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            borderLeft: '3px solid var(--accent-primary)',
            background: 'var(--bg-elevated)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            fontSize: 14.5,
            fontStyle: 'italic',
            lineHeight: 1.55,
            color: 'var(--text-primary)',
          }}
        >
          {BUYER_ONE_LINER}
        </div>
      </div>

      {/* who they are + emotional arc */}
      <section>
        <SectionHead
          icon={<User size={18} />}
          kicker="The person across the table"
          title="Who they are"
        />
        <div style={{ display: 'grid', gap: 12 }}>
          {WHO_THEY_ARE.map((t, i) => (
            <AccentCard key={i} accent="info">
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.title}
              </div>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                }}
              >
                {t.body}
              </p>
            </AccentCard>
          ))}
          <AccentCard accent="warning" title="The emotional arc">
            <p
              style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}
            >
              {EMOTIONAL_ARC}
            </p>
          </AccentCard>
        </div>
      </section>

      {/* fears verbatim */}
      <section>
        <SectionHead
          icon={<Flame size={18} />}
          kicker="Say it back and they feel seen"
          title="Their fears, in their own words"
        />
        <AccentCard accent="danger" tinted>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
            {FEARS_VERBATIM.map((f, i) => (
              <li
                key={i}
                style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-primary)' }}
              >
                {f}
              </li>
            ))}
          </ul>
        </AccentCard>
      </section>

      {/* journey */}
      <section>
        <SectionHead
          icon={<MapIcon size={18} />}
          kicker="Where you actually fit"
          title="The journey, stage by stage"
        />
        <AccentCard accent="primary">
          <BuyerJourneyViz />
        </AccentCard>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {JOURNEY_STAGES.map((s, i) => {
            const peak = s.diFit.startsWith('Peak');
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(96px, 0.6fr) 1.4fr 1.4fr',
                  gap: 12,
                  padding: '10px 14px',
                  background: peak
                    ? 'color-mix(in srgb, var(--accent-primary) 6%, var(--bg-card))'
                    : 'var(--bg-card)',
                  border: `1px solid ${peak ? 'color-mix(in srgb, var(--accent-primary) 28%, var(--border-color))' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  alignItems: 'start',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: peak ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}
                >
                  {s.stage}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {s.feels}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {s.diFit}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* vocabulary */}
      <section>
        <SectionHead
          icon={<BookOpen size={18} />}
          kicker="Speak the language"
          title="Insider vocabulary (with what each actually means)"
        />
        <div style={{ display: 'grid', gap: 10 }}>
          {INSIDER_VOCAB.map((v, i) => (
            <AccentCard key={i} accent="muted">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {v.term}
              </div>
              <p
                style={{
                  margin: '5px 0 0',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                }}
              >
                {v.def}
              </p>
              {v.onCall && (
                <p
                  style={{
                    margin: '7px 0 0',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: 'var(--accent-primary)',
                  }}
                >
                  <strong>On a call:</strong> {v.onCall}
                </p>
              )}
            </AccentCard>
          ))}
        </div>
        <AccentCard
          accent="danger"
          tinted
          style={{ marginTop: 12 }}
          title="Never say (it marks you as an outsider)"
        >
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {AVOID_VOCAB.map((a, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)' }}>
                {a}
              </li>
            ))}
          </ul>
        </AccentCard>
      </section>

      {/* numbers to know cold */}
      <section>
        <SectionHead
          icon={<Calculator size={18} />}
          kicker="Know these cold — and quote them right"
          title="The economics they live"
        />
        <div style={{ display: 'grid', gap: 10 }}>
          {KNOW_COLD_NUMBERS.map((n, i) => {
            const meta = CONF_META[n.confidence];
            return (
              <AccentCard key={i} accent={n.confidence === 'hard' ? 'success' : 'warning'}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {n.stat}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      color: meta.color,
                      border: `1px solid ${meta.color}`,
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {n.value}
                </p>
                {n.note && (
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    {n.note}
                  </p>
                )}
              </AccentCard>
            );
          })}
        </div>
      </section>

      {/* what good looks like + insider phrases */}
      <section>
        <SectionHead
          icon={<CheckCircle2 size={18} />}
          kicker="Speak their best practices"
          title="What &lsquo;good&rsquo; looks like to them"
        />
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr' }}>
          <AccentCard accent="success">
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              {WHAT_GOOD_LOOKS_LIKE.map((g, i) => (
                <li
                  key={i}
                  style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}
                >
                  {g}
                </li>
              ))}
            </ul>
          </AccentCard>
          <AccentCard
            accent="muted"
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Quote size={14} /> Drop one of these correctly and you sound like an insider
              </span>
            }
          >
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              {INSIDER_PHRASES.map((p, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                  }}
                >
                  {p}
                </li>
              ))}
            </ul>
          </AccentCard>
        </div>
      </section>

      {/* credibility moves */}
      <section>
        <SectionHead
          icon={<Handshake size={18} />}
          kicker="Turn knowledge into trust"
          title="How to use this on the call"
        />
        <div style={{ display: 'grid', gap: 10 }}>
          {CREDIBILITY_MOVES.map((m, i) => (
            <AccentCard key={i} accent="primary">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {m.move}
              </div>
              <p
                style={{
                  margin: '5px 0 0',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                }}
              >
                {m.how}
              </p>
            </AccentCard>
          ))}
        </div>
      </section>

      {/* do-not-quote guardrails */}
      <section>
        <SectionHead
          icon={<ShieldAlert size={18} />}
          kicker="One wrong stat and you're the thing your product warns against"
          title="Honesty guardrails — carry into every call"
        />
        <AccentCard accent="danger" tinted>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 7 }}>
            {DO_NOT_QUOTE.map((d, i) => (
              <li
                key={i}
                style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-primary)' }}
              >
                {d}
              </li>
            ))}
          </ul>
        </AccentCard>
      </section>
    </div>
  );
}
