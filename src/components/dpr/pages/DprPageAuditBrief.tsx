/**
 * DPR Audit Brief — the buyer-first executive pages (locked 2026-07-02,
 * founder-directed: "the DPR must carry the critical context from the
 * audit deliverable, from the buyer's perspective").
 *
 * The DPR was a legal-evidence record; the buyer reads it for five
 * questions, in this order:
 *
 *   1. What are the structural risks in my deal?        → §1b risks
 *   2. How do they materialize?                          → §1b pathways + questions
 *   3. Why should I care?                                → §1b exposure ($)
 *   4. What does the room think / what do I do about it? → §1c verdict + fixes
 *   5. How did you find them?                            → the existing §2-§6
 *      methodology / R²F / findings / crosswalk pages (unchanged, after)
 *
 * Both pages are composed from the SAME pure `buildAuditDeliverable`
 * output the website Executive view renders — one composer, web + PDF,
 * no drift. Pages render ONLY when a deliverable could be composed
 * (per-document audits); specimens + legacy paths skip them gracefully.
 *
 * Honesty rules carried over verbatim from the deliverable locks:
 * exposure is "carried uncaught", never "we saved you $X"; the blind
 * badge claims "live retrieval disabled", never "the model could not
 * have known"; a degraded detector renders as an outage, never a pass.
 */

import { DprPageShell } from '../primitives/DprPageShell';
import { DprSection } from '../primitives/DprSection';
import { DprNotice } from '../primitives/DprNotice';
import { STRATEGIC_NODE_CLASS_LABEL } from '@/lib/deliverable/strategic-nodes';
import { formatExposureLabel } from '@/lib/deliverable/valueAtStake';
import type { StructuralFragility } from '@/lib/deliverable/fragility-index';
import { FRAGILITY_BAND_LABEL } from '@/lib/deliverable/fragility-index';
import { RESILIENCE_DIMENSION_LABEL } from '@/lib/deliverable/resilience-signature';
import { scrubClientSafe } from '@/lib/reports/client-safe-scrub';
import type { AuditDeliverable } from '@/lib/deliverable/types';

type Classification = 'sample' | 'specimen' | 'confidential' | 'client-safe-export';

interface BriefPageChrome {
  pageNumber: number;
  totalPages: number;
  classification?: Classification;
  auditTimestamp: string;
  footerTitle?: string;
  clientSafe?: boolean;
}

function scrub(text: string, clientSafe: boolean): string {
  return clientSafe ? scrubClientSafe(text) : text;
}

/* ────────────────────────────────────────────────────────────────────
 * §1b — What this audit found · the executive brief
 * ──────────────────────────────────────────────────────────────────── */

