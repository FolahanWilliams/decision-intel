import { ReportAnalysisData } from './pdf-generator';

export class CsvGenerator {
    public generateReport(filename: string, analysis: ReportAnalysisData) {
        // Headers
        const headers = [
            'Document',
            'Decision Score',
            'Noise Score',
            'Summary',
            'Bias Type',
            'Severity',
            'Excerpt',
            'Explanation',
            'Recommendation'
        ];

        // Rows
        const rows: string[] = [];

        if (analysis.biases.length === 0) {
            // Add one row with general stats if no biases
            rows.push(this.formatRow([
                filename,
                analysis.overallScore,
                analysis.noiseScore,
                analysis.summary,
                'None',
                'N/A',
                'N/A',
                'N/A',
                'N/A'
            ]));
        } else {
            // Add one row per bias found
            analysis.biases.forEach(bias => {
                rows.push(this.formatRow([
                    filename,
                    analysis.overallScore,
                    analysis.noiseScore,
                    analysis.summary,
                    bias.biasType,
                    bias.severity,
                    bias.excerpt,
                    bias.explanation,
                    bias.suggestion
                ]));
            });
        }

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows
        ].join('\n');

        // Download
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
