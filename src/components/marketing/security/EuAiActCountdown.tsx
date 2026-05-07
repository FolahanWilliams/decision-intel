'use client';

/**
 * EuAiActCountdown — calendar-leverage hero for the EU AI Act
 * Article 14 high-risk decision-support obligations enforcement
 * deadline (August 2, 2026).
 *
 * Item locked 2026-05-07. Per the 2026-05-07 nightly audit Section 9
 * critical pickup #1: every F500 GC reads vendor materials with a
 * "what does this do for our August 2 deadline?" lens by July, but
 * /security treats August 2026 as "the future" without a specific
 * countdown. Procurement-buying conversation in late June through
 * August is the most calendar-leverageable moment of the next 90 days.
 *
 * Component shape:
 *   - Hero countdown (large days-remaining number, mount-time computed
 *     per react-hooks/purity rule).
 *   - Three article-specific cards (Art 13 transparency, Art 14 human
 *     oversight, Art 15 accuracy + record-keeping) + Annex III high-risk
 *     decision-support classification, each mapped to the SPECIFIC DI
 *     surface that satisfies the requirement TODAY.
 *   - Status pill — RED when < 30 days, AMBER when 30-90 days, INFO-BLUE
 *     when > 90 days.
 *
 * Mounted on /security as the lead-in to the existing regulatory
 * tailwinds section.
 */

import { useState } from 'react';
import { Calendar, ShieldCheck, Eye, FileCheck, AlertTriangle } from 'lucide-react';

const ENFORCEMENT_DATE_ISO = '2026-08-02';
const ENFORCEMENT_DATE_LABEL = 'August 2, 2026';

interface ArticleMap {
  code: string;
  name: string;
  /** Plain-English requirement summary. */
  requirement: string;
  /** Specific DI surface that satisfies the requirement. */
  diMapping: string;
  icon: typeof Eye;
}

const ARTICLE_MAP: ArticleMap[] = [
  {
    code: 'Art. 13',
    name: 'Transparency to the deployer',
    requirement:
      'High-risk AI systems must include instructions describing the system’s capabilities, limitations, accuracy, and the human oversight measures designed in.',
    diMapping:
      'Decision Provenance Record cover page · methodology version · validity classification band · feedback adequacy verdict. Every audited memo carries a deployer-facing transparency strip on page 1.',
    icon: Eye,
  },
  {
    code: 'Art. 14',
    name: 'Human oversight obligations',
    requirement:
      'High-risk AI systems must enable natural-person oversight — the deployer must be able to interpret the output, override it, and understand its limits.',
    diMapping:
      'Reviewer Decisions / HITL log on page 5 of every DPR · dismissed-flag rationale capture · metaJudge adversarial verdict. Override is a first-class state, not a bypass.',
    icon: ShieldCheck,
  },
  {
    code: 'Art. 15',
    name: 'Accuracy + record-keeping',
    requirement:
      'High-risk AI systems must achieve appropriate levels of accuracy and provide automatic logging that allows traceability throughout the system’s lifecycle.',
    diMapping:
      'Brier 0.258 calibration baseline (143-case reference corpus) · SHA-256 input hash · prompt fingerprint · judge variance per audit. Every DPR is a tamper-evident lifecycle log.',
    icon: FileCheck,
  },
  {
    code: 'Annex III',
    name: 'High-risk decision-support classification',
    requirement:
      'Annex III lists the use cases that trigger high-risk obligations — employment, education, essential services, law enforcement, migration, justice, democratic processes.',
    diMapping:
      'The 19-framework regulatory map flags Annex III applicability per audit. EU-deployed customers see the specific use-case classification on the DPR Regulatory Crosswalk grid (page 6).',
    icon: AlertTriangle,
  },
];

interface CountdownState {
  daysRemaining: number;
  weeksRemaining: number;
  isPastDeadline: boolean;
}

function computeCountdown(mountTime: number): CountdownState {
  const target = new Date(`${ENFORCEMENT_DATE_ISO}T00:00:00Z`).getTime();
  const diffMs = target - mountTime;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    daysRemaining: Math.max(0, daysRemaining),
    weeksRemaining: Math.max(0, Math.floor(daysRemaining / 7)),
    isPastDeadline: daysRemaining < 0,
  };
}

interface PaletteEntry {
  green: string;
  greenSoft: string;
  greenBorder: string;
  amber: string;
  amberSoft: string;
  amberBorder: string;
  red: string;
  redSoft: string;
  redBorder: string;
  navy: string;
  navyLight: string;
  white: string;
  slate100: string;
  slate200: string;
  slate300: string;
  slate400: string;
  slate500: string;
  slate600: string;
  slate900: string;
}

