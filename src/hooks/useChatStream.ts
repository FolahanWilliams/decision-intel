'use client';

import { useState, useRef, useCallback } from 'react';
import { SSEReader } from '@/lib/sse';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: ChatSource[];
    isStreaming?: boolean;
}

export interface ChatSource {
    documentId: string;
    filename: string;
    similarity: number;
    score: number;
}

interface UseChatStreamReturn {
    messages: ChatMessage[];
    isStreaming: boolean;
    error: string | null;
    sendMessage: (text: string) => Promise<void>;
    clearMessages: () => void;
}

let messageCounter = 0;
function nextId(): string {
    return `msg-${Date.now()}-${++messageCounter}`;
}

export function useChatStream(): UseChatStreamReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isStreaming) return;

        setError(null);

        const userMsg: ChatMessage = { id: nextId(), role: 'user', content: trimmed };
        const assistantMsg: ChatMessage = {
            id: nextId(),
            role: 'assistant',
            content: '',
            sources: [],
            isStreaming: true,
        };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setIsStreaming(true);

        // Build history from existing messages (exclude the new ones)
        const history = messages
            .filter((m) => !m.isStreaming)
            .map((m) => ({ role: m.role, content: m.content }));

        abortRef.current = new AbortController();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, history }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Chat failed (${res.status})`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response stream');

            const decoder = new TextDecoder();
            const sseReader = new SSEReader();
            let accumulated = '';
            let sources: ChatSource[] = [];

            const processEvent = (data: unknown) => {
                const event = data as Record<string, unknown>;
                if (event.type === 'sources') {
                    sources = (event.sources as ChatSource[]) || [];
                } else if (event.type === 'chunk') {
                    accumulated += event.text as string;
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsg.id
                                ? { ...m, content: accumulated, sources, isStreaming: true }
                                : m
                        )
                    );
                } else if (event.type === 'done') {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsg.id
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

            // Ensure streaming flag is cleared
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
                )
            );
        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            const message = err instanceof Error ? err.message : 'Chat failed';
            setError(message);
            // Remove the empty assistant message on failure
            setMessages((prev) =>
                prev.filter((m) => m.id !== assistantMsg.id || m.content.length > 0)
            );
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    }, [isStreaming, messages]);

    const clearMessages = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        setMessages([]);
        setError(null);
        setIsStreaming(false);
    }, []);

    return { messages, isStreaming, error, sendMessage, clearMessages };
}
