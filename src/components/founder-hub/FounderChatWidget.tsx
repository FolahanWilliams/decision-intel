'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Brain,
  Compass,
  Landmark,
  MessageSquare,
  Paperclip,
  TrendingUp,
  X,
  FileText,
  Trash2,
  ArrowUpRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  detectNavTargets,
  extractNavMarkers,
  FOUNDER_HUB_NAVIGATE_EVENT,
  type TabNavTarget,
} from '@/lib/founder-hub/chat-nav';
import {
  THINKING_PARTNERS,
  getThinkingPartner,
  isThinkingPartnerId,
  type ThinkingPartnerId,
  type ThinkingPartner,
} from '@/lib/data/thinking-partners';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

/** Local storage key for persisting the chat across page loads. Scoped so
 *  the mentor conversation survives refresh, tab switches, and browser
 *  restarts — the mentor loses its value if every session starts cold. */
const STORAGE_KEY = 'founder-chat-messages';
/** Persisted active persona id. Independent from messages so the founder
 *  can switch personas mid-thread without losing context — the same memo
 *  gets challenged by Kahneman, then Porter, then a Sequoia partner. */
const PERSONA_STORAGE_KEY = 'founder-chat-persona';
const MAX_STORED_MESSAGES = 100;
const MAX_SENT_HISTORY = 30;

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx,.csv,.xlsx,.pptx,.html';

/** Resolve a persona's iconName slug to the actual Lucide component. Kept
 *  in the widget rather than the data file so the data stays serialisable. */
function PersonaIcon({
  name,
  size = 14,
  color,
}: {
  name: ThinkingPartner['iconName'];
  size?: number;
  color?: string;
}) {
  const style = { color: color ?? 'currentColor', flexShrink: 0 } as const;
  switch (name) {
    case 'Compass':
      return <Compass size={size} style={style} />;
    case 'Brain':
      return <Brain size={size} style={style} />;
    case 'TrendingUp':
      return <TrendingUp size={size} style={style} />;
    case 'Landmark':
      return <Landmark size={size} style={style} />;
  }
}

function loadStoredMessages(): ChatMsg[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m: unknown): m is ChatMsg =>
          typeof m === 'object' &&
          m !== null &&
          (m as ChatMsg).role !== undefined &&
          typeof (m as ChatMsg).content === 'string'
      )
      .slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function loadStoredPersonaId(): ThinkingPartnerId {
  if (typeof window === 'undefined') return 'default';
  try {
    const raw = localStorage.getItem(PERSONA_STORAGE_KEY);
    return isThinkingPartnerId(raw) ? raw : 'default';
  } catch {
    return 'default';
  }
}

interface FounderChatWidgetProps {
  founderPass: string;
  /**
   * `floating` (default) — historical positioning: fixed bubble bottom-right
   * that opens into a floating card. Kept for surfaces outside the Founder Hub.
   * `pane` — renders in-flow as a permanent right-rail panel. The host
   * controls width and sticky positioning via CSS; the widget drops its
   * fixed positioning and sizing and fills whatever container it is
   * placed in. No bubble / open-state — always expanded.
   */
  variant?: 'floating' | 'pane';
  /** Optional collapse handler exposed by the host; only used in `pane` mode. */
  onCollapse?: () => void;
}

