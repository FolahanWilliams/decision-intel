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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';

// Extend jsPDF interface to avoid TS errors
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => void;
  lastAutoTable: { finalY: number };
}

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
  if (
    analysis.factCheck &&
    typeof analysis.factCheck === 'object' &&
    'score' in analysis.factCheck
  ) {
    rows.push(
      `Fact Check,,,Verification score,${(analysis.factCheck as { score?: number }).score || 0}`
    );
  }

  if (
    analysis.sentiment &&
    typeof analysis.sentiment === 'object' &&
    'label' in analysis.sentiment &&
    'score' in analysis.sentiment
  ) {
    const sentiment = analysis.sentiment as { label?: string; score?: number };
    rows.push(
      `Sentiment,${sentiment.label || 'Unknown'},,Overall sentiment,${sentiment.score || 0}`
    );
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
      preMortem.failureScenarios.forEach(scenario => {
        lines.push(`- **${scenario.scenario}** (Likelihood: ${scenario.likelihood})`);
      });
    }
    lines.push('');
  }

  // Version History
  if (analysis.versions && analysis.versions.length > 0) {
    lines.push('## Version History');
    analysis.versions.forEach((v: AnalysisVersion) => {
      lines.push(
        `- **v${v.version}** (${new Date(v.createdAt).toLocaleDateString()}): Score ${v.overallScore}/100`
      );
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
 * Export analysis as PDF
 */
function exportAsPDF(analysis: AnalysisWithRelations): NextResponse {
  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    let yPos = 20;
    const margin = 14;

    // Header
    doc.setFontSize(22);
    doc.text('Decision Analysis Report', margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.text(`Document: ${analysis.document.filename}`, margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPos);
    doc.setTextColor(0);
    yPos += 15;

    // Executive Summary
    doc.setFontSize(16);
    doc.text('Executive Summary', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(analysis.summary, 180);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 6 + 10;

    // Quality Scores Table
    doc.setFontSize(16);
    doc.text('Quality Scores', margin, yPos);
    yPos += 5;

    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Score']],
      body: [
        ['Overall Decision Quality', `${analysis.overallScore}/100`],
        ['Decision Consistency (Noise)', `${analysis.noiseScore}/100`],
      ],
      theme: 'grid',
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // Cognitive Biases
    if (analysis.biases.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('Detected Cognitive Biases', margin, yPos);
      yPos += 5;

      const biasData = analysis.biases.map((bias: BiasInstance) => [
        bias.biasType,
        bias.severity,
        bias.explanation,
        bias.suggestion,
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Type', 'Severity', 'Analysis', 'Recommendation']],
        body: biasData,
        theme: 'striped',
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 65 },
          3: { cellWidth: 65 },
        },
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // SWOT Analysis
    if (analysis.swotAnalysis) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('SWOT Analysis', margin, yPos);
      yPos += 5;

      const swot = analysis.swotAnalysis as SwotAnalysis;
      const swotData = [
        ['Strengths', swot.strengths?.join('\n') || 'None identified'],
        ['Weaknesses', swot.weaknesses?.join('\n') || 'None identified'],
        ['Opportunities', swot.opportunities?.join('\n') || 'None identified'],
        ['Threats', swot.threats?.join('\n') || 'None identified'],
      ];

      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Details']],
        body: swotData,
        theme: 'grid',
        styles: { fontSize: 10 },
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // Pre-mortem
    if (analysis.preMortem) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      const preMortem = analysis.preMortem as PreMortem;
      if (preMortem.failureScenarios?.length) {
        doc.setFontSize(16);
        doc.text('Pre-mortem Analysis', margin, yPos);
        yPos += 5;

        const pmData = preMortem.failureScenarios.map(s => [s.scenario, s.likelihood]);

        doc.autoTable({
          startY: yPos,
          head: [['Failure Scenario', 'Likelihood']],
          body: pmData,
          theme: 'grid',
        });
      }
    }

    // Convert PDF to ArrayBuffer
    const pdfOutput = doc.output('arraybuffer');

    return new NextResponse(pdfOutput, {
      headers: {
        'Content-Disposition': `attachment; filename="analysis-${analysis.id}.pdf"`,
        'Content-Type': 'application/pdf',
        'Content-Length': pdfOutput.byteLength.toString(),
      },
    });
  } catch (error) {
    log.error('PDF generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate PDF document' }, { status: 500 });
  }
}
