'use client';

import { useState, useCallback, useEffect } from 'react';
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
  ShieldCheck,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// Board-member share expiries (3.3). 24h is the default — the most common
// procurement-grade ask is a one-day window so the General Counsel / audit
// committee member can review the audit during the meeting prep block, then
// the link goes dead automatically.
type ExpiryChoice = '1h' | '24h' | '7d' | '30d' | 'never';
const EXPIRY_OPTIONS: Array<{ id: ExpiryChoice; label: string; hint: string }> = [
  { id: '1h', label: '1 hour', hint: 'Live read-along' },
  { id: '24h', label: '24 hours', hint: 'Board-member review' },
  { id: '7d', label: '7 days', hint: 'Default' },
  { id: '30d', label: '30 days', hint: 'Long-running deal' },
  { id: 'never', label: 'Never', hint: 'Public reference' },
];

function expiryToHours(choice: ExpiryChoice): number | null {
  switch (choice) {
    case '1h':
      return 1;
    case '24h':
      return 24;
    case '7d':
      return 168;
    case '30d':
      return 720;
    case 'never':
      return null;
  }
}
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
  /** Decision Provenance Record — hashed + tamper-evident 4-page
   *  artifact for the General Counsel / audit committee, mapped onto EU
   *  AI Act Art 14 record-keeping, SEC AI disclosure, and Basel III
   *  ICAAP. Bundled on every audit for the design-partner cohort.
   *  Vocabulary lock 2026-04-26 — see src/lib/constants/trust-copy.ts */
  onExportProvenanceRecord?: () => Promise<void>;
  /** Hallway Brief — single-page PDF handed to the CEO before the board
   *  meeting. Top recommendation, top 3 risks, one counterfactual,
   *  reviewer counter-signature. */
  onExportHallwayBrief?: () => Promise<void>;
  onExportCsv: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
}

type ActiveTab = 'export' | 'share' | 'manage';

interface ShareLinkRow {
  id: string;
  token: string;
  url: string;
  expiresAt: string | null;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  isCaseStudy: boolean;
  hasPassword: boolean;
  createdAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export function ShareModal({
  isOpen,
  onClose,
  documentName,
  analysisData,
  analysisId,
  onExportPdf,
  onExportBoardReport,
  onExportProvenanceRecord,
  onExportHallwayBrief,
  onExportCsv,
  onExportMarkdown,
  onExportJson,
}: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('export');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingBoard, setExportingBoard] = useState(false);
  const [exportingRecord, setExportingRecord] = useState(false);
  const [exportingBrief, setExportingBrief] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [caseStudyUrl, setCaseStudyUrl] = useState<string | null>(null);
  const [creatingCaseStudy, setCreatingCaseStudy] = useState(false);
  const [caseStudyCopied, setCaseStudyCopied] = useState(false);
  const [expiry, setExpiry] = useState<ExpiryChoice>('24h');
  const [requireRecipientEmail, setRequireRecipientEmail] = useState(false);
  const [manageLinks, setManageLinks] = useState<ShareLinkRow[] | null>(null);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
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

  const handleProvenanceRecordExport = useCallback(async () => {
    if (!onExportProvenanceRecord) return;
    setExportingRecord(true);
    try {
      await onExportProvenanceRecord();
    } catch {
      // Parent handler shows its own toast on failure — silent here per CLAUDE.md fire-and-forget exceptions.
    } finally {
      setExportingRecord(false);
    }
  }, [onExportProvenanceRecord]);