export function FounderChatWidget({
  founderPass,
  variant = 'floating',
  onCollapse,
}: FounderChatWidgetProps) {
  const [open, setOpen] = useState(variant === 'pane');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  /** Active reasoning lens. Defaults to 'default' (the legacy decision
   *  coach) so first-load behavior is unchanged for existing users. */
  const [personaId, setPersonaId] = useState<ThinkingPartnerId>('default');
  const [personaPickerOpen, setPersonaPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);
  const personaHydrated = useRef(false);

  const activePersona = useMemo(() => getThinkingPartner(personaId), [personaId]);

  // External open trigger — the mobile-only "Ask AI" header button on the
  // Founder Hub dispatches this event because the floating bubble at
  // bottom-right can be hard to find on a 320-375px viewport (the back of
  // a cab, between meetings — the cold-context use cases the founder flagged).
  // (B5 lock 2026-04-28.)
  useEffect(() => {
    if (variant !== 'floating' || typeof window === 'undefined') return;
    const handler = () => setOpen(true);
    window.addEventListener('founder-chat-open', handler);
    return () => window.removeEventListener('founder-chat-open', handler);
  }, [variant]);

  // Hydrate from localStorage on mount so the conversation continues
  // across sessions. Only runs once; subsequent state changes go through
  // setMessages and the persistence effect below.
  useEffect(() => {
    setMessages(loadStoredMessages());
    hydrated.current = true;
    setPersonaId(loadStoredPersonaId());
    personaHydrated.current = true;
  }, []);

  // Persist every message change to localStorage. Skipped on the first
  // render so we don't overwrite the hydrated value with an empty array.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    } catch {
      // localStorage may throw on quota / private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions; chat continues in-memory.
    }
  }, [messages]);

  // Persist persona selection. Skipped on first render so we don't
  // overwrite the hydrated value with the initial 'default' state.
  useEffect(() => {
    if (!personaHydrated.current) return;
    try {
      localStorage.setItem(PERSONA_STORAGE_KEY, personaId);
    } catch {
      // localStorage may throw on quota / private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  }, [personaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for `founder-chat-ask` events dispatched from elsewhere in the
  // Founder Hub (Lesson Detail's "Ask the Hub AI" button, command palette
  // shortcuts, etc.). Mirrors the command-palette-export-board-report pattern
  // used on the document-detail page — keeps the chat widget decoupled from
  // the callers while still letting them open + prefill a question.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ question?: string }>).detail;
      if (!detail?.question) return;
      setOpen(true);
      setInput(detail.question);
    };
    window.addEventListener('founder-chat-ask', handler);
    return () => window.removeEventListener('founder-chat-ask', handler);
  }, []);

  const handleClear = useCallback(() => {
    if (streaming) return;
    const shouldClear =
      messages.length === 0
        ? true
        : window.confirm('Clear the whole conversation? The mentor loses all session memory.');
    if (shouldClear) {
      setMessages([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      }
    }
  }, [messages.length, streaming]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !attachedFile) || streaming) return;
    const userMsg = input.trim() || (attachedFile ? `Analyze this file: ${attachedFile.name}` : '');
    const file = attachedFile;
    setInput('');
    setAttachedFile(null);

    const displayMsg = file ? `📎 ${file.name}\n${userMsg}` : userMsg;
    setMessages(prev => [...prev, { role: 'user', content: displayMsg }]);
    setStreaming(true);

    try {
      let res: Response;

      if (file) {
        // Send as FormData when file is attached
        const formData = new FormData();
        formData.append('message', userMsg);
        formData.append('history', JSON.stringify(messages.slice(-MAX_SENT_HISTORY)));
        formData.append('file', file);
        formData.append('personaId', personaId);

        res = await fetch('/api/founder-hub/chat', {
          method: 'POST',
          headers: { 'x-founder-pass': founderPass },
          body: formData,
        });
      } else {
        res = await fetch('/api/founder-hub/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-pass': founderPass,
          },
          body: JSON.stringify({
            message: userMsg,
            history: messages.slice(-MAX_SENT_HISTORY),
            personaId,
          }),
        });
      }

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
      // Track which [[nav:tabId]] markers have already auto-fired for
      // this message so we don't double-dispatch when the marker re-
      // appears in the running buffer across chunks. Per-message set,
      // reset at the start of each new assistant reply.
      const firedNavMarkers = new Set<string>();
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk' && data.text) {
                assistantContent += data.text;
                // Strip any [[nav:tabId]] markers before rendering AND
                // auto-dispatch the first unseen valid marker so the
                // hub switches tabs in-flight. Navigation is single-
                // shot per message: the founder-hub-navigate handler
                // already guards against bad ids, and firedNavMarkers
                // guards against re-firing if the marker appears more
                // than once mid-stream.
                const { cleaned, tabIds } = extractNavMarkers(assistantContent);
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: cleaned };
                  return updated;
                });
                for (const tabId of tabIds) {
                  if (firedNavMarkers.has(tabId)) continue;
                  firedNavMarkers.add(tabId);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent(FOUNDER_HUB_NAVIGATE_EVENT, {
                        detail: { tabId },
                      })
                    );
                  }
                  // Only fire the first marker automatically — multiple
                  // nav markers per response mean the AI wanted to
                  // preview several tabs. The founder reads the reply,
                  // then clicks the suggestion chips for the rest.
                  break;
                }
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
      console.warn('[FounderChatWidget] handleSend failed:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, founderPass, attachedFile, personaId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'File too large. Maximum size is 10 MB.' },
        ]);
        return;
      }
      setAttachedFile(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  if (!open && variant === 'floating') {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: activePersona.color,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${activePersona.color}66`,
          zIndex: 50,
          fontSize: 22,
        }}
        title={`Ask the Founder AI · ${activePersona.label}`}
      >
        <MessageSquare size={22} />
      </button>
    );
  }

  const isPane = variant === 'pane';

  return (
    <div
      className={isPane ? undefined : 'founder-chat-floating-shell'}
      style={
        isPane
          ? {
              width: '100%',
              height: '100%',
              borderRadius: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }
          : {
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 'min(400px, calc(100vw - 32px))',
              height: 'min(520px, calc(100vh - 96px))',
              maxWidth: 400,
              maxHeight: 520,
              borderRadius: 16,
              background: 'var(--bg-secondary, #111)',
              border: '1px solid var(--border-primary, #333)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              zIndex: 50,
            }
      }
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-primary, #333)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `${activePersona.color}14`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <PersonaIcon name={activePersona.iconName} size={16} color={activePersona.color} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Founder AI
          </span>
          <button
            type="button"
            onClick={() => setPersonaPickerOpen(v => !v)}
            title="Switch reasoning lens"
            aria-haspopup="listbox"
            aria-expanded={personaPickerOpen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: activePersona.color,
              background: `${activePersona.color}1F`,
              border: `1px solid ${activePersona.color}40`,
              padding: '2px 6px 2px 8px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {activePersona.label}
            <ChevronDown
              size={11}
              style={{
                transition: 'transform 120ms',
                transform: personaPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <button
            onClick={handleClear}
            disabled={streaming || messages.length === 0}
            title="Clear conversation"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: streaming || messages.length === 0 ? 'default' : 'pointer',
              opacity: streaming || messages.length === 0 ? 0.4 : 1,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => {
              if (isPane) {
                onCollapse?.();
              } else {
                setOpen(false);
              }
            }}
            title={isPane ? 'Collapse pane' : 'Close'}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            &times;
          </button>
        </div>
      </div>

      {/* Persona picker — in-flow panel below the header so it works
          inside both the floating shell and the pane variant without
          escaping the chat container. Switching persona does NOT
          clear messages — the founder explicitly wants to challenge
          the same idea against multiple lenses in one thread. */}
      {personaPickerOpen && (
        <div
          role="listbox"
          aria-label="Switch reasoning lens"
          style={{
            borderBottom: '1px solid var(--border-primary, #333)',
            background: 'var(--bg-tertiary, #0a0a0a)',
            padding: '8px 10px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '2px 4px 4px',
            }}
          >
            Reasoning lens · same data, different voice
          </div>
          {THINKING_PARTNERS.map(p => {
            const active = p.id === personaId;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setPersonaId(p.id);
                  setPersonaPickerOpen(false);
                }}
                title={p.whenToUse}
                style={{
                  textAlign: 'left',
                  background: active ? `${p.color}14` : 'transparent',
                  border: `1px solid ${active ? `${p.color}55` : 'var(--border-primary, #333)'}`,
                  borderRadius: 10,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PersonaIcon name={p.iconName} size={14} color={p.color} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{p.label}</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.discipline}
                  </span>
                  {active && <Check size={12} style={{ color: p.color, flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {p.whatItIsFor}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    marginTop: 2,
                  }}
                >
                  {p.anchors.slice(0, 3).map(a => (
                    <span
                      key={a}
                      style={{
                        fontSize: 9,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: 'var(--bg-secondary, #111)',
                        border: '1px solid var(--border-primary, #333)',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a}
                    </span>
                  ))}
                  {p.anchors.length > 3 && (
                    <span
                      style={{
                        fontSize: 9,
                        padding: '1px 5px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      +{p.anchors.length - 3} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 10px',
              color: 'var(--text-muted)',
              fontSize: 12,
              lineHeight: 1.65,
            }}
          >
            <div style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
              {activePersona.fullName}
            </div>
            <div style={{ marginBottom: 4 }}>{activePersona.whatItIsFor}</div>
            <div
              style={{
                fontSize: 10,
                fontStyle: 'italic',
                color: 'var(--text-muted)',
                marginTop: 6,
              }}
            >
              Voice: {activePersona.voiceRule}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                justifyContent: 'center',
                marginTop: 12,
              }}
            >
              {activePersona.starterPrompts.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 12,
                    border: `1px solid ${activePersona.color}55`,
                    background: 'transparent',
                    color: activePersona.color,
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          // Suggest tab navigation for completed assistant messages that
          // reference another Founder Hub tab by name. Skipped while the
          // message is still streaming so chips don't flicker in/out as
          // tokens arrive; only shown once the message has settled.
          const isSettledAssistant =
            msg.role === 'assistant' &&
            msg.content.length > 0 &&
            !(streaming && i === messages.length - 1);
          const navTargets: TabNavTarget[] = isSettledAssistant
            ? detectNavTargets(msg.content, 3)
            : [];

          return (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background:
                    msg.role === 'user' ? activePersona.color : 'var(--bg-tertiary, #1a1a1a)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content || (streaming && i === messages.length - 1 ? '...' : '')}
              </div>
              {navTargets.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    paddingLeft: 2,
                  }}
                >
                  {navTargets.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (typeof window === 'undefined') return;
                        window.dispatchEvent(
                          new CustomEvent(FOUNDER_HUB_NAVIGATE_EVENT, {
                            detail: { tabId: t.id },
                          })
                        );
                      }}
                      title={`Open ${t.label} tab`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 9999,
                        border: '1px solid rgba(22,163,74,0.35)',
                        background: 'rgba(22,163,74,0.10)',
                        color: '#16A34A',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <ArrowUpRight size={10} />
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached file chip */}
      {attachedFile && (
        <div
          style={{
            padding: '4px 12px',
            borderTop: '1px solid var(--border-primary, #333)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <FileText size={12} style={{ color: '#16A34A', flexShrink: 0 }} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {attachedFile.name}
          </span>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            {(attachedFile.size / 1024).toFixed(0)}KB
          </span>
          <button
            onClick={() => setAttachedFile(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: attachedFile ? 'none' : '1px solid var(--border-primary, #333)',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          hidden
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={streaming}
          title="Attach a file (PDF, DOCX, PPTX, etc.)"
          style={{
            background: 'none',
            border: 'none',
            color: attachedFile ? '#16A34A' : 'var(--text-muted)',
            cursor: streaming ? 'wait' : 'pointer',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <Paperclip size={16} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={
            attachedFile
              ? 'What do you want me to audit in this file?'
              : 'Bring a decision, a pitch to rehearse, or a question…'
          }
          disabled={streaming}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--border-primary, #333)',
            background: 'var(--bg-tertiary, #0a0a0a)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={streaming || (!input.trim() && !attachedFile)}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            background:
              (input.trim() || attachedFile) && !streaming
                ? activePersona.color
                : 'var(--bg-tertiary, #1a1a1a)',
            color: (input.trim() || attachedFile) && !streaming ? '#fff' : 'var(--text-muted)',
            cursor: streaming ? 'wait' : 'pointer',
          }}
        >
          {streaming ? '...' : 'Send'}
        </button>
      </div>
      {/* Mobile fullscreen override: on narrow viewports the floating
          400×520 panel is too small for a real conversation and the
          bottom-right placement is hard to reach with one thumb. Below
          640px the floating shell takes the full viewport. (B5 lock
          2026-04-28.) */}
      <style jsx>{`
        @media (max-width: 640px) {
          :global(.founder-chat-floating-shell) {
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            max-width: none !important;
            max-height: none !important;
            border-radius: 0 !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
