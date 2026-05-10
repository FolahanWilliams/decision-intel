'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
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
    // Height: full parent (the AskPage wrapper sets the calc(100vh - 44px)
    // bound with the page header carved off). Locked 2026-05-10
    // streamlining batch — the prior inline 'h-[calc(100vh-4rem)]' didn't
    // match the parent's 'calc(100vh - 44px)' frame, which made the
    // session rail + chat overflow vertically (founder report: "left
    // sidepanel is half missing"). Inheriting parent height fixes both
    // ends — the rail stops being clipped at the bottom AND the chat
    // composer pins to the visible bottom.
    <div className="flex h-full overflow-hidden">
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

      {/* Sidebar — Session List. Phase E follow-up 2026-05-09 evening:
          rebuilt the action header (was a giant pill + floating ghost
          button with mismatched geometries). Now: a unified header card
          with consistent radius, sentence-case labels, and a green top
          accent strip when pinning is active so the visual state of
          "this conversation has a doc grounding" is unmissable. */}
      <div
        className={`${showSidebar ? 'fixed inset-y-0 left-0 z-30 pt-16' : 'hidden'} lg:relative lg:block lg:pt-0 w-72 flex-shrink-0 border-r flex flex-col`}
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            onClick={handleNewDecision}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
            }}
          >
            <Plus size={14} />
            New decision
          </button>

          {/* Pin-a-document affordance — visually paired with the New
              Decision button (same radius, same width). Top accent strip
              fires green when a doc is pinned to make the active
              grounding state visible without hunting. */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDocPicker(!showDocPicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                background: pinnedDoc ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-card)',
                border: `1px solid ${pinnedDoc ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderTop: pinnedDoc
                  ? '2px solid var(--accent-primary)'
                  : '1px solid var(--border-color)',
                color: pinnedDoc ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <Pin size={12} style={{ flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pinnedDoc ? pinnedDoc.filename : 'Pin a document'}
              </span>
              {pinnedDoc && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    setPinnedDocumentId(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setPinnedDocumentId(null);
                    }
                  }}
                  aria-label="Unpin document"
                  style={{
                    flexShrink: 0,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                  }}
                >
                  <X size={12} />
                </span>
              )}
            </button>

            {showDocPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  zIndex: 50,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-lg)',
                  maxHeight: 224,
                  overflowY: 'auto',
                }}
              >
                {analyzedDocs.length === 0 ? (
                  <div
                    style={{
                      padding: '14px 12px',
                      fontSize: 11.5,
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}
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
                      className="ask-session"
                      style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        fontSize: 11.5,
                        background: 'transparent',
                        border: 'none',
                        color:
                          d.id === pinnedDocumentId
                            ? 'var(--accent-primary)'
                            : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <FileText size={11} style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.filename}
                      </span>
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
          // Empty State — composer-first. Phase E refactor + follow-up
          // 2026-05-09 evening: dropped the duplicate inner H1 (the page
          // header carries "Your AI advisory team."). Composer card now
          // gets a green top accent strip so it reads as the primary
          // action; starter cards get an indigo accent so they read as
          // a distinct secondary group, breaking up the white-on-white
          // visual flatness. Pinned-doc hint card gets an amber accent
          // when surfaced (it's a contextual nudge, not a primary path).
          <div
            className="flex-1 flex flex-col items-center justify-start"
            style={{
              padding: '32px 24px 40px',
              overflowY: 'auto',
            }}
          >
            <div className="w-full" style={{ maxWidth: 720 }}>
              {/* Composer card — primary action, green top accent.
                  The page header above carries the H1 + capability line;
                  this card is just the input + send button + key hint. */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderTop: '3px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                  marginBottom: 24,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--fs-3xs)',
                    fontWeight: 700,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-primary)',
                    marginBottom: 8,
                  }}
                >
                  Start a decision session
                  {pinnedDoc && (
                    <span
                      style={{
                        marginLeft: 8,
                        padding: '1px 8px',
                        background: 'rgba(22, 163, 74, 0.10)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 10,
                        textTransform: 'none',
                        letterSpacing: '0.02em',
                        fontWeight: 600,
                      }}
                    >
                      Pinned: {pinnedDoc.filename}
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
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
                      padding: '12px 52px 12px 14px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
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
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.10)';
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
                      right: 8,
                      bottom: 8,
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
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: 'var(--text-muted)',
                    marginTop: 8,
                  }}
                >
                  Press <kbd style={kbdStyle}>↵</kbd> to start · <kbd style={kbdStyle}>Shift</kbd>+
                  <kbd style={kbdStyle}>↵</kbd> for newline
                </div>
              </div>

              {/* Quick starters — indigo top accent so they read as a
                  distinct secondary group, breaking the white-on-white
                  flatness flagged in the founder audit. Click fires a
                  session immediately. */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent-secondary, #6366f1)',
                    }}
                  />
                  Quick starters · {effectiveRole === 'other' ? 'general' : effectiveRole}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 10,
                  }}
                >
                  {STARTER_DECISION_PROMPTS[effectiveRole].map(q => (
                    <button
                      key={q}
                      onClick={() => handleStarterClick(q)}
                      className="ask-card"
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderTop: '2px solid var(--accent-secondary, #6366f1)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        fontSize: 12.5,
                        lineHeight: 1.45,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pinned-document affordance — amber accent for "contextual
                  nudge" semantics (vs primary green / secondary indigo).
                  Only renders when no doc is pinned + analyzed docs exist. */}
              {!pinnedDoc && analyzedDocs.length > 0 && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderTop: '2px solid var(--warning, #f59e0b)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Pin size={12} style={{ color: 'var(--warning, #f59e0b)' }} />
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Pin a document for grounded Q&amp;A
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                      margin: '0 0 10px 0',
                      lineHeight: 1.5,
                    }}
                  >
                    Pinning grounds responses in the source — every claim cites the passage it came
                    from.
                  </p>
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
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--text-secondary)',
                          fontSize: 11.5,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <FileText size={10} />
                        <span
                          style={{
                            maxWidth: 160,
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
