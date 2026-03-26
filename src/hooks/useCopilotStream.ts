'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SSEReader } from '@/lib/sse';
import {
  type CopilotAgentType,
  AGENT_LABELS,
} from '@/lib/copilot/types';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'agent';
  agentType?: CopilotAgentType;
  agentLabel?: string;
  content: string;
  sources?: CopilotSource[];
  isStreaming?: boolean;
}

export interface CopilotSource {
  documentId: string;
  filename: string;
  similarity: number;
  score: number;
}

export interface ResolveSessionData {
  chosenOption: string;
  outcome?: string;
  impactScore?: number;
  lessonsLearned?: string;
  whatWorked?: string;
  whatFailed?: string;
  wouldChooseSame?: boolean;
  helpfulAgents?: string[];
}

interface UseCopilotStreamReturn {
  messages: CopilotMessage[];
  isStreaming: boolean;
  error: string | null;
  activeAgent: CopilotAgentType | null;
  sessionId: string | null;
  sendMessage: (text: string, forcedAgent?: CopilotAgentType) => Promise<void>;
  startNewSession: (decisionPrompt: string) => void;
  clearMessages: () => void;
  loadSession: (sessionId: string) => Promise<void>;
  resolveSession: (data: ResolveSessionData) => Promise<{ session: unknown; outcome: unknown; message: string } | undefined>;
}

let messageCounter = 0;
function nextId(): string {
  return `cop-${Date.now()}-${++messageCounter}`;
}

export function useCopilotStream(): UseCopilotStreamReturn {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<CopilotAgentType | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [decisionPrompt, setDecisionPrompt] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<CopilotMessage[]>(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (text: string, forcedAgent?: CopilotAgentType) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);

      const userMsg: CopilotMessage = { id: nextId(), role: 'user', content: trimmed };
      const agentMsg: CopilotMessage = {
        id: nextId(),
        role: 'agent',
        content: '',
        sources: [],
        isStreaming: true,
      };

      setMessages(prev => [...prev, userMsg, agentMsg]);
      setIsStreaming(true);

      abortRef.current = new AbortController();

      try {
        const body: Record<string, unknown> = { message: trimmed };
        if (sessionId) {
          body.sessionId = sessionId;
        } else if (decisionPrompt) {
          body.decisionPrompt = decisionPrompt;
        }
        if (forcedAgent) {
          body.forcedAgent = forcedAgent;
        }

        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Copilot failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        const sseReader = new SSEReader();
        let accumulated = '';
        let sources: CopilotSource[] = [];
        let currentAgent: CopilotAgentType | undefined;

        const processEvent = (data: unknown) => {
          const event = data as Record<string, unknown>;

          if (event.type === 'agent_start') {
            currentAgent = event.agent as CopilotAgentType;
            setActiveAgent(currentAgent);
            setMessages(prev =>
              prev.map(m =>
                m.id === agentMsg.id
                  ? {
                      ...m,
                      agentType: currentAgent,
                      agentLabel: AGENT_LABELS[currentAgent!],
                    }
                  : m
              )
            );
          } else if (event.type === 'sources') {
            sources = (event.sources as CopilotSource[]) || [];
          } else if (event.type === 'chunk') {
            accumulated += (event.text as string) || '';
            setMessages(prev =>
              prev.map(m =>
                m.id === agentMsg.id
                  ? { ...m, content: accumulated, sources, isStreaming: true }
                  : m
              )
            );
          } else if (event.type === 'done') {
            const doneSessionId = event.sessionId as string | undefined;
            if (doneSessionId && !sessionId) {
              setSessionId(doneSessionId);
            }
            setMessages(prev =>
              prev.map(m =>
                m.id === agentMsg.id
                  ? { ...m, content: accumulated, sources, isStreaming: false }
                  : m
              )
            );
          } else if (event.type === 'error') {
            setError((event.message as string) || 'An error occurred');
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          sseReader.processChunk(chunk, processEvent);
        }

        // Safety net
        setMessages(prev =>
          prev.map(m =>
            m.id === agentMsg.id && m.isStreaming ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Copilot failed';
        setError(message);
        setMessages(prev =>
          prev.filter(m => m.id !== agentMsg.id || m.content.length > 0)
        );
      } finally {
        setIsStreaming(false);
        setActiveAgent(null);
        abortRef.current = null;
      }
    },
    [isStreaming, sessionId, decisionPrompt]
  );

  const startNewSession = useCallback((prompt: string) => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setSessionId(null);
    setDecisionPrompt(prompt);
    setError(null);
    setIsStreaming(false);
    setActiveAgent(null);
  }, []);

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setSessionId(null);
    setDecisionPrompt(null);
    setError(null);
    setIsStreaming(false);
    setActiveAgent(null);
  }, []);

  const loadSession = useCallback(async (id: string) => {
    if (abortRef.current) abortRef.current.abort();
    setError(null);
    setIsStreaming(false);
    setActiveAgent(null);

    try {
      // Fetch session turns
      const res = await fetch(`/api/copilot/sessions/${id}`);
      if (!res.ok) throw new Error('Failed to load session');
      const data = await res.json();

      setSessionId(id);
      setDecisionPrompt(data.session.decisionPrompt);
      setMessages(
        data.session.turns.map((t: Record<string, unknown>) => ({
          id: nextId(),
          role: t.role as string,
          agentType: t.agentType as CopilotAgentType | undefined,
          agentLabel: t.agentType ? AGENT_LABELS[t.agentType as CopilotAgentType] : undefined,
          content: t.content as string,
          sources: t.sources as CopilotSource[] | undefined,
          isStreaming: false,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    }
  }, []);

  const resolveSession = useCallback(async (data: ResolveSessionData) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/copilot/sessions/${sessionId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to resolve session');
      }
      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve session';
      setError(message);
      throw err;
    }
  }, [sessionId]);

  // Streaming safety timeout — auto-clear if streaming hangs for >60s
  useEffect(() => {
    if (!isStreaming) return;
    const timer = setTimeout(() => {
      setIsStreaming(false);
      setActiveAgent(null);
      setError('Response timed out. Please try again.');
    }, 60_000);
    return () => clearTimeout(timer);
  }, [isStreaming]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
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
  };
}
