import jsPDF from 'jspdf';
import {
  SPINE_STEPS,
  MARKET_DIMENSIONS,
  PITCH_SLIDES,
  REHEARSAL_PROMPTS,
  STATUS_LABEL,
} from '@/lib/data/positioning-copilot';

const PAGE_MARGIN = 14;
const LINE_GAP = 4.8;

function truncate(text: string, max: number): string {
  if (!text) return '';
  const clean = text.trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

export function generatePositioningCheatsheet(): void {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  // Header band
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Positioning Cheat Sheet', PAGE_MARGIN, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    pageWidth - PAGE_MARGIN,
    11,
    { align: 'right' }
  );
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Open before every outreach call. Say the answers out loud.', PAGE_MARGIN, 15.5);
  y = 24;

  doc.setTextColor(20, 20, 20);

  // One-liners block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('THE SIX ONE-LINERS', PAGE_MARGIN, y);
  y += 4;
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  REHEARSAL_PROMPTS.forEach(p => {
    const text = p.replace(/^\s*/, '');
    const lines = doc.splitTextToSize(`• ${text}`, contentWidth);
    lines.forEach((line: string) => {
      if (y > pageHeight - 20) return;
      doc.text(line, PAGE_MARGIN, y);
      y += LINE_GAP;
    });
    y += 1;
  });
  y += 2;

  // Sharp spine snapshot
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BRAND SPINE — WHERE YOU ARE', PAGE_MARGIN, y);
  y += 4;
  doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
  y += 4;

  SPINE_STEPS.forEach(step => {
    if (y > pageHeight - 20) return;
    const color: [number, number, number] =
      step.status === 'strong' ? [22, 163, 74] : step.status === 'partial' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(...color);
    doc.circle(PAGE_MARGIN + 1.5, y - 1.2, 1.3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text(`${step.step}. ${step.title}`, PAGE_MARGIN + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    const statusLabel = STATUS_LABEL[step.status];
    doc.text(`(${statusLabel})`, PAGE_MARGIN + 5 + doc.getTextWidth(`${step.step}. ${step.title} `), y);
    y += 3.5;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    const answer = doc.splitTextToSize(truncate(step.answer, 200), contentWidth - 5);
    answer.forEach((line: string) => {
      if (y > pageHeight - 20) return;
      doc.text(line, PAGE_MARGIN + 5, y);
      y += LINE_GAP;
    });
    y += 1.5;
  });

  // Opener + ask — bottom right band
  if (y < pageHeight - 40) {
    y = Math.max(y + 3, pageHeight - 40);
  } else {
    doc.addPage();
    y = PAGE_MARGIN;
  }
  doc.setFillColor(245, 247, 244);
  doc.rect(PAGE_MARGIN, y, contentWidth, 34, 'F');
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.8);
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN, y + 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.text('OPENER', PAGE_MARGIN + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const hook = PITCH_SLIDES.find(s => s.title === 'Hook');
  if (hook) {
    const openerLines = doc.splitTextToSize(hook.decisionIntelAnswer, contentWidth - 8);
    openerLines.forEach((line: string, i: number) => {
      doc.text(line, PAGE_MARGIN + 4, y + 11 + i * LINE_GAP);
    });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.text('ASK', PAGE_MARGIN + 4, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  const nextStep = PITCH_SLIDES.find(s => s.title === 'Next Step');
  if (nextStep) {
    const askLines = doc.splitTextToSize(nextStep.decisionIntelAnswer, contentWidth - 8);
    askLines.forEach((line: string, i: number) => {
      doc.text(line, PAGE_MARGIN + 4, y + 30 + i * LINE_GAP);
    });
  }

  // Market thesis strip on page 2 if we have time
  doc.addPage();
  y = PAGE_MARGIN;
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Market Thesis — Why This Is Worth Entering', PAGE_MARGIN, 8);
  y = 18;

  doc.setTextColor(20, 20, 20);
  MARKET_DIMENSIONS.forEach(dim => {
    if (y > pageHeight - 20) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(dim.title, PAGE_MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(`confidence ${dim.confidence}%`, pageWidth - PAGE_MARGIN, y, { align: 'right' });
    y += 4.5;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8.5);
    const answer = doc.splitTextToSize(dim.answer, contentWidth);
    answer.forEach((line: string) => {
      if (y > pageHeight - 20) return;
      doc.text(line, PAGE_MARGIN, y);
      y += LINE_GAP;
    });
    y += 3;
  });

  doc.save(`positioning-cheatsheet-${new Date().toISOString().slice(0, 10)}.pdf`);
}
