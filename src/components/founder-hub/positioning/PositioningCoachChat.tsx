'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { REHEARSAL_PROMPTS } from '@/lib/data/positioning-copilot';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';

// Drift-safe canonical counts for the Coach AI system prompt. If the
// framework registry or case-study corpus grows, the Copilot's coaching
// language stays in sync without a copy edit.
const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const PRESET_QUESTIONS = [
  'Roleplay a skeptical CSO. Ask me the 3 hardest questions about category, moat, and proof.',
  'Audit my positioning vocabulary against what I wrote in CLAUDE.md. Flag anything I drift on.',
  'Write me a cold-email opener for a CSO who lost sleep over a board meeting this quarter.',
  "Drill me on the Kodak hook — how do I open if the prospect hasn't heard of Decision Intel?",
  'What is my weakest Sharp step right now, and the single action to fix it this week?',
  'Turn the Four Moments into a 30-second spoken elevator pitch. No jargon, no hedge words.',
];

const STORAGE_KEY = 'positioning-copilot-chat';

function loadStoredMessages(): ChatMsg[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m: unknown): m is ChatMsg =>
        typeof m === 'object' &&
        m !== null &&
        (m as ChatMsg).role !== undefined &&
        typeof (m as ChatMsg).content === 'string'
    );
  } catch {
    return [];
  }
}

const COACH_PREAMBLE =
  `You are my Positioning Copilot. Always ground your answer in: (1) my locked CLAUDE.md positioning — primary hero "the native reasoning layer for every high-stakes call," secondary "the reasoning layer the Fortune 500 needs before regulators start asking," Recognition-Rigor Framework (R²F) as the IP moat, Decision Quality Index (DQI) as the scoring artefact, Decision Provenance Record (DPR — hashed + tamper-evident) as the regulator-grade output, Pan-African anchor (WeWork S-1 + Dangote DPR specimens, ${FRAMEWORK_COUNT} frameworks across G7/EU/GCC/African markets), broad audience (corporate strategy + corp dev + funds — NOT F500-board-narrow); (2) Byron Sharp's 8-step brand spine; (3) the 6 "Market Worth Entering" questions; (4) the Strategic Thinking compass; (5) the 16-slide ideal pitch deck structure. NEVER use "decision intelligence platform" as a category claim (Gartner-crowded — banned per CLAUDE.md). NEVER use "decision hygiene" — that's Kahneman's 2021 Noise term, borrowing it cedes category vocabulary. In cold contexts use descriptive language ("60-second audit on a strategic memo," "pre-IC audit layer," "strategic memo audits"); in warm contexts use the locked vocabulary above. Answer like a CSO advisor who has read all ${HISTORICAL_CASE_COUNT} case studies. Push back if I hedge. Never generic. Now:\n\n`;

export function PositioningCoachChat({ founderPass }: { founderPass: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    setMessages(loadStoredMessages());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    } catch {
      // localStorage may throw on quota / private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streaming]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;
      const userMsg = text.trim();
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setStreaming(true);

      try {
        const res = await fetch('/api/founder-hub/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-pass': founderPass,
          },
          body: JSON.stringify({
            message: COACH_PREAMBLE + userMsg,
            history: messages.slice(-20),
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          const errMsg = errBody?.error || res.statusText || 'Failed to connect';
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
          setStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let assistantContent = '';
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'chunk' && data.text) {
                  assistantContent += data.text;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                    return updated;
                  });
                }
              } catch {
                // Malformed SSE line — skip silently per CLAUDE.md fire-and-forget exceptions (JSON.parse fallback).
              }
            }
          }
        } finally {
          reader.cancel();
        }
      } catch (err) {
        console.warn('positioning coach chat error:', err);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Connection error. Please try again.' },
        ]);
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, founderPass]
  );

  const clear = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  };

  const showPresets = messages.length === 0;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 420,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} style={{ color: '#16A34A' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Positioning Coach
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
              Grounded in CLAUDE.md + Sharp + Market Thesis + Pitch Deck + Compass
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            style={{
              padding: '4px 10px',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 280,
          maxHeight: 480,
        }}
      >
        {showPresets ? (
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              Start here
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PRESET_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                >
                  {q}
                </button>
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                padding: 10,
                background: 'rgba(22, 163, 74, 0.06)',
                borderLeft: '2px solid #16A34A',
                borderRadius: 4,
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#16A34A',
                  marginBottom: 4,
                }}
              >
                Before every outreach call
              </div>
              Rehearse these six one-liners:
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                {REHEARSAL_PROMPTS.slice(0, 3).map((p, i) => (
                  <li key={i} style={{ marginTop: 3 }}>
                    {p.replace(/^1-line [^:]+: /, '')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '86%',
                padding: '8px 12px',
                background: msg.role === 'user' ? '#16A34A' : 'var(--bg-secondary)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                borderRadius: 8,
                borderBottomRightRadius: msg.role === 'user' ? 2 : 8,
                borderBottomLeftRadius: msg.role === 'user' ? 8 : 2,
                fontSize: 12,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {msg.content || (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              )}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div
        style={{
          padding: 10,
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask your coach anything — positioning, outreach, pitch rehearsal..."
          disabled={streaming}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 12,
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            outline: 'none',
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          style={{
            padding: '0 14px',
            background: streaming || !input.trim() ? 'var(--bg-secondary)' : '#16A34A',
            color: streaming || !input.trim() ? 'var(--text-muted)' : '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {streaming ? (
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
