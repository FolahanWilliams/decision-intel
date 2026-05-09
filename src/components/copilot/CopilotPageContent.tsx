'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Sparkles,
  Clock,
  Trash2,
  Loader2,
  ArrowUp,
  Brain,
  CheckCircle2,
  Menu,
  Pin,
  FileText,
  X,
} from 'lucide-react';
import { CopilotChat } from '@/components/copilot/CopilotChat';
import { ResolveDecisionModal } from '@/components/copilot/ResolveDecisionModal';
import { useCopilotStream } from '@/hooks/useCopilotStream';
import { useDocuments } from '@/hooks/useDocuments';
import { useOnboardingRole } from '@/hooks/useOnboardingRole';
import { type CopilotAgentType } from '@/lib/copilot/types';
import type { EmptyStateRole } from '@/lib/onboarding/role-empty-states';

// Role-tuned Copilot starter prompts (A8 lock 2026-04-30). The generic
// founder-level set ("Should we pivot our product strategy?") was on
// every persona's screen regardless of buyer archetype; the M&A audit
// flagged it as the wrong altitude. Each set keeps DI vocabulary
// consistent with the rest of the platform — DQI, biases, IC memo,
// counterfactual, regulatory exposure — so the prompts read as the
// platform's voice, not generic ChatGPT.
//
// Forward-looking rule: when the role enum extends, add a matching
// entry below. The TypeScript Record<EmptyStateRole, ...> enforces
// completeness at compile time.
const STARTER_DECISION_PROMPTS: Record<EmptyStateRole, string[]> = {
  cso: [
    'Walk me through the strongest 3 risks across this strategic memo.',
    'What questions will the board ask first about this recommendation?',
    'Compare this strategic plan against the historical case library — closest analogues?',
    'Where in the memo is the weakest assumption that the IC will catch?',
  ],
  ma: [
    "What's the implied IRR if integration costs come in 20% higher than the model?",
    'Which IC members are most likely to push back, and on which assumptions?',
    'Compare risk profiles across my active deal pipeline — which is most exposed?',
    'Did the seller anchor the valuation, and where does the memo absorb that anchor?',
  ],
  pe_vc: [
    'How does this IC memo stack against the last 5 deals we closed?',
    "What's the cross-fund pattern in our anchoring biases this vintage?",
    'Stress-test the FX assumption — what breaks the IRR if local currency drops 30%?',
    'What would the LP procurement reader flag first in this DPR?',
  ],
  bizops: [
    'Which biases recur across this quarter’s strategic decisions?',
    'Where is process maturity dragging the DQI down most across active decisions?',
    'Which decisions are overdue for outcome reporting and why?',
    'What’s the highest-ROI fix to the recurring bias my team keeps showing?',
  ],
  other: [
    'What patterns do you see in my decision-making?',
    'What biases were most commonly found across my documents?',
    'Compare the risk levels across my analyzed documents.',
    'Which document had the best decision quality and why?',
  ],
};

// STARTER_DECISION_QUESTIONS removed Phase E 2026-05-09 evening — was
// only consumed by the now-deleted prompt-input intermediate mode.
// Composer-first flow uses STARTER_DECISION_PROMPTS only.

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  fontSize: 10,
  fontFamily: 'inherit',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 4,
  color: 'var(--text-secondary)',
  margin: '0 1px',
};

interface SessionSummary {
  id: string;
  title: string;
  status: string;
  dqiScore: number | null;
  updatedAt: string;
  turnCount: number;
}

