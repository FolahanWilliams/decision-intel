import { formatBiasName } from '@/lib/utils/labels';

interface JsonReportData {
  filename: string;
  uploadedAt: string;
  overallScore: number;
  noiseScore: number;
  summary: string;
  biases?: Array<{
    biasType: string;
    severity: string;
    excerpt: string;
    explanation: string;
    suggestion: string;
  }>;
  factCheck?: {
    score: number;
    verifications?: Array<{
      claim: string;
      verdict: string;
      explanation: string;
    }>;
  };
  compliance?: {
    status: string;
    riskScore: number;
    summary: string;
  };
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    strategicAdvice: string;
  };
  simulation?: {
    overallVerdict: string;
    twins?: Array<{
      name: string;
      role: string;
      vote: string;
      confidence: number;
      rationale: string;
    }>;
  };
  noiseStats?: { mean: number; stdDev: number; variance: number };
  logicalAnalysis?: {
    score: number;
    fallacies?: Array<{ name: string; severity: string; explanation: string }>;
  };
}

/**
 * Generate a clean JSON report from analysis data.
 */
export function generateJsonReport(data: JsonReportData): string {
  const report = {
    metadata: {
      filename: data.filename,
      generatedAt: new Date().toISOString(),
      uploadedAt: data.uploadedAt,
      generator: 'Decision Intel',
    },
    scores: {
      overallQuality: Math.round(data.overallScore),
      noiseScore: Math.round(data.noiseScore),
      factCheckScore: data.factCheck?.score,
      logicScore: data.logicalAnalysis?.score,
      complianceRiskScore: data.compliance?.riskScore,
    },
    summary: data.summary,
    biases: data.biases?.map(b => ({
      type: b.biasType,
      label: formatBiasName(b.biasType),
      severity: b.severity,
      excerpt: b.excerpt,
      explanation: b.explanation,
      recommendation: b.suggestion,
    })),
    factCheck: data.factCheck
      ? {
          score: data.factCheck.score,
          verifications: data.factCheck.verifications?.map(v => ({
            claim: v.claim,
            verdict: v.verdict,
            explanation: v.explanation,
          })),
        }
      : undefined,
    swotAnalysis: data.swotAnalysis,
    boardroomSimulation: data.simulation
      ? {
          verdict: data.simulation.overallVerdict,
          personas: data.simulation.twins?.map(t => ({
            name: t.name,
            role: t.role,
            vote: t.vote,
            confidence: t.confidence,
            rationale: t.rationale,
          })),
        }
      : undefined,
    logicalAnalysis: data.logicalAnalysis
      ? {
          score: data.logicalAnalysis.score,
          fallacies: data.logicalAnalysis.fallacies,
        }
      : undefined,
    noiseStatistics: data.noiseStats,
    compliance: data.compliance
      ? {
          status: data.compliance.status,
          riskScore: data.compliance.riskScore,
          summary: data.compliance.summary,
        }
      : undefined,
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Download JSON as a .json file.
 */
export function downloadJson(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `decision-audit-${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
