'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Sparkles,
  Swords,
  Telescope,
  BarChart3,
  Brain,
  CheckCircle,
  X,
  Pin,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AgentBadge } from './AgentBadge';
import { SourceAttribution } from '@/components/chat/SourceAttribution';
import { SuggestedQuestions } from '@/components/chat/SuggestedQuestions';
import { type CopilotMessage } from '@/hooks/useCopilotStream';
import { type CopilotAgentType } from '@/lib/copilot/types';

interface CopilotChatProps {
  messages: CopilotMessage[];
  isStreaming: boolean;
  error: string | null;
  activeAgent: CopilotAgentType | null;
  suggestions?: string[];
  pinnedDocName?: string | null;
  onSendMessage: (text: string, forcedAgent?: CopilotAgentType) => void;
  onResolve?: () => void;
  onDismissError?: () => void;
  onUnpinDoc?: () => void;
}

const QUICK_ACTIONS: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  agent: CopilotAgentType;
  prompt: string;
}> = [
  {
    label: 'Challenge this',
    icon: Swords,
    agent: 'devils_advocate',
    prompt: 'Challenge the assumptions in what we have so far. What could go wrong?',
  },
  {
    label: 'What if...?',
    icon: Telescope,
    agent: 'scenario_explorer',
    prompt: 'Explore different scenarios — what happens under best and worst case conditions?',
  },
  {
    label: 'Summarize & Score',
    icon: BarChart3,
    agent: 'synthesizer',
    prompt:
      'Summarize everything discussed and rank the options with a decision quality assessment.',
  },
  {
    label: 'What would I do?',
    icon: Brain,
    agent: 'personal_twin',
    prompt:
      "Based on my decision history and patterns, what would I likely do here? Give me my personal twin's perspective.",
  },
];

export function CopilotChat({
  messages,
  isStreaming,
  error,
  activeAgent,
  suggestions = [],
  pinnedDocName,
  onSendMessage,
  onResolve,
  onDismissError,
  onUnpinDoc,
}: CopilotChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isStreaming) {
      inputRef.current?.focus();
    }
  }, [isStreaming, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Pinned document banner */}
      {pinnedDocName && (
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Pin className="inline h-3 w-3 mr-1" />
            Chatting about{' '}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {pinnedDocName}
            </span>
          </span>
          {onUnpinDoc && (
            <button
              onClick={onUnpinDoc}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Unpin document"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div
            className="flex h-full items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="text-center space-y-2">
              <Sparkles className="mx-auto h-8 w-8" style={{ color: 'var(--accent-primary)' }} />
              <p className="text-sm">Start the conversation — your copilot agents are ready.</p>
            </div>
          </div>
        )}

        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] rounded-lg px-4 py-3"
                style={
                  isUser
                    ? {
                        background: 'var(--accent-primary)',
                        color: 'white',
                      }
                    : {
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                      }
                }
              >
                {msg.role === 'agent' && msg.agentType && (
                  <div className="mb-2">
                    <AgentBadge agentType={msg.agentType} />
                  </div>
                )}
                <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                  {msg.role === 'agent' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                  {msg.isStreaming && (
                    <span
                      className="ml-1 inline-block h-4 w-1 animate-pulse"
                      style={{ background: 'var(--text-muted)' }}
                    />
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div
                    className="mt-2 pt-2"
                    style={{ borderTop: '1px solid var(--border-color)' }}
                  >
                    <SourceAttribution sources={msg.sources} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div
            className="rounded-lg p-3 text-sm flex items-center justify-between"
            style={{
              background: 'color-mix(in srgb, var(--error) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--error) 35%, transparent)',
              color: 'var(--error)',
            }}
          >
            <span>{error}</span>
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="ml-2 transition-colors"
                style={{ color: 'var(--error)' }}
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Follow-up suggestions */}
        <SuggestedQuestions
          questions={suggestions}
          onSelect={q => onSendMessage(q)}
          isVisible={!isStreaming && suggestions.length > 0}
        />

        {/* Scroll anchor */}
        <div ref={bottomAnchorRef} />
      </div>

      {/* Quick actions */}
      {messages.length > 0 && !isStreaming && (
        <div
          className="px-4 py-2 flex gap-2 flex-wrap"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.agent}
              onClick={() => onSendMessage(action.prompt, action.agent)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </button>
          ))}
          {onResolve && (
            <button
              onClick={onResolve}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors ml-auto"
              style={{
                background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--success) 40%, transparent)',
                color: 'var(--success)',
              }}
            >
              <CheckCircle className="h-3 w-3" />
              Resolve Decision
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeAgent
                  ? `${activeAgent.replace(/_/g, ' ')} is thinking...`
                  : 'Type your message...'
              }
              disabled={isStreaming}
              rows={1}
              className="w-full resize-none rounded-lg px-4 py-3 text-sm focus:outline-none disabled:opacity-50"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                maxHeight: '120px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex h-11 w-11 items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
            }}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