export function CopilotPageContent() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [composerInput, setComposerInput] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const {
    messages,
    isStreaming,
    error,
    activeAgent,
    sessionId,
    suggestions,
    pinnedDocumentId,
    setPinnedDocumentId,
    sendMessage,
    startNewSession,
    clearMessages,
    loadSession,
    resolveSession,
  } = useCopilotStream();

  const { documents } = useDocuments();
  const [showDocPicker, setShowDocPicker] = useState(false);
  const role = useOnboardingRole();
  const effectiveRole: EmptyStateRole = role ?? 'other';

  // Documents available for pinning (those that have a score / have been analyzed)
  const analyzedDocs = documents.filter(d => d.score != null);
  const pinnedDoc = analyzedDocs.find(d => d.id === pinnedDocumentId);

  // Load sessions on mount
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/copilot/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.warn('[CopilotPage] fetchSessions failed:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Refresh sessions when a new session is created
  useEffect(() => {
    if (sessionId) {
      fetchSessions();
    }
  }, [sessionId, fetchSessions]);

  // Auto-start session from Command Palette prompt param + auto-pin
  // document from any deep link that passes ?documentId=X (C4 lock
  // 2026-04-30). Lets a "Ask Copilot about this audit" CTA on a doc /
  // deal page route to /dashboard/ask?documentId=<id> and arrive with
  // the document already in context.
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPrompt = searchParams.get('prompt');
  const initialDocumentId = searchParams.get('documentId');
  const promptHandledRef = useRef(false);
  const documentPinnedRef = useRef(false);

  useEffect(() => {
    if (initialPrompt && !sessionId && !promptHandledRef.current) {
      promptHandledRef.current = true;
      startNewSession(initialPrompt);
      sendMessage(initialPrompt);
      router.replace('/dashboard/ask');
    }
  }, [initialPrompt, sessionId, startNewSession, sendMessage, router]);

  useEffect(() => {
    if (
      initialDocumentId &&
      !documentPinnedRef.current &&
      analyzedDocs.some(d => d.id === initialDocumentId)
    ) {
      documentPinnedRef.current = true;
      setPinnedDocumentId(initialDocumentId);
      // Strip the param so a refresh doesn't re-fire — but keep ?prompt
      // if it's also present so it can still drive the session start.
      const remaining = new URLSearchParams(searchParams.toString());
      remaining.delete('documentId');
      const qs = remaining.toString();
      router.replace(qs ? `/dashboard/ask?${qs}` : '/dashboard/ask');
    }
  }, [initialDocumentId, analyzedDocs, setPinnedDocumentId, searchParams, router]);

  // Phase E refactor 2026-05-09 evening — composer-first flow.
  // Typing into the composer + pressing Enter (or clicking the arrow)
  // IS the start-a-session action. No intermediate "What decision are
  // you working on?" mode. Sidebar's "+ New Decision" clears the active
  // session so the composer surfaces ready for the next prompt.
  const handleNewDecision = () => {
    clearMessages();
    setComposerInput('');
  };

  const handleSubmitComposer = () => {
    const text = composerInput.trim();
    if (!text) return;
    if (!sessionId) {
      startNewSession(text);
    }
    sendMessage(text);
    setComposerInput('');
  };

  const handleStarterClick = (prompt: string) => {
    if (!sessionId) {
      startNewSession(prompt);
    }
    sendMessage(prompt);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/copilot/sessions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (sessionId === id) {
          clearMessages();
        }
      }
    } catch (err) {
      console.warn('[CopilotPage] handleDeleteSession failed:', err);
    }
  };

  const handleSendMessage = (text: string, forcedAgent?: CopilotAgentType) => {
    sendMessage(text, forcedAgent);
  };

  const handleResolve = async (data: Parameters<typeof resolveSession>[0]) => {
    const result = await resolveSession(data);
    // Refresh sessions to show updated status
    fetchSessions();
    return result;
  };

  const hasActiveSession = messages.length > 0;
  const currentSession = sessions.find(s => s.id === sessionId);
  const canResolve = sessionId && messages.length > 0 && currentSession?.status !== 'resolved';

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-[4.5rem] left-3 z-40 rounded-lg border p-2"
        style={{
          background: 'var(--bg-tertiary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)',
        }}
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Sidebar — Session List */}
      <div
        className={`${showSidebar ? 'fixed inset-y-0 left-0 z-30 pt-16' : 'hidden'} lg:relative lg:block lg:pt-0 w-72 flex-shrink-0 border-r flex flex-col`}
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="p-4 border-b space-y-2" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={handleNewDecision} className="btn btn-primary w-full" style={{ gap: 8 }}>
            <Plus className="h-4 w-4" />
            New Decision
          </button>

          {/* Document pin */}
          <div className="relative">
            <button
              onClick={() => setShowDocPicker(!showDocPicker)}
              className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ask-card"
              style={
                pinnedDoc
                  ? {
                      borderColor: 'var(--success)',
                      background: 'rgba(22, 163, 74, 0.08)',
                      color: 'var(--success)',
                    }
                  : {
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                    }
              }
            >
              <Pin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate flex-1 text-left">
                {pinnedDoc ? pinnedDoc.filename : 'Pin a document'}
              </span>
              {pinnedDoc && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setPinnedDocumentId(null);
                  }}
                  className="flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>

            {showDocPicker && (
              <div
                className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border max-h-48 overflow-y-auto"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {analyzedDocs.length === 0 ? (
                  <div
                    className="px-3 py-4 text-xs text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No analyzed documents yet.
                  </div>
                ) : (
                  analyzedDocs.map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setPinnedDocumentId(d.id === pinnedDocumentId ? null : d.id);
                        setShowDocPicker(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ask-session"
                      style={{
                        color: d.id === pinnedDocumentId ? 'var(--success)' : 'var(--text-primary)',
                      }}
                    >
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{d.filename}</span>
                      {d.score != null && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {d.score}/100
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              No decision sessions yet.
              <br />
              Start your first one above.
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className="group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ask-session"
                style={{
                  background: sessionId === s.id ? 'var(--bg-active)' : 'transparent',
                  color: sessionId === s.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
                onClick={() => {
                  loadSession(s.id);
                  setShowSidebar(false);
                }}
              >
                {s.status === 'resolved' ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                ) : (
                  <Brain className="h-4 w-4 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <span>{s.turnCount} turns</span>
                    {s.status === 'resolved' && (
                      <span className="text-green-500 font-medium">Resolved</span>
                    )}
                    {s.dqiScore != null && (
                      <>
                        <span style={{ color: 'var(--text-muted)' }}>|</span>
                        <span>DQI {s.dqiScore}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        {hasActiveSession ? (
          /* Active Copilot Chat — composer lives inside CopilotChat */
          <CopilotChat
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            activeAgent={activeAgent}
            suggestions={suggestions}
            pinnedDocName={pinnedDoc?.filename}
            onSendMessage={handleSendMessage}
            onResolve={canResolve ? () => setShowResolveModal(true) : undefined}
            onDismissError={() => {
              /* error is managed by hook state */
            }}
            onUnpinDoc={() => setPinnedDocumentId(null)}
          />
        ) : (
          // Empty State — composer-first, single column. Phase E refactor
          // 2026-05-09 evening: dropped the dual-CTA pattern (separate
          // "+ New Decision Session" hero button + "Or try asking"
          // starters + dangling document chips) and the intermediate
          // prompt-input mode. Now the composer is the single starting
          // point — type, press Enter, session opens with that prompt
          // as the first turn. Starter chips are a quick-fire alt.
          <div
            className="flex-1 flex flex-col items-center justify-center"
            style={{
              padding: '24px 24px 40px',
              overflowY: 'auto',
            }}
          >
            <div className="w-full" style={{ maxWidth: 720 }}>
              {/* Compact welcome row — single line, not a hero */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(22, 163, 74, 0.10)',
                    border: '1px solid rgba(22, 163, 74, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      margin: 0,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    Ask, audit, or stress-test a decision.
                  </h2>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      margin: '2px 0 0 0',
                      lineHeight: 1.4,
                    }}
                  >
                    Structured decisions, document Q&amp;A with citations, cross-portfolio pattern
                    recall.
                    {pinnedDoc && (
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {' '}
                        · Pinned: {pinnedDoc.filename}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Composer — the primary entry point */}
              <div
                style={{
                  position: 'relative',
                  marginBottom: 20,
                }}
              >
                <textarea
                  value={composerInput}
                  onChange={e => setComposerInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComposer();
                    }
                  }}
                  placeholder={
                    pinnedDoc
                      ? `Ask anything about ${pinnedDoc.filename}, or pose a fresh decision…`
                      : 'Pose a decision, paste a memo passage, or ask about a flagged bias…'
                  }
                  rows={3}
                  autoFocus
                  className="ask-input"
                  style={{
                    width: '100%',
                    padding: '14px 56px 14px 16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.12)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={handleSubmitComposer}
                  disabled={!composerInput.trim()}
                  aria-label="Start session"
                  style={{
                    position: 'absolute',
                    right: 10,
                    bottom: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-md)',
                    background: composerInput.trim()
                      ? 'var(--accent-primary)'
                      : 'var(--bg-elevated)',
                    border: 'none',
                    color: composerInput.trim() ? '#fff' : 'var(--text-muted)',
                    cursor: composerInput.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  <ArrowUp size={16} />
                </button>
                <div
                  style={{
                    position: 'absolute',
                    left: 16,
                    bottom: -22,
                    fontSize: 10.5,
                    color: 'var(--text-muted)',
                  }}
                >
                  Press <kbd style={kbdStyle}>↵</kbd> to start · <kbd style={kbdStyle}>Shift</kbd>+
                  <kbd style={kbdStyle}>↵</kbd> for newline
                </div>
              </div>

              {/* Starter chips — 4 role-tuned prompts. Click fires a
                  session immediately, no intermediate confirmation. */}
              <div style={{ marginTop: 32 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 10,
                  }}
                >
                  Quick starters · {effectiveRole === 'other' ? 'general' : effectiveRole}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 8,
                  }}
                >
                  {STARTER_DECISION_PROMPTS[effectiveRole].map(q => (
                    <button
                      key={q}
                      onClick={() => handleStarterClick(q)}
                      className="ask-card"
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        fontSize: 12.5,
                        lineHeight: 1.45,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pinned-document hint when ZERO docs pinned but analyzed
                  docs exist — quick-pin chips inline, not as a dangling
                  bottom strip. */}
              {!pinnedDoc && analyzedDocs.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    Pin a document for grounded Q&amp;A
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {analyzedDocs.slice(0, 6).map(d => (
                      <button
                        key={d.id}
                        onClick={() => setPinnedDocumentId(d.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--text-secondary)',
                          fontSize: 11.5,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Pin size={10} />
                        <span
                          style={{
                            maxWidth: 140,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.filename}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resolve Decision Modal */}
      {showResolveModal && (
        <ResolveDecisionModal
          onResolve={handleResolve}
          onClose={() => setShowResolveModal(false)}
        />
      )}

      {/* Mobile sidebar backdrop */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.4)' }}
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
