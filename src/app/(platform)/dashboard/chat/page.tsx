'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { formatDate } from '@/lib/utils/format-date';
import {
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  FileText,
  Pin,
  PinOff,
  X,
  Clock,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useChatStream, type ChatMessage } from '@/hooks/useChatStream';
import { useDocuments } from '@/hooks/useDocuments';
import { useToast } from '@/components/ui/ToastContext';
import { SuggestedQuestions } from '@/components/chat/SuggestedQuestions';
import { SourceAttribution } from '@/components/chat/SourceAttribution';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { MessageActions } from '@/components/chat/MessageActions';

const CHAT_HISTORY_KEY = 'decision-intel-chat-history';
const MAX_SAVED_SESSIONS = 10;

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  pinnedDocId: string | null;
  updatedAt: string;
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions.slice(0, MAX_SAVED_SESSIONS)));
  } catch {
    /* quota exceeded — silently skip */
  }
}

export default function ChatPage() {
  const { documents } = useDocuments(false, 1, 100);
  const [pinnedDocId, setPinnedDocId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { showToast } = useToast();

  const { messages, isStreaming, error, suggestions, sendMessage, clearMessages, loadMessages } =
    useChatStream({
      pinnedDocumentId: pinnedDocId || undefined,
    });
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions and bookmarks from localStorage on mount
  useEffect(() => {
    setSessions(loadSessions());
    try {
      const saved = localStorage.getItem('decision-intel-chat-bookmarks');
      if (saved) setBookmarks(new Set(JSON.parse(saved)));
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-save current conversation whenever messages change
  useEffect(() => {
    if (messages.length === 0 || messages.some(m => m.isStreaming)) return;

    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '')
      : 'New conversation';

    setSessions(prev => {
      const sessionId = activeSessionId || `session-${Date.now()}`;
      if (!activeSessionId) setActiveSessionId(sessionId);

      const updated: ChatSession = {
        id: sessionId,
        title,
        messages: messages.filter(m => !m.isStreaming),
        pinnedDocId,
        updatedAt: new Date().toISOString(),
      };

      const existing = prev.filter(s => s.id !== sessionId);
      const next = [updated, ...existing].slice(0, MAX_SAVED_SESSIONS);
      saveSessions(next);
      return next;
    });
  }, [messages, activeSessionId, pinnedDocId]);

  const loadSession = useCallback(
    (session: ChatSession) => {
      setPinnedDocId(session.pinnedDocId);
      setActiveSessionId(session.id);
      setShowHistory(false);
      loadMessages(session.messages);
      showToast(`Loaded: ${session.title}`, 'info');
    },
    [loadMessages, showToast]
  );

  const startNewSession = useCallback(() => {
    clearMessages();
    setActiveSessionId(null);
    setShowHistory(false);
  }, [clearMessages]);

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions(prev => {
        const next = prev.filter(s => s.id !== sessionId);
        saveSessions(next);
        return next;
      });
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
    },
    [activeSessionId]
  );

  const pinnedDoc = useMemo(
    () => documents.find(d => d.id === pinnedDocId),
    [documents, pinnedDocId]
  );

  const completeDocs = useMemo(() => documents.filter(d => d.status === 'complete'), [documents]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear messages when pinned doc changes and notify user
  const prevPinnedRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (prevPinnedRef.current === undefined) {
      // Skip toast on initial mount
      prevPinnedRef.current = pinnedDocId;
      return;
    }
    clearMessages();
    if (pinnedDocId) {
      const docName = documents.find(d => d.id === pinnedDocId)?.filename;
      showToast(`Chat cleared — now chatting about ${docName || 'pinned document'}`, 'info');
    } else if (prevPinnedRef.current) {
      showToast('Document unpinned — searching all documents', 'info');
    }
    prevPinnedRef.current = pinnedDocId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedDocId, documents]);

  const toggleBookmark = useCallback((messageId: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      try {
        localStorage.setItem('decision-intel-chat-bookmarks', JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleSuggestionSelect = useCallback(
    async (question: string) => {
      setInput('');
      await sendMessage(question);
      inputRef.current?.focus();
    },
    [sendMessage]
  );

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(text);
    inputRef.current?.focus();
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 44px)',
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 var(--spacing-md)',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: 'var(--spacing-lg) 0 var(--spacing-md)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-md">
          <MessageSquare size={24} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <h1 style={{ fontSize: '18px', margin: 0 }}>Chat</h1>
            <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
              Ask questions about your analysed documents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          {/* History button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn flex items-center gap-xs"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
              title="Chat history"
            >
              <Clock size={14} />
              {sessions.length > 0 && <span>{sessions.length}</span>}
            </button>
            {showHistory && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  width: '320px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 20,
                }}
              >
                <button
                  onClick={startNewSession}
                  className="flex items-center gap-sm"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: 'none',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-highlight)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={14} /> New conversation
                </button>
                {sessions.length === 0 && (
                  <div
                    style={{
                      padding: '16px 12px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                    }}
                  >
                    No saved conversations yet
                  </div>
                )}
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between"
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-color)',
                      background:
                        s.id === activeSessionId ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                    }}
                  >
                    <button
                      onClick={() => loadSession(s)}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                        {s.messages.length} messages · {formatDate(s.updatedAt)}
                      </div>
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pin document button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="btn flex items-center gap-xs"
              style={{
                background: pinnedDocId ? 'rgba(255, 255, 255, 0.06)' : 'var(--bg-tertiary)',
                border: `1px solid ${pinnedDocId ? 'rgba(255, 255, 255, 0.15)' : 'var(--border-color)'}`,
                color: pinnedDocId ? 'var(--text-highlight)' : 'var(--text-muted)',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
              title={pinnedDocId ? `Pinned: ${pinnedDoc?.filename}` : 'Pin a document'}
            >
              {pinnedDocId ? <PinOff size={14} /> : <Pin size={14} />}
              {pinnedDocId ? 'Pinned' : 'Pin doc'}
            </button>
            {showPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  width: '300px',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  zIndex: 20,
                }}
              >
                {pinnedDocId && (
                  <button
                    onClick={() => {
                      setPinnedDocId(null);
                      setShowPicker(false);
                    }}
                    className="flex items-center gap-sm"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <X size={14} /> Unpin document (search all)
                  </button>
                )}
                {completeDocs.length === 0 && (
                  <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    No analysed documents
                  </div>
                )}
                {completeDocs.map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setPinnedDocId(d.id);
                      setShowPicker(false);
                    }}
                    className="flex items-center gap-sm"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: d.id === pinnedDocId ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
                    {d.id === pinnedDocId && (
                      <Pin size={12} style={{ color: 'var(--text-highlight)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="btn flex items-center gap-xs"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
              title="Clear conversation"
            >
              <Trash2 size={14} />
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Pinned doc banner */}
      {pinnedDoc && (
        <div
          className="flex items-center gap-sm"
          style={{
            padding: '8px var(--spacing-md)',
            background: 'rgba(255, 255, 255, 0.06)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '12px',
            flexShrink: 0,
          }}
        >
          <Pin size={12} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            Chatting about{' '}
            <Link
              href={`/documents/${pinnedDoc.id}`}
              style={{ color: 'var(--text-highlight)', textDecoration: 'none' }}
            >
              {pinnedDoc.filename}
            </Link>
          </span>
          <button
            onClick={() => setPinnedDocId(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              marginLeft: 'auto',
              display: 'flex',
              padding: '2px',
            }}
            aria-label="Unpin document"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--spacing-md) 0',
        }}
      >
        {messages.length === 0 ? (
          <ChatEmptyState documents={documents} onSuggestQuestion={handleSuggestionSelect} />
        ) : (
          <div className="flex flex-col gap-md">
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                <MessageBubble
                  message={msg}
                  isBookmarked={bookmarks.has(msg.id)}
                  onToggleBookmark={toggleBookmark}
                  onRetry={
                    msg.role === 'assistant' && idx > 0
                      ? () => {
                          const prevUser = messages
                            .slice(0, idx)
                            .reverse()
                            .find(m => m.role === 'user');
                          if (prevUser) sendMessage(prevUser.content);
                        }
                      : undefined
                  }
                />
                {/* Source attribution for assistant messages */}
                {msg.role === 'assistant' &&
                  !msg.isStreaming &&
                  msg.sources &&
                  msg.sources.length > 0 && <SourceAttribution sources={msg.sources} />}
              </div>
            ))}
            {/* Follow-up suggestions */}
            <SuggestedQuestions
              questions={suggestions}
              onSelect={handleSuggestionSelect}
              isVisible={!isStreaming && suggestions.length > 0}
            />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--error)',
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Input area */}
      <div
        style={{
          padding: 'var(--spacing-md) 0 var(--spacing-lg)',
          borderTop: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <div className="flex gap-sm" style={{ alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              pinnedDocId
                ? `Ask about ${pinnedDoc?.filename || 'this document'}...`
                : 'Ask about your documents, biases, decision patterns...'
            }
            rows={1}
            style={{
              flex: 1,
              padding: 'var(--spacing-sm) var(--spacing-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              resize: 'none',
              minHeight: '42px',
              maxHeight: '120px',
              lineHeight: 1.5,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={isStreaming || !input.trim()}
            className="btn btn-primary flex items-center gap-xs"
            style={{
              padding: '10px 16px',
              height: '42px',
            }}
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p
          className="text-muted"
          style={{
            fontSize: '11px',
            marginTop: '6px',
            textAlign: 'center',
          }}
        >
          {pinnedDocId
            ? "Responses are grounded in the pinned document's analysis."
            : 'Responses are grounded in your analysed documents via semantic search.'}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isBookmarked,
  onToggleBookmark,
  onRetry,
}: {
  message: ChatMessage;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onRetry?: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div
      className="message-container"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: 'var(--spacing-sm)',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          background: isUser ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-secondary)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          borderRadius: '2px',
          fontSize: '14px',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          position: 'relative',
        }}
      >
        {message.content}
        {message.isStreaming && !message.content && (
          <Loader2 size={14} className="animate-spin" style={{ opacity: 0.6 }} />
        )}
        {/* Message Actions — shown on hover via CSS */}
        {!message.isStreaming && message.content && (
          <MessageActions
            content={message.content}
            messageId={message.id}
            role={message.role}
            isBookmarked={isBookmarked}
            onToggleBookmark={onToggleBookmark}
            onRetry={onRetry}
          />
        )}
      </div>
      <style jsx>{`
        .message-container:hover :global(.message-actions) {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

// SourcesList replaced by SourceAttribution component
