/**
 * Export API
 *
 * GET /api/export?analysisId=xxx&format=pdf|csv|json|markdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { Analysis, BiasInstance, AnalysisVersion, Document } from '@prisma/client';

type AnalysisWithRelations = Analysis & {
  document: Document;
  biases: BiasInstance[];
  versions?: AnalysisVersion[];
};

interface PreMortem {
  failureScenarios?: Array<{
    scenario: string;
    likelihood: string;
  }>;
  preventiveMeasures?: string[];
}

interface SwotAnalysis {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
}

const log = createLogger('Export');

type ExportFormat = 'pdf' | 'csv' | 'json' | 'markdown';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysisId');
    const format = (searchParams.get('format') || 'json') as ExportFormat;

    if (!analysisId) {
      return NextResponse.json({ error: 'Missing analysisId' }, { status: 400 });
    }

    // Fetch analysis with document and biases
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        document: true,
        biases: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 5, // Include last 5 versions for comparison
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Verify ownership
    if (analysis.document.userId !== user.id) {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id },
      });

      if (!membership || membership.orgId !== analysis.document.orgId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Generate export based on format
    switch (format) {
      case 'json':
        return exportAsJSON(analysis);
      case 'csv':
        return exportAsCSV(analysis);
      case 'markdown':
        return exportAsMarkdown(analysis);
      case 'pdf':
        return exportAsPDF(analysis);
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    log.error('Export failed:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

/**
 * Export analysis as JSON
 */
function exportAsJSON(analysis: AnalysisWithRelations): NextResponse {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: analysis.version,
      documentName: analysis.document.filename,
    },
    scores: {
      overall: analysis.overallScore,
      noise: analysis.noiseScore,
    },
    summary: analysis.summary,
    biases: analysis.biases.map((b: BiasInstance) => ({
      type: b.biasType,
      severity: b.severity,
      excerpt: b.excerpt,
      explanation: b.explanation,
      suggestion: b.suggestion,
      confidence: b.confidence,
    })),
    analysis: {
      factCheck: analysis.factCheck,
      compliance: analysis.compliance,
      sentiment: analysis.sentiment,
      swot: analysis.swotAnalysis,
      cognitive: analysis.cognitiveAnalysis,
      simulation: analysis.simulation,
      preMortem: analysis.preMortem,
    },
    versionHistory: analysis.versions?.map((v: AnalysisVersion) => ({
      version: v.version,
      date: v.createdAt,
      overallScore: v.overallScore,
      noiseScore: v.noiseScore,
    })),
  };

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="analysis-${analysis.id}.json"`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Export analysis as CSV
 */
function exportAsCSV(analysis: AnalysisWithRelations): NextResponse {
  const rows: string[] = [];

  // Headers
  rows.push('Category,Type,Severity,Description,Score');

  // Overall scores
  rows.push(`Overall Score,,,${analysis.summary},${analysis.overallScore}`);
  rows.push(`Noise Score,,,Consistency measure,${analysis.noiseScore}`);

  // Biases
  analysis.biases.forEach((bias: BiasInstance) => {
    const description = `"${bias.explanation.replace(/"/g, '""')}"`;
    rows.push(`Bias,${bias.biasType},${bias.severity},${description},${bias.confidence || 0}`);
  });

  // Additional metrics
  if (analysis.factCheck) {
    rows.push(`Fact Check,,,Verification score,${analysis.factCheck.score || 0}`);
  }

  if (analysis.sentiment) {
    rows.push(`Sentiment,${analysis.sentiment.label},,Overall sentiment,${analysis.sentiment.score || 0}`);
  }

  const csv = rows.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="analysis-${analysis.id}.csv"`,
      'Content-Type': 'text/csv',
    },
  });
}

/**
 * Export analysis as Markdown
 */
function exportAsMarkdown(analysis: AnalysisWithRelations): NextResponse {
  const lines: string[] = [];

  // Header
  lines.push(`# Decision Analysis Report`);
  lines.push(`## ${analysis.document.filename}`);
  lines.push(`*Generated on ${new Date().toLocaleDateString()}*`);
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push(analysis.summary);
  lines.push('');

  // Scores
  lines.push('## Quality Scores');
  lines.push(`- **Overall Decision Quality:** ${analysis.overallScore}/100`);
  lines.push(`- **Decision Consistency (Noise):** ${analysis.noiseScore}/100`);
  lines.push('');

  // Cognitive Biases
  if (analysis.biases.length > 0) {
    lines.push('## Detected Cognitive Biases');
    analysis.biases.forEach((bias: BiasInstance) => {
      lines.push(`### ${bias.biasType} (${bias.severity})`);
      if (bias.excerpt) {
        lines.push(`> "${bias.excerpt}"`);
      }
      lines.push(`**Analysis:** ${bias.explanation}`);
      lines.push(`**Recommendation:** ${bias.suggestion}`);
      lines.push('');
    });
  }

  // SWOT Analysis
  if (analysis.swotAnalysis) {
    lines.push('## SWOT Analysis');
    const swot = analysis.swotAnalysis as SwotAnalysis;

    if (swot.strengths?.length) {
      lines.push('### Strengths');
      swot.strengths.forEach((s: string) => lines.push(`- ${s}`));
    }

    if (swot.weaknesses?.length) {
      lines.push('### Weaknesses');
      swot.weaknesses.forEach((w: string) => lines.push(`- ${w}`));
    }

    if (swot.opportunities?.length) {
      lines.push('### Opportunities');
      swot.opportunities.forEach((o: string) => lines.push(`- ${o}`));
    }

    if (swot.threats?.length) {
      lines.push('### Threats');
      swot.threats.forEach((t: string) => lines.push(`- ${t}`));
    }
    lines.push('');
  }

  // Pre-mortem
  if (analysis.preMortem) {
    lines.push('## Pre-mortem Analysis');
    const preMortem = analysis.preMortem as PreMortem;

    if (preMortem.failureScenarios?.length) {
      lines.push('### Potential Failure Scenarios');
      preMortem.failureScenarios.forEach((scenario) => {
        lines.push(`- **${scenario.scenario}** (Likelihood: ${scenario.likelihood})`);
      });
    }
    lines.push('');
  }

  // Version History
  if (analysis.versions && analysis.versions.length > 0) {
    lines.push('## Version History');
    analysis.versions.forEach((v: AnalysisVersion) => {
      lines.push(`- **v${v.version}** (${new Date(v.createdAt).toLocaleDateString()}): Score ${v.overallScore}/100`);
    });
  }

  const markdown = lines.join('\n');

  return new NextResponse(markdown, {
    headers: {
      'Content-Disposition': `attachment; filename="analysis-${analysis.id}.md"`,
      'Content-Type': 'text/markdown',
    },
  });
}

/**
 * Export analysis as PDF (stub - would need PDF library)
 */
function exportAsPDF(_analysis: AnalysisWithRelations): NextResponse {
  // In production, you'd use a library like puppeteer or pdfkit
  // For now, return a message indicating PDF export is not yet implemented

  return NextResponse.json(
    {
      error: 'PDF export coming soon',
      message: 'PDF export functionality is under development. Please use JSON, CSV, or Markdown format for now.',
      alternativeFormats: ['json', 'csv', 'markdown'],
    },
    { status: 501 } // Not Implemented
  );
}