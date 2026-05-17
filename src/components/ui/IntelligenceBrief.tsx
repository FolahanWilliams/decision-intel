'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { formatBiasName } from '@/lib/utils/labels';

interface CausalWeight {
  biasType: string;
  dangerMultiplier: number;
  sampleSize: number;
  confidence: number;
}

interface IntelligenceData {
  profile: {
    avgDecisionQuality: number;
    avgNoiseScore: number;
    totalDecisions: number;
    topBiases: Array<{ biasType: string; count: number; avgSeverity: string }> | null;
    nudgeEffectiveness: { sent: number; acknowledged: number; helpfulRate: number } | null;
  } | null;
  causalWeights: CausalWeight[];
  maturityScore: {
    score: number;
    grade: string;
    breakdown: Record<string, number>;
  } | null;
}

type BriefContext =
  | 'documents'
  | 'deals'
  | 'nudges'
  | 'effectiveness'
  | 'meetings'
  | 'rooms'
  | 'playbooks'
  | 'journal'
  | 'analytics'
  | 'outcomes';

interface BriefMetrics {
  pendingOutcomes?: number;
  loopClosureRate?: number;
}

// Inline CSS-var colours, NOT Tailwind text-*-400 classes. The platform
// is light-theme only; those utilities wash out / clip against the light
// card (the exact drift the EnhancedEmptyState redesign fixed for the
// sibling primitive — see that file's header). 2026-05-17 fix.
const CONTEXT_ICONS: Record<BriefContext, React.ReactNode> = {
  documents: <Target size={16} style={{ color: 'var(--info)' }} />,
  deals: <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />,
  nudges: <Zap size={16} style={{ color: 'var(--accent-secondary)' }} />,
  effectiveness: <TrendingUp size={16} style={{ color: 'var(--success)' }} />,
  meetings: <Target size={16} style={{ color: 'var(--info)' }} />,
  rooms: <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />,
  playbooks: <Zap size={16} style={{ color: 'var(--accent-secondary)' }} />,
  journal: <TrendingUp size={16} style={{ color: 'var(--success)' }} />,
  analytics: <TrendingUp size={16} style={{ color: 'var(--info)' }} />,
  outcomes: <TrendingUp size={16} style={{ color: 'var(--success)' }} />,
};

