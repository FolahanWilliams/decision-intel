import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define types locally to match the structure we pass from the page
export interface ReportBiasInstance {
    biasType: string;
    severity: string;
    explanation: string;
    excerpt: string;
    suggestion: string;
}

export interface Verification {
    claim: string;
    verdict: 'VERIFIED' | 'CONTRADICTED' | 'UNVERIFIABLE';
    explanation: string;
}

export interface FactCheckData {
    score: number;
    verifications?: Verification[];
    searchSources?: string[];
    primaryCompany?: { ticker: string; name: string };
}

export interface ReportAnalysisData {
    overallScore: number;
    noiseScore: number;
    summary: string;
    biases: ReportBiasInstance[];
    factCheck?: FactCheckData;
    createdAt?: string;
}

interface ReportData {
    filename: string;
    analysis: ReportAnalysisData;
}

export class PdfGenerator {
    private doc: jsPDF;
    private secondaryColor: [number, number, number] = [30, 41, 59]; // Slate-800

    constructor() {
        this.doc = new jsPDF();
    }

    public generateReport(data: ReportData) {
        this.addHeader();
        this.addDocumentInfo(data.filename, data.analysis);

        let yPos = 140;
        yPos = this.addExecutiveSummary(data.analysis.summary, yPos);

        // Add new sections
        if (data.analysis.factCheck) {
            this.doc.addPage();
            yPos = 40; // Reset for new page
            this.addPageHeader("Financial Fact Check");
            yPos = this.addFactCheckTable(data.analysis.factCheck, yPos);
            yPos = this.addSourcesAppendix(data.analysis.factCheck.searchSources, yPos);
        }

        // Bias Table
        this.doc.addPage();
        this.addPageHeader("Cognitive Bias Audit");
        this.addBiasTable(data.analysis.biases);

        this.addFooter();

        this.doc.save(`decision-audit-${data.filename.split('.')[0]}.pdf`);
    }

    private addHeader() {
        // Corporate Header Bar
        this.doc.setFillColor(5, 5, 5); // Pitch Black
        this.doc.rect(0, 0, 210, 40, 'F');

        // Logo / Title area
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(24);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('DECISION INTEL', 20, 25);

        // Subtitle
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(150, 150, 150);
        this.doc.text('ENTERPRISE AUDIT REPORT', 140, 25);
    }

    private addPageHeader(title: string) {
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
        this.doc.text(title.toUpperCase(), 20, 30);
        this.doc.setDrawColor(220, 220, 220);
        this.doc.line(20, 35, 190, 35);
    }

    private addDocumentInfo(filename: string, analysis: ReportAnalysisData) {
        let yPos = 60;

        // Metadata Box
        this.doc.setDrawColor(200, 200, 200);
        this.doc.setFillColor(250, 250, 250);
        this.doc.roundedRect(15, 50, 180, 70, 2, 2, 'FD');

        // Filename
        this.doc.setTextColor(50, 50, 50);
        this.doc.setFontSize(12);
        this.doc.text(`Filename: ${filename}`, 25, 65);
        this.doc.text(`Audit Date: ${new Date().toLocaleDateString()}`, 120, 65);

        // KPI Cards Row
        const cardY = 80;
        this.drawScoreCard('Trust Score', `${analysis.factCheck?.score || 0}%`, 25, cardY, [240, 253, 244], [22, 163, 74]); // Green
        this.drawScoreCard('Decision Quality', `${analysis.overallScore}/100`, 80, cardY, [30, 41, 59], [255, 255, 255]); // Dark
        this.drawScoreCard('Biases Detected', `${analysis.biases?.length || 0}`, 135, cardY, [254, 242, 242], [225, 29, 72]); // Red
    }

    private drawScoreCard(label: string, value: string, x: number, y: number, bgColor: number[], textColor: number[]) {
        this.doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        this.doc.roundedRect(x, y, 45, 30, 3, 3, 'F');

        this.doc.setFontSize(9);
        this.doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        if (textColor[0] === 255) this.doc.setTextColor(200, 200, 200); // Muted text on dark bg
        else this.doc.setTextColor(100, 100, 100);

        this.doc.text(label.toUpperCase(), x + 22.5, y + 10, { align: 'center' });

        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        this.doc.text(value, x + 22.5, y + 22, { align: 'center' });
    }

