'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Loader2, Trash2, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useChatStream, type ChatMessage, type ChatSource } from '@/hooks/useChatStream';

export default function ChatPage() {
    const { messages, isStreaming, error, sendMessage, clearMessages } = useChatStream();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

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
            </header>

            {/* Messages area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-md) 0',
                }}
            >
                {messages.length === 0 ? (
                    <EmptyState />
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
                        placeholder="Ask about your documents, biases, decision patterns..."
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
                    Responses are grounded in your analysed documents via semantic search.
                </p>
            </div>
        </div>
    );
}

function EmptyState() {
    const suggestions = [
        'What cognitive biases appear most often in my documents?',
        'Summarise the riskiest decisions I\'ve analysed',
        'Which documents had the lowest decision quality scores?',
        'What patterns do you see across my analyses?',
    ];

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
                    Ask anything about your documents
                </h2>
                <p
                    className="text-muted"
                    style={{ fontSize: '13px', lineHeight: 1.6 }}
                >
                    This chat uses semantic search to find relevant document
                    analyses and provides grounded answers with source citations.
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
                        // Suggestions are inert when streaming
                        onClick={() => {
                            const input = document.querySelector(
                                'textarea'
                            ) as HTMLTextAreaElement | null;
                            if (input) {
                                // Use native setter to trigger React onChange
                                const nativeSet = Object.getOwnPropertyDescriptor(
                                    HTMLTextAreaElement.prototype,
                                    'value'
                                )?.set;
                                nativeSet?.call(input, s);
                                input.dispatchEvent(
                                    new Event('input', { bubbles: true })
                                );
                                input.focus();
                            }
                        }}
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
                        href={`/documents/${src.documentId}`}
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
                            {Math.round(src.similarity * 100)}% match
                        </span>
                        <ArrowRight size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                    </Link>
                ))}
            </div>
        </div>
    );
}
