import { ReportAnalysisData } from './pdf-generator';

export class CsvGenerator {
    public generateReport(filename: string, analysis: ReportAnalysisData) {
        const sections: string[] = [];

        // --- Section 1: Summary ---
        sections.push('=== DECISION AUDIT SUMMARY ===');
        sections.push(this.formatRow(['Document', 'Decision Score', 'Noise Score', 'Summary', 'Date']));
        sections.push(this.formatRow([
            filename,
            analysis.overallScore,
            analysis.noiseScore,
            analysis.summary,
            analysis.createdAt || ''
        ]));
        sections.push('');

        // --- Section 2: Cognitive Biases ---
        sections.push('=== COGNITIVE BIASES ===');
        sections.push(this.formatRow(['Bias Type', 'Severity', 'Excerpt', 'Explanation', 'Recommendation']));
        if (analysis.biases.length === 0) {
            sections.push(this.formatRow(['None detected', '', '', '', '']));
        } else {
            for (const bias of analysis.biases) {
                sections.push(this.formatRow([
                    bias.biasType,
                    bias.severity,
                    bias.excerpt,
                    bias.explanation,
                    bias.suggestion
                ]));
            }
        }
        sections.push('');

        // --- Section 3: Fact Check ---
        if (analysis.factCheck) {
            sections.push('=== FACT CHECK ===');
            sections.push(this.formatRow(['Score', 'Claim', 'Verdict', 'Explanation', 'Source']));
            if (analysis.factCheck.verifications && analysis.factCheck.verifications.length > 0) {
                for (const v of analysis.factCheck.verifications) {
                    sections.push(this.formatRow([
                        analysis.factCheck.score,
                        v.claim || '',
                        v.verdict || '',
                        v.explanation || '',
                        (v as unknown as { sourceUrl?: string }).sourceUrl || ''
                    ]));
                }
            } else {
                sections.push(this.formatRow([analysis.factCheck.score, 'No claims verified', '', '', '']));
            }
            sections.push('');
        }

        // --- Section 4: Compliance ---
        if (analysis.compliance) {
            sections.push('=== COMPLIANCE ===');
            sections.push(this.formatRow(['Status', 'Risk Score', 'Summary']));
            sections.push(this.formatRow([
                analysis.compliance.status,
                analysis.compliance.riskScore,
                analysis.compliance.summary
            ]));
            if (analysis.compliance.regulations && analysis.compliance.regulations.length > 0) {
                sections.push(this.formatRow(['Regulation', 'Status', 'Description', 'Risk Level']));
                for (const r of analysis.compliance.regulations) {
                    const reg = r as Record<string, string>;
                    sections.push(this.formatRow([
                        reg.name || '',
                        reg.status || '',
                        reg.description || '',
                        reg.riskLevel || ''
                    ]));
                }
            }
            sections.push('');
        }

        // --- Section 5: SWOT ---
        if (analysis.swotAnalysis) {
            sections.push('=== SWOT ANALYSIS ===');
            const swot = analysis.swotAnalysis;
            sections.push(this.formatRow(['Category', 'Items']));
            sections.push(this.formatRow(['Strengths', (swot.strengths || []).join('; ')]));
            sections.push(this.formatRow(['Weaknesses', (swot.weaknesses || []).join('; ')]));
            sections.push(this.formatRow(['Opportunities', (swot.opportunities || []).join('; ')]));
            sections.push(this.formatRow(['Threats', (swot.threats || []).join('; ')]));
            if (swot.strategicAdvice) {
                sections.push(this.formatRow(['Strategic Advice', swot.strategicAdvice]));
            }
            sections.push('');
        }

        // --- Section 6: Logical Analysis ---
        if (analysis.logicalAnalysis) {
            sections.push('=== LOGICAL ANALYSIS ===');
            sections.push(this.formatRow(['Logic Score', analysis.logicalAnalysis.score]));
            if (analysis.logicalAnalysis.fallacies && analysis.logicalAnalysis.fallacies.length > 0) {
                sections.push(this.formatRow(['Fallacy', 'Type', 'Severity', 'Excerpt', 'Explanation']));
                for (const f of analysis.logicalAnalysis.fallacies) {
                    sections.push(this.formatRow([
                        f.name || '',
                        f.type || '',
                        f.severity || '',
                        f.excerpt || '',
                        f.explanation || ''
                    ]));
                }
            }
            sections.push('');
        }

        // --- Section 7: Boardroom Simulation ---
        if (analysis.simulation) {
            sections.push('=== BOARDROOM SIMULATION ===');
            sections.push(this.formatRow(['Overall Verdict', analysis.simulation.overallVerdict]));
            sections.push(this.formatRow(['Persona', 'Role', 'Vote', 'Confidence', 'Rationale', 'Key Risk']));
            for (const twin of analysis.simulation.twins || []) {
                sections.push(this.formatRow([
                    twin.name || '',
                    twin.role || '',
                    twin.vote || '',
                    twin.confidence || '',
                    twin.rationale || '',
                    (twin as unknown as { keyRiskIdentified?: string }).keyRiskIdentified || ''
                ]));
            }
            sections.push('');
        }

        // --- Section 8: Noise Stats ---
        if (analysis.noiseStats) {
            sections.push('=== NOISE ANALYSIS ===');
            sections.push(this.formatRow(['Mean', 'Std Dev', 'Variance']));
            sections.push(this.formatRow([
                analysis.noiseStats.mean,
                analysis.noiseStats.stdDev,
                analysis.noiseStats.variance
            ]));
            sections.push('');
        }

        const csvContent = sections.join('\n');
        this.downloadCsv(filename, csvContent);
    }

    private formatRow(values: (string | number)[]): string {
        return values.map(val => {
            const stringVal = String(val);
            // Escape quotes and wrap in quotes if contains comma or newline
            if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        }).join(',');
    }

    private downloadCsv(filename: string, content: string) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `decision-audit-${filename.split('.')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
