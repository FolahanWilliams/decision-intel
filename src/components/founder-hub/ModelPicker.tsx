'use client';

/**
 * ModelPicker — small dropdown next to the persona picker in the
 * Founder Hub chat header. Lets the founder switch between Grok 4.3
 * (default), Gemini 3 Flash, and DeepSeek V4 Pro.
 *
 * Selection persists in localStorage so it survives page reloads.
 * The widget passes the modelId to the chat API which validates it
 * against the registry allowlist and routes to the matching gateway
 * slug. Per-call model choice is a personal preference for the
 * single-user founder chat — model variation doesn't cascade across
 * customers.
 *
 * Visual pattern mirrors the persona picker (segmented dropdown
 * below the header) so the chat header stays consistent.
 */

import { ChevronDown, Cpu } from 'lucide-react';
import { FOUNDER_CHAT_MODELS, type FounderChatModel } from '@/lib/ai/founder-chat-models';

interface Props {
  activeModelId: string;
  open: boolean;
  onToggleOpen: (next: boolean) => void;
  /** Color borrowed from the active persona so the picker visually
   *  ties into the persona selection rather than fighting with it. */
  accentColor: string;
}

// The picker button itself only opens/closes the dropdown — selection
// is handled by ModelPickerPanel below. Earlier the `onChange` prop
// was passed in here too but never wired (button doesn't fire it),
// which produced an "unused parameter" warning. Removed 2026-05-06.
export function ModelPicker({ activeModelId, open, onToggleOpen, accentColor }: Props) {
  const active: FounderChatModel =
    FOUNDER_CHAT_MODELS.find(m => m.id === activeModelId) ?? FOUNDER_CHAT_MODELS[0];

  return (
    <>
      <button
        type="button"
        onClick={() => onToggleOpen(!open)}
        title={`Model: ${active.label} (${active.provider}). Click to switch.`}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-secondary)',
          background: 'var(--bg-tertiary, #0a0a0a)',
          border: `1px solid var(--border-primary, #333)`,
          padding: '2px 6px 2px 8px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        <Cpu size={11} style={{ color: accentColor, flexShrink: 0 }} />
        {active.label}
        <ChevronDown
          size={11}
          style={{
            transition: 'transform 120ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
    </>
  );
}

/**
 * Dropdown panel — rendered separately from the trigger button so the
 * widget can mount it below the header in the same flow as the persona
 * picker panel. Keeps the chat shell layout consistent.
 */
export function ModelPickerPanel({
  activeModelId,
  onChange,
  onClose,
}: {
  activeModelId: string;
  onChange: (modelId: string) => void;
  onClose: () => void;
}) {
  const available = FOUNDER_CHAT_MODELS.filter(m => m.available);

  return (
    <div
      role="listbox"
      aria-label="Switch model"
      style={{
        borderBottom: '1px solid var(--border-primary, #333)',
        background: 'var(--bg-tertiary, #0a0a0a)',
        padding: '8px 10px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxHeight: 280,
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
        Model · same persona, different brain
      </div>
      {available.map(m => {
        const active = m.id === activeModelId;
        return (
          <button
            key={m.id}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => {
              onChange(m.id);
              onClose();
            }}
            title={m.description}
            style={{
              textAlign: 'left',
              background: active ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
              border: `1px solid ${active ? 'rgba(22, 163, 74, 0.35)' : 'var(--border-primary, #333)'}`,
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
              <Cpu size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary, #111)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  marginLeft: 'auto',
                }}
              >
                {m.provider}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              {m.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