  const handleHallwayBriefExport = useCallback(async () => {
    if (!onExportHallwayBrief) return;
    setExportingBrief(true);
    try {
      await onExportHallwayBrief();
    } catch {
      // Parent handler shows its own toast on failure — silent here per CLAUDE.md fire-and-forget exceptions.
    } finally {
      setExportingBrief(false);
    }
  }, [onExportHallwayBrief]);

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
        body: JSON.stringify({
          analysisId,
          expiresInHours: expiryToHours(expiry),
          requireEmail: requireRecipientEmail,
        }),
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
  }, [analysisId, expiry, requireRecipientEmail, showToast]);

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

  const fetchManageLinks = useCallback(async () => {
    if (!analysisId) return;
    setLoadingLinks(true);
    try {
      const res = await fetch(`/api/share?analysisId=${analysisId}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setManageLinks(data.links ?? []);
      } else {
        setManageLinks([]);
      }
    } catch {
      setManageLinks([]);
    } finally {
      setLoadingLinks(false);
    }
  }, [analysisId]);

  useEffect(() => {
    if (activeTab === 'manage' && analysisId && manageLinks === null) {
      void fetchManageLinks();
    }
  }, [activeTab, analysisId, manageLinks, fetchManageLinks]);

  const handleRevokeLink = useCallback(
    async (id: string) => {
      setRevokingId(id);
      try {
        const res = await fetch(`/api/share?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Share link revoked.', 'success');
          await fetchManageLinks();
        } else {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || 'Revoke failed.', 'error');
        }
      } catch {
        showToast('Revoke failed.', 'error');
      } finally {
        setRevokingId(null);
      }
    },
    [fetchManageLinks, showToast]
  );

  const handleCopyManageUrl = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied!', 'success');
      } catch {
        showToast('Failed to copy.', 'error');
      }
    },
    [showToast]
  );

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
          {(['export', 'share', 'manage'] as const).map(tab => (
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
              {tab === 'export' ? 'Export' : tab === 'share' ? 'Quick Share' : 'Manage Links'}
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
              {onExportHallwayBrief && (
                <Button
                  variant="outline"
                  onClick={handleHallwayBriefExport}
                  disabled={exportingBrief}
                  className="h-auto flex-col gap-2 p-4"
                  style={{
                    gridColumn: '1 / -1',
                    borderColor: 'var(--accent-primary)',
                    background: 'rgba(22, 163, 74, 0.05)',
                  }}
                >
                  {exportingBrief ? (
                    <Loader2
                      size={24}
                      className="animate-spin"
                      style={{ color: 'var(--accent-primary)' }}
                    />
                  ) : (
                    <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Hallway Brief</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    One page, signed — top recommendation, top 3 risks, one counterfactual. For the
                    90-second CEO hand-off.
                  </span>
                </Button>
              )}
              {onExportProvenanceRecord && (
                <Button
                  variant="outline"
                  onClick={handleProvenanceRecordExport}
                  disabled={exportingRecord}
                  className="h-auto flex-col gap-2 p-4"
                  style={{
                    gridColumn: '1 / -1',
                    borderColor: 'var(--accent-primary)',
                    background: 'rgba(22, 163, 74, 0.04)',
                  }}
                >
                  {exportingRecord ? (
                    <Loader2
                      size={24}
                      className="animate-spin"
                      style={{ color: 'var(--accent-primary)' }}
                    />
                  ) : (
                    <ShieldCheck size={24} style={{ color: 'var(--accent-primary)' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    Decision Provenance Record
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Signed + hashed record for your GC — fingerprints, model lineage, citations,
                    regulatory mapping (EU AI Act Art 14, SEC, Basel III)
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
              {/* Expiry selector — applies to the shareable link below. The
                  case-study link below ignores this and stays no-expiry. */}
              {analysisId && !shareUrl && (
                <div
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={11} />
                    Expires in
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {EXPIRY_OPTIONS.map(opt => {
                      const active = opt.id === expiry;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setExpiry(opt.id)}
                          aria-pressed={active}
                          style={{
                            padding: '5px 10px',
                            fontSize: 11,
                            fontWeight: active ? 700 : 500,
                            color: active ? 'white' : 'var(--text-secondary)',
                            background: active ? 'var(--accent-primary)' : 'transparent',
                            border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            borderRadius: 999,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 8,
                    }}
                  >
                    {EXPIRY_OPTIONS.find(o => o.id === expiry)?.hint}
                    {expiry === 'never' && ' — link stays live until you revoke it. Use sparingly.'}
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      marginTop: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={requireRecipientEmail}
                      onChange={e => setRequireRecipientEmail(e.target.checked)}
                      style={{
                        marginTop: 2,
                        accentColor: 'var(--accent-primary)',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      Require recipient email
                      <span
                        style={{
                          display: 'block',
                          fontSize: 10.5,
                          color: 'var(--text-muted)',
                          marginTop: 1,
                        }}
                      >
                        Viewer must enter an email before the analysis loads. Captured on the access
                        log.
                      </span>
                    </span>
                  </label>
                </div>
              )}

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
                          : `Generates a public read-only link${
                              expiry === 'never'
                                ? ' (no expiry — revoke manually)'
                                : ` (${EXPIRY_OPTIONS.find(o => o.id === expiry)?.label} expiry)`
                            }`}
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

          {/* Manage Links Tab (3.3 deep) */}
          {activeTab === 'manage' && analysisId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {loadingLinks
                    ? 'Loading…'
                    : `${manageLinks?.length ?? 0} link${(manageLinks?.length ?? 0) === 1 ? '' : 's'} for this analysis`}
                </span>
                <button
                  onClick={() => void fetchManageLinks()}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                  }}
                  aria-label="Refresh"
                >
                  <RefreshCw size={11} />
                  Refresh
                </button>
              </div>

              {!loadingLinks && (manageLinks?.length ?? 0) === 0 && (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  No share links yet. Use the Quick Share tab to create one.
                </div>
              )}

              {(manageLinks ?? []).map(link => {
                const statusColour =
                  link.status === 'active'
                    ? '#16A34A'
                    : link.status === 'expired'
                      ? '#D97706'
                      : '#7F1D1D';
                const statusLabel =
                  link.status === 'active'
                    ? link.expiresAt
                      ? `expires ${new Date(link.expiresAt).toLocaleString()}`
                      : 'no expiry'
                    : link.status === 'expired'
                      ? `expired ${link.expiresAt ? new Date(link.expiresAt).toLocaleString() : ''}`
                      : `revoked ${link.revokedAt ? new Date(link.revokedAt).toLocaleString() : ''}`;
                return (
                  <div
                    key={link.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderLeft: `3px solid ${statusColour}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      background: 'var(--bg-card)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: statusColour,
                        }}
                      >
                        {link.status === 'active' ? <Clock size={11} /> : <AlertCircle size={11} />}
                        {link.status} · {statusLabel}
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span title={`${link.viewCount} view${link.viewCount === 1 ? '' : 's'}`}>
                          <Eye size={11} style={{ verticalAlign: -2, marginRight: 2 }} />
                          {link.viewCount}
                        </span>
                        {link.isCaseStudy && (
                          <span
                            style={{
                              padding: '1px 6px',
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 999,
                              background: 'rgba(22,163,74,0.10)',
                              color: '#16A34A',
                            }}
                          >
                            CASE
                          </span>
                        )}
                        {link.hasPassword && (
                          <span
                            style={{
                              padding: '1px 6px',
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 999,
                              background: 'rgba(124,58,237,0.10)',
                              color: '#7C3AED',
                            }}
                          >
                            PWD
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        wordBreak: 'break-all',
                        marginBottom: 8,
                      }}
                    >
                      {link.url}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => void handleCopyManageUrl(link.url)}
                        className="btn btn-outline btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                        }}
                      >
                        <Copy size={11} /> Copy
                      </button>
                      {link.status === 'active' && (
                        <button
                          onClick={() => void handleRevokeLink(link.id)}
                          disabled={revokingId === link.id}
                          className="btn btn-outline btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            color: '#DC2626',
                            borderColor: 'rgba(220,38,38,0.3)',
                          }}
                        >
                          {revokingId === link.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Trash2 size={11} />
                          )}
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'manage' && !analysisId && (
            <div
              style={{
                padding: 16,
                fontSize: 12.5,
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              No analysis bound to this modal. Manage links is available once an audit completes.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
