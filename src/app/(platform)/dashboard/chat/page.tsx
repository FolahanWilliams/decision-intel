'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Send, Loader2, Trash2, FileText, ArrowRight, Pin, PinOff, X } from 'lucide-react';
import Link from 'next/link';
import { useChatStream, type ChatMessage, type ChatSource } from '@/hooks/useChatStream';
import { useDocuments } from '@/hooks/useDocuments';

export default function ChatPage() {
    const { documents } = useDocuments(false, 1, 100);
    const [pinnedDocId, setPinnedDocId] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    const { messages, isStreaming, error, sendMessage, clearMessages } = useChatStream({
        pinnedDocumentId: pinnedDocId || undefined,
    });
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const pinnedDoc = useMemo(
        () => documents.find((d) => d.id === pinnedDocId),
        [documents, pinnedDocId]
    );

    const completeDocs = useMemo(
        () => documents.filter((d) => d.status === 'complete'),
        [documents]
    );

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Clear messages when pinned doc changes
    useEffect(() => {
        clearMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pinnedDocId]);

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
                    <MessageSquare size={24} style={{ color: 'var(--accent-primary)' }} />
                    <div>
                        <h1 style={{ fontSize: '18px', margin: 0 }}>Chat</h1>
                        <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
                            Ask questions about your analysed documents
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-sm">
                    {/* Pin document button */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowPicker(!showPicker)}
                            className="btn flex items-center gap-xs"
                            style={{
                                background: pinnedDocId ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                                border: `1px solid ${pinnedDocId ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                color: pinnedDocId ? 'var(--accent-primary)' : 'var(--text-muted)',
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
                                        onClick={() => { setPinnedDocId(null); setShowPicker(false); }}
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
                                {completeDocs.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => { setPinnedDocId(d.id); setShowPicker(false); }}
                                        className="flex items-center gap-sm"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            background: d.id === pinnedDocId ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {d.filename}
                                        </span>
                                        {d.id === pinnedDocId && <Pin size={12} style={{ color: 'var(--accent-primary)' }} />}
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
                        background: 'rgba(99, 102, 241, 0.06)',
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '12px',
                        flexShrink: 0,
                    }}
                >
                    <Pin size={12} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                        Chatting about{' '}
                        <Link href={`/documents/${pinnedDoc.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                            {pinnedDoc.filename}
                        </Link>
                    </span>
                    <button
                        onClick={() => setPinnedDocId(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto', display: 'flex', padding: '2px' }}
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
                    <EmptyState onSuggestionClick={setInput} isPinned={!!pinnedDocId} pinnedFilename={pinnedDoc?.filename} />
                ) : (
                    <div className="flex flex-col gap-md">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
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
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={pinnedDocId ? `Ask about ${pinnedDoc?.filename || 'this document'}...` : 'Ask about your documents, biases, decision patterns...'}
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
                        {isStreaming ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
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
                        ? 'Responses are grounded in the pinned document\'s analysis.'
                        : 'Responses are grounded in your analysed documents via semantic search.'}
                </p>
            </div>
        </div>
    );
}

function EmptyState({ onSuggestionClick, isPinned, pinnedFilename }: { onSuggestionClick: (text: string) => void; isPinned: boolean; pinnedFilename?: string }) {
    const globalSuggestions = [
        'What cognitive biases appear most often in my documents?',
        'Summarise the riskiest decisions I\'ve analysed',
        'Which documents had the lowest decision quality scores?',
        'What patterns do you see across my analyses?',
    ];

    const pinnedSuggestions = [
        `What are the main risks identified in this document?`,
        `What cognitive biases were found?`,
        `Summarise the key findings and recommendations`,
        `What is the decision quality score and why?`,
    ];

    const suggestions = isPinned ? pinnedSuggestions : globalSuggestions;

    return (
        <div
            className="flex flex-col items-center justify-center"
            style={{ height: '100%', gap: 'var(--spacing-lg)' }}
        >
            <MessageSquare
                size={48}
                style={{ color: 'var(--text-muted)', opacity: 0.5 }}
            />
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <h2
                    style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: 'var(--spacing-sm)',
                    }}
                >
                    {isPinned
                        ? `Ask about ${pinnedFilename || 'this document'}`
                        : 'Ask anything about your documents'}
                </h2>
                <p
                    className="text-muted"
                    style={{ fontSize: '13px', lineHeight: 1.6 }}
                >
                    {isPinned
                        ? 'All responses will be grounded in this specific document\'s analysis.'
                        : 'This chat uses semantic search to find relevant document analyses and provides grounded answers with source citations.'}
                </p>
            </div>
            <div
                className="flex flex-col gap-sm"
                style={{ width: '100%', maxWidth: 440 }}
            >
                {suggestions.map((s) => (
                    <button
                        key={s}
                        className="card"
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'border-color 0.15s',
                        }}
                        onClick={() => onSuggestionClick(s)}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: 'var(--spacing-sm)',
            }}
        >
            <div
                style={{
                    maxWidth: '85%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: isUser
                        ? 'var(--accent-primary)'
                        : 'var(--bg-secondary)',
                    color: isUser ? '#fff' : 'var(--text-primary)',
                    borderRadius: '2px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {message.content}
                {message.isStreaming && !message.content && (
                    <Loader2
                        size={14}
                        className="animate-spin"
                        style={{ opacity: 0.6 }}
                    />
                )}
                {/* Sources */}
                {!isUser &&
                    !message.isStreaming &&
                    message.sources &&
                    message.sources.length > 0 && (
                        <SourcesList sources={message.sources} />
                    )}
            </div>
        </div>
    );
}

function SourcesList({ sources }: { sources: ChatSource[] }) {
    return (
        <div
            style={{
                marginTop: 'var(--spacing-sm)',
                paddingTop: 'var(--spacing-sm)',
                borderTop: '1px solid var(--border-color)',
            }}
        >
            <p
                style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                Sources
            </p>
            <div className="flex flex-col gap-xs">
                {sources.map((src) => (
                    <Link
                        key={src.documentId}
                        href={`/documents/${src.documentId}?tab=overview`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: 'var(--accent-primary)',
                            textDecoration: 'none',
                        }}
                    >
                        <FileText size={12} />
                        <span>{src.filename}</span>
                        <span
                            className="text-muted"
                            style={{ fontSize: '11px' }}
                        >
                            {Math.round(src.similarity * 100)}% match · Score {src.score}/100
                        </span>
                        <ArrowRight size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                    </Link>
                ))}
            </div>
        </div>
    );
}
