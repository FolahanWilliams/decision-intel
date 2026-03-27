'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AttributionWaterfall } from './AttributionWaterfall';
import { BiasInteractionMap } from './BiasInteractionMap';
import { ContextFactorImpact } from './ContextFactorImpact';
import { CounterfactualScenarios } from './CounterfactualScenarios';
import { BiologicalSignals } from './BiologicalSignals';
import { EvidenceTrail } from './EvidenceTrail';
import { HistoricalComparison } from './HistoricalComparison';

interface ExplainabilityData {
  analysisId: string;
  overallScore: number;
  noiseScore: number;
  biases: Array<{
    type: string;
    severity: string;
    confidence: number | null;
    excerpt: string | null;
    explanation: string | null;
    suggestion: string | null;
  }>;
  dqi: {
    score: number;
    grade: string;
    gradeLabel: string;
    color: string;
    components: {
      biasLoad: { name: string; score: number; weight: number; weighted: number; grade: string; detail: string };
      noiseLevel: { name: string; score: number; weight: number; weighted: number; grade: string; detail: string };
      evidenceQuality: { name: string; score: number; weight: number; weighted: number; grade: string; detail: string };
      processMaturity: { name: string; score: number; weight: number; weighted: number; grade: string; detail: string };
      complianceRisk: { name: string; score: number; weight: number; weighted: number; grade: string; detail: string };
    };
    topImprovement: { component: string; currentScore: number; potentialGain: number; suggestion: string };
    system1Ratio: number | null;
  };
  compoundScoring: {
    adjustments?: Array<{ source: string; description: string; delta: number }>;
    calibratedScore?: number;
    rawScore?: number;
    biasScores?: Array<{
      biasType: string;
      rawSeverity: number;
      compoundSeverity: number;
      interactionMultiplier: number;
      contextMultiplier: number;
      contributingInteractions: string[];
    }>;
  } | null;
  waterfall: Array<{ label: string; value: number; cumulative: number }>;
  counterfactuals: {
    scenarios: Array<{
      biasRemoved: string;
      historicalSampleSize: number;
      successRateWithBias: number;
      successRateWithoutBias: number;
      expectedImprovement: number;
      confidence: number;
      estimatedMonetaryImpact: number | null;
      currency: string;
    }>;
    aggregateImprovement: number;
    weightedImprovement: number;
  };
  rootCauses: Array<{
    biasType: string;
    contributionScore: number;
    evidence: string;
    causalStrength: number;
    severity: string;
  }>;
  biasInteractions: Array<{
    from: string;
    to: string;
    weight: number;
    direction: string;
    confidence: string;
    mechanism?: string;
    citation?: string;
  }>;
  biologicalSignals: Array<{
    type: 'winner_effect' | 'cortisol';
    detected: boolean;
    indicators: string[];
    delta: number;
  }>;
  orgBaseline: {
    avgScore: number;
    biasFrequency: number;
    noiseAvg: number;
    totalDecisions: number;
  };
  toxicCombinations: Array<{
    id: string;
    patternLabel: string;
    biasTypes: string[];
    toxicScore: number;
    mitigationNotes: string | null;
  }>;
}

