'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Sparkles,
  Clock,
  Trash2,
  Loader2,
  ChevronRight,
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
    "What would the LP procurement reader flag first in this DPR?",
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

const STARTER_DECISION_QUESTIONS: Record<EmptyStateRole, string[]> = {
  cso: [
    'Should we pivot the strategic plan based on Q3 outcomes?',
    "Is this market-entry recommendation IC-ready?",
    'How should we handle the dissent on the capital-allocation decision?',
    'Should we expand into the new market or defer another quarter?',
  ],
  ma: [
    "Should we proceed to LOI on Project Phoenix given the diligence findings?",
    'Is the FX risk on this deal tolerable for our fund mandate?',
    'How should we structure the earn-out given the seller’s revenue concentration?',
    'Should we pass on this deal or surface conditions to the IC?',
  ],
  pe_vc: [
    "Should we lead the round or wait for a co-investor signal?",
    "Is the founder-CEO transition risk priced into our entry valuation?",
    'How should we structure governance rights given the syndicate composition?',
    'Should we approve at this price or counter with structured terms?',
  ],
  bizops: [
    'Should we recommit to the OKR or pivot the team?',
    'Is the vendor risk acceptable given the SLA carve-outs?',
    'How should we sequence the migration to keep operational risk bounded?',
    'Should we approve the budget reallocation or defer to next quarter?',
  ],
  other: [
    'Should we pivot our product strategy?',
    'How should we handle this key hire decision?',
    'Is this partnership worth pursuing?',
    'Should we expand to a new market now?',
  ],
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
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [promptInput, setPromptInput] = useState('');
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

  const handleNewDecision = () => {
    setShowPromptInput(true);
    setPromptInput('');
  };

  const handleStartSession = () => {
    if (promptInput.trim()) {
      startNewSession(promptInput.trim());
      setShowPromptInput(false);
      // Send the decision prompt as the first message too
      sendMessage(promptInput.trim());
    }
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

  const hasActiveSession = messages.length > 0 || showPromptInput;
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
      <div className="flex-1 flex flex-col">
        {showPromptInput ? (
          /* New Decision Prompt Input */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center space-y-2">
                <div
                  className="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(22, 163, 74, 0.10)',
                    border: '1px solid rgba(22, 163, 74, 0.22)',
                  }}
                >
                  <Sparkles className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  What decision are you working on?
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Describe the decision, question, or problem you&apos;re thinking through. Your
                  copilot agents will help you structure, challenge, and refine it.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={promptInput}
                  onChange={e => setPromptInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartSession();
                    }
                  }}
                  placeholder="e.g., Should we proceed with the acquisition at the proposed $200M valuation, or push for a lower price given the integration risks?"
                  rows={4}
                  className="ask-input w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowPromptInput(false)}
                    className="rounded-lg px-4 py-2 text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartSession}
                    disabled={!promptInput.trim()}
                    className="btn btn-primary"
                    style={{ gap: 8 }}
                  >
                    Start Session
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {STARTER_DECISION_QUESTIONS[effectiveRole].map(example => (
                  <button
                    key={example}
                    onClick={() => setPromptInput(example)}
                    className="rounded-lg border p-3 text-left text-xs transition-colors ask-card"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : hasActiveSession ? (
          /* Active Copilot Chat */
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
          /* Empty State with starter questions */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="w-full max-w-lg space-y-5">
              <div className="text-center space-y-3">
                <div
                  className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(22, 163, 74, 0.10)',
                    border: '1px solid rgba(22, 163, 74, 0.22)',
                  }}
                >
                  <Sparkles className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Your AI Advisory Team
                </h2>
                <p
                  className="text-sm leading-relaxed mx-auto"
                  style={{ color: 'var(--text-muted)', maxWidth: 380 }}
                >
                  Start a structured decision session, or ask a question about your documents. Pin a
                  document in the sidebar for focused Q&amp;A with source citations.
                </p>
              </div>

              <div className="flex justify-center">
                <button onClick={handleNewDecision} className="btn btn-primary" style={{ gap: 8 }}>
                  <Plus className="h-4 w-4" />
                  New Decision Session
                </button>
              </div>

              {/* Starter questions */}
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-wider font-semibold text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Or try asking
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STARTER_DECISION_PROMPTS[effectiveRole].map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        startNewSession(q);
                        sendMessage(q);
                      }}
                      className="rounded-lg border p-3 text-left text-xs transition-colors ask-card"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyzed document chips */}
              {analyzedDocs.length > 0 && (
                <div className="text-center">
                  <p
                    className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Your documents
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {analyzedDocs.slice(0, 6).map(d => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setPinnedDocumentId(d.id);
                          handleNewDecision();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ask-card"
                        style={{
                          background: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <FileText className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{d.filename}</span>
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