    private addExecutiveSummary(summary: string, startY: number): number {
        this.doc.setFontSize(14);
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('EXECUTIVE SUMMARY', 20, startY);

        this.doc.setFontSize(11);
        this.doc.setTextColor(50, 50, 50);
        this.doc.setFont('helvetica', 'normal');

        const splitText = this.doc.splitTextToSize(summary, 170);
        this.doc.text(splitText, 20, startY + 10);

        return startY + 10 + (splitText.length * 6) + 20;
    }

    private addFactCheckTable(data: FactCheckData, startY: number): number {
        if (!data.verifications || data.verifications.length === 0) {
            this.doc.setFontSize(10);
            this.doc.text("No specific financial claims identified for verification.", 20, startY + 10);
            return startY + 20;
        }

        const tableData = data.verifications.map(v => [
            v.verdict,
            v.claim,
            v.explanation
        ]);

        autoTable(this.doc, {
            startY: startY + 5,
            head: [['VERDICT', 'CLAIM', 'EVIDENCE']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: this.secondaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 25 }, // Verdict
                1: { cellWidth: 60 }, // Claim
                2: { cellWidth: 'auto' } // Evidence
            },
            styles: { fontSize: 9, cellPadding: 4 },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 0) {
                    const verdict = data.cell.raw as string;
                    if (verdict === 'VERIFIED') data.cell.styles.textColor = [22, 163, 74];
                    if (verdict === 'CONTRADICTED') data.cell.styles.textColor = [220, 38, 38];
                }
            }
        });

        // @ts-ignore
        return this.doc.lastAutoTable.finalY + 20;
    }

    private addSourcesAppendix(sources: string[] | undefined, startY: number): number {
        if (!sources || sources.length === 0) return startY;

        this.doc.setFontSize(12);
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('VERIFIED SOURCES (Grounding)', 20, startY);

        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 102, 204); // Link Blue

        let currentY = startY + 10;
        sources.forEach((source, index) => {
            if (currentY > 270) {
                this.doc.addPage();
                currentY = 40;
            }
            const cleanUrl = source.length > 90 ? source.substring(0, 87) + '...' : source;
            this.doc.text(`[${index + 1}] ${cleanUrl}`, 20, currentY);
            // Link annotation could be added here if needed, but text is usually fine for print
            // this.doc.link(20, currentY - 3, 170, 5, { url: source });
            currentY += 6;
        });

        return currentY + 20;
    }

    private addBiasTable(biases: ReportBiasInstance[]) {
        if (!biases || biases.length === 0) {
            this.doc.text("No biases detected.", 20, 50);
            return;
        }

        const tableData = biases.map(bias => [
            bias.biasType,
            bias.severity.toUpperCase(),
            bias.excerpt,
            bias.explanation
        ]);

        autoTable(this.doc, {
            startY: 50,
            head: [['BIAS TYPE', 'SEVERITY', 'EXCERPT', 'ANALYSIS']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [220, 38, 38], // Red for Risk
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                1: { cellWidth: 25 },
                2: { cellWidth: 50, fontStyle: 'italic' },
                3: { cellWidth: 'auto' }
            },
            styles: { fontSize: 9, cellPadding: 3 },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    const severity = data.cell.raw as string;
                    if (severity === 'CRITICAL') data.cell.styles.fillColor = [254, 226, 226];
                }
            }
        });
    }

    private addFooter() {
        const pageCount = this.doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);

            // Footer Line
            this.doc.setDrawColor(200, 200, 200);
            this.doc.line(20, 280, 190, 280);

            this.doc.setFontSize(8);
            this.doc.setTextColor(150, 150, 150);
            this.doc.text(
                `CONFIDENTIAL - Generated by Decision Intel Platform - Page ${i} of ${pageCount}`,
                105,
                288,
                { align: 'center' }
            );
        }
    }
}