export function ExplainabilityDashboard({ analysisId }: { analysisId: string }) {
  const [data, setData] = useState<ExplainabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/explainability/${analysisId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [analysisId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading explainability data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', fontSize: '14px' }}>{error || 'No data available'}</p>
      </div>
    );
  }

  const hasCompoundAdjustments = (data.compoundScoring?.adjustments?.length ?? 0) > 0;
  const hasBiasInteractions = data.biasInteractions.length > 0;
  const hasBiologicalSignals = data.biologicalSignals.some(s => s.detected);
  const hasCounterfactuals = data.counterfactuals.scenarios.length > 0;

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Link
          href={`/dashboard`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '13px',
            textDecoration: 'none',
            marginBottom: '12px',
          }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Score Explainability
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: data.dqi.color + '18',
              border: `1px solid ${data.dqi.color}40`,
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 700, color: data.dqi.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.round(data.overallScore)}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: data.dqi.color }}>
              {data.dqi.grade}
            </span>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
          {data.dqi.gradeLabel} &middot; {data.biases.length} biases detected &middot; DQI {Math.round(data.dqi.score)}/100
        </p>
      </div>

      {/* Grid layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        {/* Attribution Waterfall — full width */}
        {hasCompoundAdjustments && (
          <Section title="Attribution Waterfall" description="How each factor adjusted the final score">
            <AttributionWaterfall waterfall={data.waterfall} />
          </Section>
        )}

        {/* Two column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {/* DQI Components */}
          <Section title="Quality Dimensions" description="Five pillars of decision quality">
            <DQIComponentBreakdown components={data.dqi.components} topImprovement={data.dqi.topImprovement} />
          </Section>

          {/* Historical Comparison */}
          {data.orgBaseline.totalDecisions > 1 && (
            <Section title="vs Organization Baseline" description={`Compared to ${data.orgBaseline.totalDecisions} org decisions`}>
              <HistoricalComparison
                currentScore={data.overallScore}
                currentNoise={data.noiseScore}
                currentBiasCount={data.biases.length}
                orgBaseline={data.orgBaseline}
              />
            </Section>
          )}
        </div>

        {/* Bias Interaction Map — full width */}
        {hasBiasInteractions && (
          <Section title="Bias Interaction Map" description="How detected biases amplify or dampen each other">
            <BiasInteractionMap interactions={data.biasInteractions} biases={data.biases} />
          </Section>
        )}

        {/* Context and Biological signals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {hasCompoundAdjustments && (
            <Section title="Context Factor Impact" description="How decision context influenced the score">
              <ContextFactorImpact adjustments={data.compoundScoring?.adjustments || []} />
            </Section>
          )}

          {hasBiologicalSignals && (
            <Section title="Biological Signals" description="Physiological patterns detected in language">
              <BiologicalSignals signals={data.biologicalSignals} />
            </Section>
          )}
        </div>

        {/* Counterfactuals */}
        {hasCounterfactuals && (
          <Section title="Counterfactual Scenarios" description="What if these biases were removed?">
            <CounterfactualScenarios counterfactuals={data.counterfactuals} />
          </Section>
        )}

        {/* Evidence Trail — full width */}
        {data.biases.length > 0 && (
          <Section title="Evidence Trail" description="Linking each bias to source text and research">
            <EvidenceTrail biases={data.biases} rootCauses={data.rootCauses} />
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--liquid-tint)',
        border: '1px solid var(--liquid-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        backdropFilter: 'blur(var(--liquid-blur)) saturate(140%)',
        WebkitBackdropFilter: 'blur(var(--liquid-blur)) saturate(140%)',
      }}
    >
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h2>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>{description}</p>
      {children}
    </div>
  );
}

function DQIComponentBreakdown({
  components,
  topImprovement,
}: {
  components: ExplainabilityData['dqi']['components'];
  topImprovement: ExplainabilityData['dqi']['topImprovement'];
}) {
  const items = [
    components.biasLoad,
    components.noiseLevel,
    components.evidenceQuality,
    components.processMaturity,
    components.complianceRisk,
  ];

  const gradeColor = (grade: string) => {
    const map: Record<string, string> = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' };
    return map[grade] || '#888';
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(item => (
          <div key={item.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: gradeColor(item.grade), fontFamily: "'JetBrains Mono', monospace" }}>
                  {Math.round(item.score)}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: gradeColor(item.grade),
                    background: gradeColor(item.grade) + '18',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {item.grade}
                </span>
              </div>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${item.score}%`,
                  background: gradeColor(item.grade),
                  borderRadius: '3px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Weight: {Math.round(item.weight * 100)}% &middot; {item.detail}
            </p>
          </div>
        ))}
      </div>

      {topImprovement.potentialGain > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            background: 'rgba(34, 197, 94, 0.06)',
            border: '1px solid rgba(34, 197, 94, 0.15)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, marginBottom: '2px' }}>
            Top Improvement: {topImprovement.component}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            +{Math.round(topImprovement.potentialGain)} points possible. {topImprovement.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}
