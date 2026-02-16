
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RiskSummary {
    totalDocuments: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    averageScore: number;
    criticalBiases: number;
}

interface DocumentWithRisk {
    id: string;
    filename: string;
    status: string;
    uploadedAt: string;
    analyses: {
        overallScore: number;
        noiseScore: number;
        biases: { severity: string, biasType: string }[];
        factCheck?: { score: number };
    }[];
}

export class AggregatePdfGenerator {
    private doc: jsPDF;
    private secondaryColor: [number, number, number] = [30, 41, 59]; // Slate-800

    constructor() {
        this.doc = new jsPDF();
    }

    public generateRiskReport(documents: DocumentWithRisk[], summary: RiskSummary) {
        this.addHeader();
        this.addReportMetadata();

        let yPos = 120;
        yPos = this.addExecutiveSummary(summary, yPos);

        this.addRiskDistribution(summary, yPos);

        this.doc.addPage();
        this.addPageHeader("High Risk Documents");

        const highRiskDocs = documents.filter(d =>
            d.analyses[0] && d.analyses[0].overallScore < 40
        );

        if (highRiskDocs.length > 0) {
            this.addHighRiskTable(highRiskDocs);
        } else {
            this.doc.text("No high risk documents detected.", 20, 50);
        }

        this.addBiasAnalysis(documents);

        this.addFooter();
        this.doc.save(`risk-audit-portfolio-${new Date().toISOString().split('T')[0]}.pdf`);
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
        this.doc.text('PORTFOLIO RISK AUDIT', 150, 25);
    }

    private addPageHeader(title: string) {
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
        this.doc.text(title.toUpperCase(), 20, 30);
        this.doc.setDrawColor(220, 220, 220);
        this.doc.line(20, 35, 190, 35);
    }

    private addReportMetadata() {
        this.doc.setDrawColor(200, 200, 200);
        this.doc.setFillColor(250, 250, 250);
        this.doc.roundedRect(15, 50, 180, 50, 2, 2, 'FD');

        this.doc.setTextColor(50, 50, 50);
        this.doc.setFontSize(12);
        this.doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 25, 65);
        this.doc.text(`Audit ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 120, 65);
    }

    private addExecutiveSummary(summary: RiskSummary, startY: number): number {
        this.doc.setFontSize(14);
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('EXECUTIVE SUMMARY', 20, startY);

        // KPI Cards
        const cardY = startY + 15;

        // Avg Score
        this.drawScoreCard('Portfolio DQ Score', `${summary.averageScore}/100`, 20, cardY,
            summary.averageScore >= 70 ? [22, 163, 74] : summary.averageScore >= 40 ? [234, 179, 8] : [220, 38, 38]);

        // Total Docs
        this.drawScoreCard('Documents Audited', `${summary.totalDocuments}`, 80, cardY, [30, 41, 59]);

        // Critical Biases
        this.drawScoreCard('Critical Risks', `${summary.highRiskCount}`, 140, cardY, [220, 38, 38]);

        return cardY + 50;
    }

    private drawScoreCard(label: string, value: string, x: number, y: number, color: number[] = [30, 41, 59]) {
        this.doc.setFillColor(color[0], color[1], color[2]);
        this.doc.roundedRect(x, y, 50, 30, 2, 2, 'F');

        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(9);
        this.doc.text(label.toUpperCase(), x + 25, y + 10, { align: 'center' });

        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(value, x + 25, y + 22, { align: 'center' });
    }

    private addRiskDistribution(summary: RiskSummary, startY: number) {
        this.doc.setFontSize(12);
        this.doc.setTextColor(50, 50, 50);
        this.doc.text('Risk Distribution Profile:', 20, startY);

        const total = summary.totalDocuments || 1;
        const lowPct = Math.round((summary.lowRiskCount / total) * 100);
        const medPct = Math.round((summary.mediumRiskCount / total) * 100);
        const highPct = Math.round((summary.highRiskCount / total) * 100);

        // Simple bar visualization
        const x = 20;
        const width = 170;
        const height = 15;
        const y = startY + 10;

        if (lowPct > 0) {
            this.doc.setFillColor(22, 163, 74); // Green
            this.doc.rect(x, y, (lowPct / 100) * width, height, 'F');
        }
        if (medPct > 0) {
            this.doc.setFillColor(234, 179, 8); // Yellow
            this.doc.rect(x + ((lowPct / 100) * width), y, (medPct / 100) * width, height, 'F');
        }
        if (highPct > 0) {
            this.doc.setFillColor(220, 38, 38); // Red
            this.doc.rect(x + (((lowPct + medPct) / 100) * width), y, (highPct / 100) * width, height, 'F');
        }

        // Legend
        this.doc.setFontSize(9);
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(`Low Risk: ${lowPct}%`, 20, y + 25);
        this.doc.text(`Medium Risk: ${medPct}%`, 80, y + 25);
        this.doc.text(`High Risk: ${highPct}%`, 140, y + 25);
    }

    private addHighRiskTable(docs: DocumentWithRisk[]) {
        const tableData = docs.map(d => [
            d.filename,
            d.analyses[0]?.overallScore || 'N/A',
            d.analyses[0]?.biases.length || 0,
            new Date(d.uploadedAt).toLocaleDateString()
        ]);

        autoTable(this.doc, {
            startY: 50,
            head: [['FILENAME', 'DQ SCORE', 'BIASES', 'DATE']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38] },
            columnStyles: {
                0: { cellWidth: 80, fontStyle: 'bold' },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 30, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' }
            }
        });
    }

    private addBiasAnalysis(docs: DocumentWithRisk[]) {
        // Aggregate biases
        const biasCounts: Record<string, number> = {};
        docs.forEach(d => {
            d.analyses[0]?.biases.forEach(b => {
                biasCounts[b.biasType] = (biasCounts[b.biasType] || 0) + 1;
            });
        });

        // Convert to array and sort
        const sortedBiases = Object.entries(biasCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10); // Top 10

        // Check if we need a new page
        const docWithTable = this.doc as jsPDF & { lastAutoTable?: { finalY: number } };
        let startY = docWithTable.lastAutoTable ? docWithTable.lastAutoTable.finalY + 30 : 150;

        if (startY > 220) {
            this.doc.addPage();
            startY = 40;
        }

        this.doc.setFontSize(14);
        this.doc.setTextColor(30, 41, 59);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Top Systemic Biases', 20, startY);

        const tableData = sortedBiases.map(([type, count]) => [type, count]);

        autoTable(this.doc, {
            startY: startY + 10,
            head: [['BIAS PATTERN', 'FREQUENCY']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 40, halign: 'center' }
            }
        });
    }

    private addFooter() {
        const pageCount = this.doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setDrawColor(200, 200, 200);
            this.doc.line(20, 280, 190, 280);
            this.doc.setFontSize(8);
            this.doc.setTextColor(150, 150, 150);
            this.doc.text(`Generated by Decision Intel Platform - Page ${i} of ${pageCount}`, 105, 288, { align: 'center' });
        }
    }
}