interface Props {
  /** Color palette imported from /security so the countdown matches the
   *  surrounding regulatory-tailwinds section. */
  palette: PaletteEntry;
}

export function EuAiActCountdown({ palette: C }: Props) {
  // Mount-time captured once per render-tree per react-hooks/purity rule.
  // Day-precision countdown is fine — the chip caption changes slowly,
  // and a remount on next page-visit refreshes it.
  const [mountTime] = useState(() => Date.now());
  const countdown = computeCountdown(mountTime);

  // Severity tone: < 30d = red (immediate procurement urgency),
  // 30-90d = amber (active procurement calendar), > 90d = info-blue
  // (planning horizon).
  const severity = countdown.isPastDeadline
    ? { label: 'Enforcement live', tone: C.red, soft: C.redSoft, border: C.redBorder }
    : countdown.daysRemaining < 30
      ? { label: 'Imminent', tone: C.red, soft: C.redSoft, border: C.redBorder }
      : countdown.daysRemaining < 90
        ? {
            label: 'Procurement window open',
            tone: C.amber,
            soft: C.amberSoft,
            border: C.amberBorder,
          }
        : {
            label: 'Calendared',
            tone: '#86EFAC',
            soft: 'rgba(22,163,74,0.12)',
            border: 'rgba(22,163,74,0.25)',
          };

  return (
    <div
      style={{
        background: C.navyLight,
        border: `1px solid rgba(255,255,255,0.08)`,
        borderLeft: `4px solid ${severity.tone}`,
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 28,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 320px) 1fr',
          gap: 32,
          alignItems: 'flex-start',
        }}
        className="eu-ai-act-countdown-grid"
      >
        {/* Countdown hero */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: severity.tone,
              background: severity.soft,
              border: `1px solid ${severity.border}`,
              padding: '4px 10px',
              borderRadius: 999,
              marginBottom: 14,
            }}
          >
            <Calendar size={11} strokeWidth={2.5} aria-hidden />
            {severity.label}
          </div>
          <div
            style={{
              fontSize: 'clamp(48px, 6vw, 72px)',
              fontWeight: 800,
              lineHeight: 1,
              color: severity.tone,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            {countdown.isPastDeadline ? 'Live' : countdown.daysRemaining}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: C.slate400,
              marginBottom: 14,
            }}
          >
            {countdown.isPastDeadline
              ? `Enforcement began ${ENFORCEMENT_DATE_LABEL}`
              : countdown.daysRemaining === 1
                ? 'day until enforcement'
                : `days until enforcement · ${countdown.weeksRemaining} weeks`}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: C.slate300,
              lineHeight: 1.6,
            }}
          >
            EU AI Act high-risk decision-support obligations enforce on{' '}
            <strong style={{ color: C.white }}>{ENFORCEMENT_DATE_LABEL}</strong>. Every F500 GC and
            audit-committee chair reads vendor materials this summer through one lens:{' '}
            <em>what does this do for our August 2 deadline?</em>
          </div>
        </div>

        {/* Article mapping grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {ARTICLE_MAP.map(article => {
            const Icon = article.icon;
            return (
              <article
                key={article.code}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: 'rgba(22,163,74,0.12)',
                      border: '1px solid rgba(22,163,74,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#86EFAC',
                      flexShrink: 0,
                    }}
                    aria-hidden
                  >
                    <Icon size={13} strokeWidth={2.25} />
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        color: '#86EFAC',
                        textTransform: 'uppercase',
                      }}
                    >
                      {article.code}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.white,
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {article.name}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.slate400,
                    lineHeight: 1.55,
                  }}
                >
                  {article.requirement}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.slate200,
                    lineHeight: 1.6,
                    paddingTop: 8,
                    borderTop: '1px dashed rgba(255,255,255,0.1)',
                  }}
                >
                  <span
                    style={{
                      color: '#86EFAC',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontSize: 9.5,
                      marginRight: 4,
                    }}
                  >
                    DI maps via:
                  </span>
                  {article.diMapping}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Mobile collapse — single-column below 800px */}
      <style>{`
        @media (max-width: 800px) {
          .eu-ai-act-countdown-grid {
            grid-template-columns: 1fr !important;
            gap: 22px !important;
          }
        }
      `}</style>
    </div>
  );
}
