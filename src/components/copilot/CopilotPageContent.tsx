'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { CopilotChat } from '@/components/copilot/CopilotChat';
import { ResolveDecisionModal } from '@/components/copilot/ResolveDecisionModal';
import { useCopilotStream } from '@/hooks/useCopilotStream';
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
    sendMessage,
    startNewSession,
    clearMessages,
    loadSession,
    resolveSession,
  } = useCopilotStream();

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
        <div className="p-4 border-b border-zinc-800">
          <button
            onClick={handleNewDecision}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Decision
          </button>
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
            onSendMessage={handleSendMessage}
            onResolve={canResolve ? () => setShowResolveModal(true) : undefined}
            onDismissError={() => {
              /* error is managed by hook state */
            }}
          />
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <Brain className="h-8 w-8 text-zinc-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-medium text-zinc-200">Decision Copilot</h2>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Your personal AI advisory team. Start a new decision session and let your agents
                  help you build, challenge, and refine your thinking.
                </p>
              </div>
              <button
                onClick={handleNewDecision}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Start Your First Decision
              </button>
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
