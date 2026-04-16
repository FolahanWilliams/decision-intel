'use client';

import { useState, useCallback } from 'react';
import {
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  Copy,
  Check,
  Link2,
  Mail,
  Loader2,
  BookOpen,
  Presentation,
} from 'lucide-react';
import { useToast } from '@/components/ui/EnhancedToast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  analysisData: Record<string, unknown>;
  analysisId?: string;
  onExportPdf: () => Promise<void>;
  onExportBoardReport?: () => Promise<void>;
  onExportCsv: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
}

type ActiveTab = 'export' | 'share';

export function ShareModal({
  isOpen,
  onClose,
  documentName,
  analysisData,
  analysisId,
  onExportPdf,
  onExportBoardReport,
  onExportCsv,
  onExportMarkdown,
  onExportJson,
}: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('export');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingBoard, setExportingBoard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [caseStudyUrl, setCaseStudyUrl] = useState<string | null>(null);
  const [creatingCaseStudy, setCreatingCaseStudy] = useState(false);
  const [caseStudyCopied, setCaseStudyCopied] = useState(false);
  const { showToast } = useToast();

  const handlePdfExport = useCallback(async () => {
    setExportingPdf(true);
    try {
      await onExportPdf();
      showToast('PDF exported', 'success');
    } catch {
      showToast('PDF export failed', 'error');
    } finally {
      setExportingPdf(false);
    }
  }, [onExportPdf, showToast]);

  const handleBoardExport = useCallback(async () => {
    if (!onExportBoardReport) return;
    setExportingBoard(true);
    try {
      await onExportBoardReport();
      showToast('Board report exported', 'success');
    } catch {
      showToast('Board report export failed', 'error');
    } finally {
      setExportingBoard(false);
    }
  }, [onExportBoardReport, showToast]);

  const handleCopySummary = useCallback(async () => {
    try {
      const summary = (analysisData.summary as string) || 'No summary available';
      const text = `Decision Audit: ${documentName}\nScore: ${Math.round(analysisData.overallScore as number)}/100\n\n${summary}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Summary copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  }, [analysisData, documentName, showToast]);

  const handleCreateShareLink = useCallback(async () => {
    if (!analysisId) return;
    setCreatingLink(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, expiresInDays: 7 }),
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || `${window.location.origin}/shared/${data.token}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
        showToast('Share link created and copied!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create share link', 'error');
      }
    } catch {
      showToast('Failed to create share link', 'error');
    } finally {
      setCreatingLink(false);
    }
  }, [analysisId, showToast]);

  const handleCreateCaseStudyLink = useCallback(async () => {
    if (!analysisId) return;
    setCreatingCaseStudy(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, isCaseStudy: true }),
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || `${window.location.origin}/shared/${data.token}?case=true`;
        setCaseStudyUrl(url);
        await navigator.clipboard.writeText(url);
        setCaseStudyCopied(true);
        setTimeout(() => setCaseStudyCopied(false), 3000);
        showToast('Case study link created and copied!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create case study link', 'error');
      }
    } catch {
      showToast('Failed to create case study link', 'error');
    } finally {
      setCreatingCaseStudy(false);
    }
  }, [analysisId, showToast]);

  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(`Decision Audit: ${documentName}`);
    const score = Math.round(analysisData.overallScore as number);
    const summary = (analysisData.summary as string) || '';
    const body = encodeURIComponent(
      `Decision Intel Audit Report\n\nDocument: ${documentName}\nDecision Quality Score: ${score}/100\n\n${summary}\n\n---\nGenerated by Decision Intel`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  }, [analysisData, documentName]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="card liquid-glass-premium w-full sm:max-w-md"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle style={{ fontSize: '15px', fontWeight: 600 }}>Share & Export</DialogTitle>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{documentName}</p>
        </DialogHeader>

        {/* Tabs */}
        <div
          className="flex"
          style={{
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {(['export', 'share'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom:
                  activeTab === tab ? '2px solid var(--text-highlight)' : '2px solid transparent',
                background: 'transparent',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                cursor: 'pointer',
              }}
            >
              {tab === 'export' ? 'Export' : 'Quick Share'}
            </button>
          ))}
        </div>

        <div>
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {onExportBoardReport && (
                <Button
                  variant="outline"
                  onClick={handleBoardExport}
                  disabled={exportingBoard}
                  className="h-auto flex-col gap-2 p-4"
                  style={{
                    gridColumn: '1 / -1',
                    borderColor: 'var(--accent-primary)',
                    background: 'rgba(22, 163, 74, 0.06)',
                  }}
                >
                  {exportingBoard ? (
                    <Loader2
                      size={24}
                      className="animate-spin"
                      style={{ color: 'var(--accent-primary)' }}
                    />
                  ) : (
                    <Presentation size={24} style={{ color: 'var(--accent-primary)' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Board-Ready Report</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    2-page executive summary — DQI, top risks, CEO question, mitigation
                  </span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handlePdfExport}
                disabled={exportingPdf}
                className="h-auto flex-col gap-2 p-4"
              >
                {exportingPdf ? (
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--error)' }} />
                ) : (
                  <FileText size={24} style={{ color: 'var(--error)' }} />
                )}
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Full PDF Report</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Every section, every bias
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  onExportCsv();
                  showToast('CSV exported', 'success');
                }}
                className="h-auto flex-col gap-2 p-4"
              >
                <FileSpreadsheet size={24} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>CSV Data</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Spreadsheet format
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  onExportMarkdown();
                  showToast('Markdown exported', 'success');
                }}
                className="h-auto flex-col gap-2 p-4"
              >
                <Download size={24} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Markdown</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Documentation format
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  onExportJson();
                  showToast('JSON exported', 'success');
                }}
                className="h-auto flex-col gap-2 p-4"
              >
                <FileJson size={24} style={{ color: 'var(--warning)' }} />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>JSON</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Structured data
                </span>
              </Button>
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Shareable Link */}
              {analysisId && (
                <div>
                  <Button
                    variant="outline"
                    onClick={
                      shareUrl
                        ? async () => {
                            await navigator.clipboard.writeText(shareUrl);
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2000);
                            showToast('Link copied!', 'success');
                          }
                        : handleCreateShareLink
                    }
                    disabled={creatingLink}
                    className="h-auto w-full justify-start gap-3 p-3 text-left"
                    style={{
                      background: shareUrl ? 'rgba(255, 255, 255, 0.06)' : undefined,
                      borderColor: shareUrl ? 'rgba(255, 255, 255, 0.15)' : undefined,
                    }}
                  >
                    {creatingLink ? (
                      <Loader2
                        size={18}
                        className="animate-spin shrink-0"
                        style={{ color: 'var(--text-secondary)' }}
                      />
                    ) : linkCopied ? (
                      <Check size={18} className="shrink-0" style={{ color: 'var(--success)' }} />
                    ) : (
                      <Link2
                        size={18}
                        className="shrink-0"
                        style={{ color: 'var(--text-secondary)' }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>
                        {shareUrl
                          ? linkCopied
                            ? 'Link copied!'
                            : 'Copy share link'
                          : 'Create shareable link'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {shareUrl
                          ? 'Anyone with this link can view the analysis'
                          : 'Generates a public read-only link (7 day expiry)'}
                      </div>
                    </div>
                  </Button>
                  {shareUrl && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        padding: '6px 16px',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                      }}
                    >
                      {shareUrl}
                    </div>
                  )}
                </div>
              )}

              {/* Case Study Link */}
              {analysisId && (
                <div>
                  <Button
                    variant="outline"
                    onClick={
                      caseStudyUrl
                        ? async () => {
                            await navigator.clipboard.writeText(caseStudyUrl);
                            setCaseStudyCopied(true);
                            setTimeout(() => setCaseStudyCopied(false), 2000);
                            showToast('Case study link copied!', 'success');
                          }
                        : handleCreateCaseStudyLink
                    }
                    disabled={creatingCaseStudy}
                    className="h-auto w-full justify-start gap-3 p-3 text-left"
                    style={{
                      background: caseStudyUrl ? 'rgba(22, 163, 74, 0.08)' : undefined,
                      borderColor: caseStudyUrl ? 'rgba(22, 163, 74, 0.25)' : undefined,
                    }}
                  >
                    {creatingCaseStudy ? (
                      <Loader2
                        size={18}
                        className="animate-spin shrink-0"
                        style={{ color: 'var(--text-secondary)' }}
                      />
                    ) : caseStudyCopied ? (
                      <Check size={18} className="shrink-0" style={{ color: 'var(--success)' }} />
                    ) : (
                      <BookOpen size={18} className="shrink-0" style={{ color: '#16A34A' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>
                        {caseStudyUrl
                          ? caseStudyCopied
                            ? 'Case study link copied!'
                            : 'Copy case study link'
                          : 'Share as Case Study'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {caseStudyUrl
                          ? 'Anonymized, never expires, all sections unlocked'
                          : 'Anonymized link with all sections visible (no expiry)'}
                      </div>
                    </div>
                  </Button>
                  {caseStudyUrl && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        padding: '6px 16px',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                      }}
                    >
                      {caseStudyUrl}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleCopySummary}
                className="h-auto w-full justify-start gap-3 p-3 text-left"
              >
                {copied ? (
                  <Check size={18} className="shrink-0" style={{ color: 'var(--success)' }} />
                ) : (
                  <Copy size={18} className="shrink-0" style={{ color: 'var(--text-secondary)' }} />
                )}
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>Copy summary to clipboard</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Score + executive summary as plain text
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  onExportMarkdown();
                  showToast('Copied Markdown to clipboard', 'success');
                }}
                className="h-auto w-full justify-start gap-3 p-3 text-left"
              >
                <Link2 size={18} className="shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>Export as Markdown</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Full report in Markdown format
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={handleEmailShare}
                className="h-auto w-full justify-start gap-3 p-3 text-left"
              >
                <Mail size={18} className="shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>Send via email</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Opens your email client with summary
                  </div>
                </div>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
