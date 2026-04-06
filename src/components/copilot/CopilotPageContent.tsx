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
import { type CopilotAgentType } from '@/lib/copilot/types';

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
    } catch {
      // Ignore
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

  // Auto-start session from Command Palette prompt param
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPrompt = searchParams.get('prompt');
  const promptHandledRef = useRef(false);

  useEffect(() => {
    if (initialPrompt && !sessionId && !promptHandledRef.current) {
      promptHandledRef.current = true;
      startNewSession(initialPrompt);
      sendMessage(initialPrompt);
      router.replace('/dashboard/ask');
    }
  }, [initialPrompt, sessionId, startNewSession, sendMessage, router]);

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
    } catch {
      // Ignore
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
        className="lg:hidden fixed top-[4.5rem] left-3 z-40 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Sidebar — Session List */}
      <div
        className={`${showSidebar ? 'fixed inset-y-0 left-0 z-30 pt-16' : 'hidden'} lg:relative lg:block lg:pt-0 w-72 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col`}
      >
        <div className="p-4 border-b border-zinc-800 space-y-2">
          <button
            onClick={handleNewDecision}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Decision
          </button>

          {/* Document pin */}
          <div className="relative">
            <button
              onClick={() => setShowDocPicker(!showDocPicker)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                pinnedDoc
                  ? 'border-green-700 bg-green-900/20 text-green-300'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
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
                  className="flex-shrink-0 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>

            {showDocPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl max-h-48 overflow-y-auto">
                {analyzedDocs.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-zinc-500 text-center">
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
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-zinc-700 ${
                        d.id === pinnedDocumentId ? 'text-green-300' : 'text-zinc-300'
                      }`}
                    >
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{d.filename}</span>
                      {d.score != null && (
                        <span className="text-[10px] text-zinc-500">{d.score}/100</span>
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
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-zinc-500">
              No decision sessions yet.
              <br />
              Start your first one above.
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                  sessionId === s.id
                    ? 'bg-zinc-700/50 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
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
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                    <span className="text-zinc-600">|</span>
                    <span>{s.turnCount} turns</span>
                    {s.status === 'resolved' && (
                      <span className="text-green-500 font-medium">Resolved</span>
                    )}
                    {s.dqiScore != null && (
                      <>
                        <span className="text-zinc-600">|</span>
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
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-600 transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-zinc-400" />
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
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  What decision are you working on?
                </h2>
                <p className="text-sm text-zinc-400">
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
                  placeholder="e.g., Should we raise Series A now or wait 6 months? We have 14 months of runway and the market is uncertain..."
                  rows={4}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowPromptInput(false)}
                    className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartSession}
                    disabled={!promptInput.trim()}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Start Session
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  'Should we pivot our product strategy?',
                  'How should we handle this key hire decision?',
                  'Is this partnership worth pursuing?',
                  'Should we expand to a new market now?',
                ].map(example => (
                  <button
                    key={example}
                    onClick={() => setPromptInput(example)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-left text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
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
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-blue-400" />
                </div>
                <h2 className="text-lg font-medium text-zinc-200">Your AI Advisory Team</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Start a structured decision session, or ask a question about your documents. Pin a
                  document in the sidebar for focused Q&amp;A with source citations.
                </p>
              </div>

              <button
                onClick={handleNewDecision}
                className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Decision Session
              </button>

              {/* Starter questions */}
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider text-center">
                  Or try asking
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'What patterns do you see in my decision-making?',
                    'What biases were most commonly found across my documents?',
                    'Compare the risk levels across my analyzed documents.',
                    'Which document had the best decision quality and why?',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        startNewSession(q);
                        sendMessage(q);
                      }}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-left text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyzed document chips */}
              {analyzedDocs.length > 0 && (
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
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
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