export function DprPageAuditBrief({
  deliverable,
  pageNumber,
  totalPages,
  classification = 'confidential',
  auditTimestamp,
  footerTitle = 'Decision Provenance Record',
  clientSafe = false,
}: BriefPageChrome & { deliverable: AuditDeliverable }) {
  const cover = deliverable.cover;
  const exposure = cover.quantifiedExposure;
  const structural = deliverable.reasoningRisks.strategicExposure ?? [];
  const ach = deliverable.reasoningRisks.ach;
  const questions = deliverable.historicalAnalogs.forgottenQuestions.filter(
    q => q.severity === 'critical' || q.severity === 'high'
  );
  const synthesized = deliverable.reasoningRisks.synthesizedCriticals ?? [];

  return (
    <DprPageShell
      pageNumber={pageNumber}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      <DprSection
        marker="§1b"
        eyebrow="Executive brief"
        title={scrub(cover.actionTitle, clientSafe)}
        strap="This page is the audit's conclusion in the reviewer's order of priority: the score, the capital exposure, the structural risks, and the questions the memo leaves unanswered. Every claim below is traceable to the evidence pages that follow."
      >
        {/* Verdict strip: DQI + grade + posture badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 18,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="dpr-display" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
              {Math.round(cover.dqi.score)}
            </span>
            <span style={{ fontSize: 15, opacity: 0.75 }}>
              DQI · grade {cover.dqi.grade} (scale: A ≥ 85 · B ≥ 70 · C ≥ 55 · D ≥ 40 · F &lt; 40)
            </span>
          </div>
        </div>

        {cover.blindAudit ? (
          <DprNotice mark="Blind audit">
            Live retrieval (news, market data, web search, price feeds) was disabled for this run.
            Every finding derives from the document&rsquo;s own language and pre-existing
            decision-science patterns — no post-dated information was retrievable during the audit.
          </DprNotice>
        ) : null}

        {cover.degradedNodes && cover.degradedNodes.length > 0 ? (
          <DprNotice mark="Partial coverage">
            One or more detector modules ({cover.degradedNodes.join(', ')}) were unavailable during
            this run due to a model-provider error. Their empty results reflect an outage, not a
            clean pass; findings from the other modules are unaffected.
          </DprNotice>
        ) : null}

        {/* Why you should care — the actuarial top-line. Honest framing:
            exposure the committee would carry UNCAUGHT, never "we saved you". */}
        {exposure ? (
          <div className="dpr-finding-block" style={{ marginTop: 12 }}>
            <div className="dpr-finding-block-label">
              <span className="dpr-finding-block-rule" />
              <span>Capital exposure this audit surfaces</span>
            </div>
            <p style={{ margin: 0 }}>
              <strong className="dpr-display" style={{ fontSize: 20 }}>
                ~
                {/* clientSafe: mask the reader's own deal/exposure $ — this is a
                    third-party-shareable export; the % + pattern stay (public). */}
                {scrub(
                  formatExposureLabel({
                    exposureAmount: exposure.exposureAmount,
                    ticketAmount: exposure.ticketAmount,
                    ticketCurrency: exposure.currency,
                    baseRateSource: exposure.baseRateSource,
                  }),
                  clientSafe
                )}
              </strong>{' '}
              of capital exposure the committee would otherwise carry, uncaught. On this{' '}
              {scrub(
                formatExposureLabel({
                  exposureAmount: exposure.ticketAmount,
                  ticketAmount: exposure.ticketAmount,
                  ticketCurrency: exposure.currency,
                  baseRateSource: exposure.baseRateSource,
                }),
                clientSafe
              )}{' '}
              decision, the <strong>{exposure.drivingLabel}</strong> pattern carries an ~
              {exposure.baseRatePct}% historical miss rate across comparable decisions (
              {exposure.baseRateSource}).
              {exposure.precedent ? (
                <>
                  {' '}
                  Precedent: <strong>{exposure.precedent.company}</strong> (
                  {exposure.precedent.year}) · {exposure.precedent.estimatedImpact}.
                </>
              ) : null}
            </p>
          </div>
        ) : null}

        {/* Structural fragility — the SECOND AXIS (2026-07-02). The DQI is risk
            density (how bold); this is whether a shock cascades or is absorbed —
            the discrimination a single score can't produce. */}
        {cover.structuralFragility ? (
          <StructuralFragilityBlock fragility={cover.structuralFragility} />
        ) : null}

        {/* SCQA — the one-glance narrative */}
        <div className="dpr-finding-block" style={{ marginTop: 12 }}>
          <div className="dpr-finding-block-label">
            <span className="dpr-finding-block-rule" />
            <span>Situation · Complication · Question · Answer</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
            <ScqaLabel>Situation</ScqaLabel>
            <span>{scrub(cover.situation, clientSafe)}</span>
            <ScqaLabel>Complication</ScqaLabel>
            <span>{scrub(cover.complication, clientSafe)}</span>
            <ScqaLabel>Question</ScqaLabel>
            <span>{cover.question}</span>
            <ScqaLabel>Answer</ScqaLabel>
            <span style={{ fontWeight: 700 }}>{scrub(cover.answer, clientSafe)}</span>
          </div>
        </div>
      </DprSection>

      {/* The structural risks — buyer question #1, killers first. Compact
          summary here; the full attack path with evidence renders in §5b. */}
      {structural.length > 0 ? (
        <DprSection
          marker="§1b.1"
          eyebrow="Structural risk"
          title="The conditions that could end this decision"
          strap="Ranked existential-first. These are properties of the deal's structure — concentration, valuation basis, governance, execution pressure — not of anyone's thinking. The full attack path with verbatim evidence is in §5b."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {structural.slice(0, 6).map(n => (
              <div key={n.id} style={{ breakInside: 'avoid' }}>
                <p style={{ margin: 0 }}>
                  <strong>{n.label}</strong>
                  <span style={{ opacity: 0.65, fontSize: '0.85em' }}>
                    {' '}
                    · {STRATEGIC_NODE_CLASS_LABEL[n.class]}
                  </span>
                  <br />
                  {scrub(n.amplifies, clientSafe)}
                </p>
              </div>
            ))}
          </div>
        </DprSection>
      ) : null}

      {/* ACH — the case the memo never argued against. The reasoning sibling
          of the structural risk above: §1b.1 tests the STRUCTURE, this tests
          the REASONING (is the argument load-bearing, or confirmation theater?). */}
      {ach ? (
        <DprSection
          marker="§1b.1a"
          eyebrow="Competing hypotheses"
          title="The case the memo never argued against"
          strap={`${Math.round(ach.nonDiagnosticShare * 100)}% of the memo's own supporting evidence is equally consistent with the failure case — it feels convincing without ruling out the opposite outcome. This is a process observation, universal to arguing from a thesis, never a verdict on it.`}
        >
          <p style={{ margin: '0 0 8px' }}>
            <strong>The bear case:</strong> {scrub(ach.competingHypothesis, clientSafe)}
          </p>
          {ach.missingDiagnosticTests.length > 0 ? (
            <>
              <p style={{ margin: '0 0 2px', fontWeight: 600 }}>
                The tests that would have settled it, and are absent:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {ach.missingDiagnosticTests.slice(0, 4).map((t, i) => (
                  <li key={i}>{scrub(t, clientSafe)}</li>
                ))}
              </ul>
            </>
          ) : null}
        </DprSection>
      ) : null}

      {/* How they materialize — the unanswered questions carrying the
          kill-shots, each anchored to the historical analog that had to
          answer it. */}
      {questions.length > 0 ? (
        <DprSection
          marker="§1b.2"
          eyebrow="How they materialize"
          title="The questions this memo leaves unanswered"
          strap="Each question below is one a comparable decision had to answer before its outcome arrived. An unanswered question is not a prediction of failure — it is the exact place a reviewer should demand an answer before commitment."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questions.slice(0, 5).map((q, i) => (
              <div key={i} className="dpr-finding-block" style={{ breakInside: 'avoid' }}>
                <div className="dpr-finding-block-label">
                  <span className="dpr-finding-block-rule" />
                  <span>
                    {q.severity.toUpperCase()}
                    {q.analogCompany ? ` · analog: ${q.analogCompany}` : ''}
                  </span>
                </div>
                <p style={{ margin: 0, fontWeight: 600 }}>{scrub(q.question, clientSafe)}</p>
                {q.whyItMatters ? (
                  <p style={{ margin: '2px 0 0', fontSize: '0.9em', opacity: 0.75 }}>
                    {scrub(q.whyItMatters, clientSafe)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </DprSection>
      ) : synthesized.length > 0 ? (
        <DprSection
          marker="§1b.2"
          eyebrow="How they materialize"
          title="Existential risks synthesized from the adversarial modules"
          strap="The bias lane surfaced no findings on this run; the severe findings below come from the stress-test and historical-analog modules and stand on their own evidence."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {synthesized.slice(0, 5).map((item, i) => (
              <div key={i} style={{ breakInside: 'avoid' }}>
                <p style={{ margin: 0 }}>
                  <strong>{item.severity.toUpperCase()}</strong>
                  <span style={{ opacity: 0.65, fontSize: '0.85em' }}> · {item.sourceLabel}</span>
                  <br />
                  {scrub(item.label, clientSafe)}
                </p>
              </div>
            ))}
          </div>
        </DprSection>
      ) : null}
    </DprPageShell>
  );
}

function ScqaLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: '0.72em',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        opacity: 0.6,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/**
 * Structural fragility — the SECOND AXIS on the DPR (2026-07-02). The DQI is
 * risk density (how bold); this is whether a shock cascades (fragile) or is
 * absorbed (resilient), crediting the staging / reserves / exits the engine
 * used to ignore, and naming the missing circuit-breakers. Honest boundary: the
 * structure (snowpack), never the trigger (snowflake). No $ or names → no scrub.
 */
function StructuralFragilityBlock({ fragility }: { fragility: StructuralFragility }) {
  const missing = fragility.missingResilience.slice(0, 4);
  return (
    <div className="dpr-finding-block" style={{ marginTop: 12 }}>
      <div className="dpr-finding-block-label">
        <span className="dpr-finding-block-rule" />
        <span>
          Structural fragility · {FRAGILITY_BAND_LABEL[fragility.band]} ({fragility.index}/100)
        </span>
      </div>
      <p style={{ margin: 0 }}>{fragility.headline}</p>
      <p style={{ margin: '4px 0 0', fontSize: '0.92em', opacity: 0.82 }}>
        The DQI measures risk density — how bold this bet is. This axis measures whether a shock
        would cascade or be absorbed. It reads the structure (the snowpack), not the trigger
        (execution or an exogenous shift no ex-ante audit can see).
      </p>
      {fragility.resilienceMarkers.length > 0 ? (
        <p style={{ margin: '5px 0 0', fontSize: '0.92em' }}>
          <strong>Absorbs shocks:</strong>{' '}
          {fragility.resilienceMarkers.map(m => m.label).join(' · ')}
        </p>
      ) : (
        <p style={{ margin: '5px 0 0', fontSize: '0.92em' }}>
          <strong>Absorbs shocks:</strong> None detected — the memo shows no shock-absorbing
          structure (no staging, kill-trigger, reserve, or disconfirmation loop). Confidence is not
          a circuit-breaker.
        </p>
      )}
      {missing.length > 0 ? (
        <p style={{ margin: '5px 0 0', fontSize: '0.92em' }}>
          <strong>Would make it survivable:</strong>{' '}
          {missing.map(d => RESILIENCE_DIMENSION_LABEL[d]).join(' · ')}
        </p>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * §1c — The room's verdict · and what to fix
 * ──────────────────────────────────────────────────────────────────── */

export function DprPageActionPlan({
  deliverable,
  pageNumber,
  totalPages,
  classification = 'confidential',
  auditTimestamp,
  footerTitle = 'Decision Provenance Record',
  clientSafe = false,
}: BriefPageChrome & { deliverable: AuditDeliverable }) {
  const stress = deliverable.stressTest;
  const cf = deliverable.counterfactuals;
  const boardroom = stress.objections.filter(o => o.kind === 'boardroom');
  const redTeam = stress.objections.filter(o => o.kind === 'red_team');
  const dissenters = boardroom.filter(o => o.vote === 'REJECT' || o.vote === 'REVISE');
  const inversion = cf.inversionFailureModes ?? [];

  return (
    <DprPageShell
      pageNumber={pageNumber}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      {/* The room's verdict — how a committee reacts before the real one does */}
      <DprSection
        marker="§1c"
        eyebrow="The room's verdict"
        title={scrub(stress.actionTitle, clientSafe)}
        strap="A simulated committee of role-primed reviewers plus an adversarial red team voted on this memo before any real committee sees it. Dissent here costs no political capital — and names exactly what the real room will attack."
      >
        <p style={{ margin: '0 0 10px' }}>
          <strong>
            {stress.counts.approve} approve · {stress.counts.revise} revise · {stress.counts.reject}{' '}
            reject
          </strong>
          {stress.overallVerdict ? <> — overall verdict: {stress.overallVerdict}</> : null}
          {stress.counts.redTeam > 0 ? (
            <> · {stress.counts.redTeam} red-team objection(s) alongside the vote</>
          ) : null}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dissenters.slice(0, 3).map((o, i) => (
            <div key={`b-${i}`} style={{ breakInside: 'avoid' }}>
              <p style={{ margin: 0 }}>
                <strong>
                  {scrub(o.persona, clientSafe)} ({scrub(o.role, clientSafe)}) — {o.vote}.
                </strong>{' '}
                {scrub(o.objection, clientSafe)}
              </p>
            </div>
          ))}
          {redTeam.slice(0, 2).map((o, i) => (
            <div key={`r-${i}`} style={{ breakInside: 'avoid' }}>
              <p style={{ margin: 0 }}>
                <strong>Red team.</strong> {scrub(o.objection, clientSafe)}
              </p>
            </div>
          ))}
        </div>
      </DprSection>

      {/* What to fix — the mitigation plan with the projected DQI lift */}
      {cf.scenarios.length > 0 ? (
        <DprSection
          marker="§1c.1"
          eyebrow="What to fix"
          title={`${cf.scenarios.length} mitigation${cf.scenarios.length === 1 ? '' : 's'} · DQI ${Math.round(cf.currentDqi)} today, ${Math.round(cf.bestCaseDqi)} with all applied`}
          strap="Ranked by severity. Each mitigation is a concrete step the deal team can take before commitment; the projected lift is a conservative per-severity heuristic, not a promise."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cf.scenarios.map((s, i) => (
              <div
                key={s.targetFindingId}
                className="dpr-finding-block"
                style={{ breakInside: 'avoid' }}
              >
                <div className="dpr-finding-block-label">
                  <span className="dpr-finding-block-rule" />
                  <span>
                    Fix #{i + 1} · +{Math.round(s.delta)} DQI
                  </span>
                </div>
                <p style={{ margin: 0, fontWeight: 600 }}>{scrub(s.targetLabel, clientSafe)}</p>
                {s.mitigation ? (
                  <p style={{ margin: '2px 0 0', fontSize: '0.92em' }}>
                    {scrub(s.mitigation, clientSafe)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </DprSection>
      ) : null}

      {/* Munger inversion — the actions that guarantee failure */}
      {inversion.length > 0 ? (
        <DprSection
          marker="§1c.2"
          eyebrow="Inversion"
          title="Actions that would guarantee failure"
          strap="Charlie Munger's inversion discipline: instead of asking how to succeed, list what would guarantee failure — then check the memo against the list."
        >
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
            {inversion.slice(0, 6).map((line, i) => (
              <li key={i}>{scrub(line, clientSafe)}</li>
            ))}
          </ol>
        </DprSection>
      ) : null}

      <DprNotice mark="What this record establishes — and what it deliberately doesn't">
        The findings above are reasoning-risk indicators correlated with poor outcomes across the
        audited reference class — not a claim of causation, and not a prediction that this decision
        fails. The value of the record is that every risk above was surfaced BEFORE commitment, with
        the evidence, the hardening questions, and the mitigations a reviewer needs to close them.
        The methodology, calibration, and per-finding evidence follow in the pages below.
      </DprNotice>
    </DprPageShell>
  );
}