function getContextualTip(
  context: BriefContext,
  data: IntelligenceData,
  metrics?: BriefMetrics
): string {
  const topBias = data.causalWeights[0];
  const biasName = topBias ? formatBiasName(topBias.biasType) : null;
  const dangerX = topBias ? topBias.dangerMultiplier.toFixed(1) : null;

  switch (context) {
    case 'documents':
      if (biasName && dangerX) {
        return `Focus your next analysis on ${biasName} — it correlates with ${dangerX}x higher failure rate in your organization.`;
      }
      return "Upload documents to start building your organization's decision intelligence profile.";

    case 'deals':
      if (biasName && dangerX) {
        return `Projects affected by ${biasName} have ${dangerX}x higher failure rate. Watch for this bias in new initiatives.`;
      }
      return 'Create projects to track decision quality across your pipeline.';

    case 'nudges': {
      const eff = data.profile?.nudgeEffectiveness;
      if (eff && eff.sent > 0) {
        const ackPct = Math.round((eff.acknowledged / eff.sent) * 100);
        return `${ackPct}% of nudges acknowledged, ${Math.round(eff.helpfulRate * 100)}% marked helpful. Submit more decisions to receive targeted coaching.`;
      }
      return 'Nudges detect cognitive biases in real-time and coach better decisions. Submit decisions to start receiving them.';
    }

    case 'effectiveness': {
      const maturity = data.maturityScore;
      if (maturity) {
        const outcomesNeeded = maturity.score >= 80 ? 0 : Math.ceil((80 - maturity.score) * 2);
        if (outcomesNeeded > 0) {
          return `Your team is at ${maturity.grade} level (${maturity.score}/100). Track ${outcomesNeeded} more outcomes to reach Gold calibration.`;
        }
        return `Your team is at ${maturity.grade} level (${maturity.score}/100). Keep tracking outcomes to maintain calibration accuracy.`;
      }
      return "Track decision outcomes to build your team's calibration profile and measure improvement over time.";
    }

    case 'meetings':
      return 'Record your next IC meeting to detect biases in real-time deliberation. Upload audio or video files for automatic transcription and analysis.';

    case 'rooms':
      if (biasName) {
        return `Decision rooms use blind priors to prevent ${biasName} from influencing group consensus. Create one from any completed analysis.`;
      }
      return 'Decision rooms enable structured decision-making with blind prior voting and dissent tracking.';

    case 'playbooks':
      return 'Playbooks are step-by-step debiasing guides for common decision patterns. They activate automatically when toxic combinations are detected.';

    case 'journal': {
      const quality = data.profile?.avgDecisionQuality;
      const logged = data.profile?.totalDecisions ?? 0;
      if (quality && quality > 0 && logged >= 5) {
        const calibrationLabel =
          quality >= 80 ? 'well-calibrated' : quality >= 60 ? 'improving' : 'under-calibrated';
        return `Your calibration is ${Math.round(quality)}/100 across ${logged} logged decisions — ${calibrationLabel}. Convert pending journal entries into full audits to tighten the signal.`;
      }
      return 'Your decision journal captures decisions from email, Slack, and calendar automatically. Connect integrations in Settings to start logging.';
    }

    case 'analytics':
      if (biasName && dangerX) {
        return `Your most dangerous bias is ${biasName} (${dangerX}x failure rate). Upload more documents to refine this signal.`;
      }
      return 'Analytics will populate as you analyze documents and track outcomes. Start with your first upload.';

    case 'outcomes': {
      const pending = metrics?.pendingOutcomes ?? 0;
      const closure = metrics?.loopClosureRate;
      if (pending > 0) {
        const closurePct = closure != null ? ` Loop closure: ${Math.round(closure * 100)}%.` : '';
        return `${pending} decision${pending === 1 ? '' : 's'} awaiting outcome reports. Each one you close recalibrates the DQI signal for the bias${pending === 1 ? '' : 'es'} involved.${closurePct}`;
      }
      if (closure != null) {
        return `Loop closure at ${Math.round(closure * 100)}%. Keep reporting outcomes — calibration compounds quarter after quarter.`;
      }
      return 'Report outcomes on your analyzed decisions to start the recalibration flywheel.';
    }
  }
}

interface IntelligenceBriefProps {
  context: BriefContext;
  metrics?: BriefMetrics;
}

export function IntelligenceBrief({ context, metrics }: IntelligenceBriefProps) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/team/intelligence')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!cancelled && json) setData(json);
      })
      .catch(err => console.warn('[IntelligenceBrief] team/intelligence fetch failed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          marginTop: 16,
          height: 72,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      />
    );
  }

  // No data or no org — don't render
  if (!data || (!data.profile && data.causalWeights.length === 0 && !data.maturityScore)) {
    return null;
  }

  const tip = getContextualTip(context, data, metrics);
  const topBiases = data.causalWeights.slice(0, 3);
  const profile = data.profile;
  const maturity = data.maturityScore;

  const statItem = (label: React.ReactNode) => (
    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{label}</div>
  );
  const strong = (v: React.ReactNode) => (
    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span>
  );

  return (
    <div
      style={{
        marginTop: 16,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        padding: 14,
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {CONTEXT_ICONS[context]}
        <span
          style={{
            fontSize: 'var(--fs-2xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
          }}
        >
          Intelligence Brief
        </span>
      </div>

      {/* Contextual tip */}
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 10px',
          lineHeight: 1.55,
        }}
      >
        {tip}
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {profile && profile.totalDecisions > 0 && statItem(<>{strong(profile.totalDecisions)} decisions tracked</>)}
        {profile &&
          profile.avgDecisionQuality > 0 &&
          statItem(<>Avg quality: {strong(`${Math.round(profile.avgDecisionQuality)}/100`)}</>)}
        {maturity &&
          statItem(<>Maturity: {strong(`${maturity.grade} (${maturity.score}/100)`)}</>)}
      </div>

      {/* Top risk biases */}
      {topBiases.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--fs-2xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Top Risk Biases
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topBiases.map(b => (
              <span
                key={b.biasType}
                style={{
                  fontSize: 'var(--fs-2xs)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                  color: 'var(--error)',
                  border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
                }}
              >
                {formatBiasName(b.biasType)}{' '}
                <span style={{ opacity: 0.7 }}>{b.dangerMultiplier.toFixed(1)}x</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
