'use client';

/**
 * ValuationHackTool — interactive surface for Sharran's Valuation Hack
 * mechanic ($50M → $75M, "what 5 things would I have to do to lift the
 * valuation by 50%?"), specialized for Decision Intel's pre-revenue +
 * advisor-driven context.
 *
 * Item locked 2026-05-07 from the Q4 master KB synthesis. The KB
 * confirmed advisors (Mr. Reiner / Mr. Gabe / Big-4 governance partner)
 * can be valuable proxies for procurement / acquisition committees, but
 * ONLY with two specific prompt templates + counter-pattern guardrails.
 *
 * Tool shape:
 *   1. Two pre-built prompts (Path-to-Benchmark Up-Sell + Zero-Value
 *      Subtraction) with copy-to-clipboard buttons.
 *   2. Three KB-derived guardrails (VC scale-default trap, consulting
 *      dismissal trap, enterprise-buyer filter rule).
 *   3. Capture surface for the advisor's "5 things" answer with a
 *      checkbox per item — adopt only when the advisor explained WHY a
 *      specific enterprise buyer would pay a premium.
 *
 * Anchor: id="valuation_hack" — referenced from
 * SharranOperatingPrinciples principle #3 CTA.
 */

import { useState } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck, MessageSquare } from 'lucide-react';
import {
  VALUATION_HACK_PROMPTS,
  VALUATION_HACK_GUARDRAILS,
  type ValuationHackPrompt,
} from './data/sharran-principles';

export function ValuationHackTool() {
  const [activePromptId, setActivePromptId] =
    useState<ValuationHackPrompt['id']>('path_to_benchmark');

  const activePrompt = VALUATION_HACK_PROMPTS.find(p => p.id === activePromptId);

  return (
    <div id="valuation_hack" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Prompt picker tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 4,
        }}
      >
        {VALUATION_HACK_PROMPTS.map(p => {
          const active = p.id === activePromptId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePromptId(p.id)}
              style={{
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                marginBottom: -1,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
                letterSpacing: '-0.005em',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {activePrompt && <PromptCard prompt={activePrompt} />}

      <GuardrailsBlock />

      <CaptureSurface promptId={activePromptId} />
    </div>
  );
}

/* ───────── Prompt card ───────── */

function PromptCard({ prompt }: { prompt: ValuationHackPrompt }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptTemplate);
      setCopied(true);
      // The reset is fire-and-forget — render is unaffected if it fails.
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API blocked — silent fallback (the template stays
      // visible in the textarea for manual copy).
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--accent-primary)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginBottom: 6,
            }}
          >
            <MessageSquare size={11} strokeWidth={2.5} aria-hidden />
            When to use
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-primary)' }}>
            {prompt.whenToUse}
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy prompt to clipboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: copied ? 'var(--success)' : 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s ease',
          }}
        >
          {copied ? (
            <>
              <Check size={13} strokeWidth={2.5} /> Copied
            </>
          ) : (
            <>
              <Copy size={13} strokeWidth={2.25} /> Copy prompt
            </>
          )}
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm, 6px)',
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
          fontSize: 12.5,
          lineHeight: 1.65,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {prompt.promptTemplate}
      </pre>

      <div style={{ marginTop: 10 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}
        >
          What this extracts
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
          {prompt.expectedSignal}
        </div>
      </div>
    </div>
  );
}

/* ───────── Guardrails block ───────── */

function GuardrailsBlock() {
  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--warning) 6%, transparent)',
        border: '1px solid color-mix(in srgb, var(--warning) 25%, var(--border-color))',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
          color: 'var(--warning)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <AlertTriangle size={12} strokeWidth={2.5} aria-hidden />
        Counter-pattern guardrails
      </div>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--text-primary)',
        }}
      >
        Per the master KB Q4 synthesis: the Valuation Hack works with advisors only when the
        following three traps are filtered out. If the advisor&apos;s &quot;5 things&quot; answer
        triggers ANY of these, REJECT — don&apos;t fold it into the Q3-Q4 sprint plan.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {VALUATION_HACK_GUARDRAILS.map(g => (
          <div
            key={g.id}
            style={{
              padding: '10px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 3,
              }}
            >
              {g.label}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {g.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Capture surface ───────── */

interface CapturedItem {
  id: string;
  text: string;
  enterpriseBuyerWhy: string;
  /** True only when the advisor explained WHY a specific enterprise buyer
   *  would pay a premium. The whole point of the filter rule. */
  filterPassed: boolean;
}

function CaptureSurface({ promptId }: { promptId: ValuationHackPrompt['id'] }) {
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [draftText, setDraftText] = useState('');
  const [draftWhy, setDraftWhy] = useState('');

  const addItem = () => {
    if (!draftText.trim()) return;
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        text: draftText.trim(),
        enterpriseBuyerWhy: draftWhy.trim(),
        filterPassed: draftWhy.trim().length > 0,
      },
    ]);
    setDraftText('');
    setDraftWhy('');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const promotedCount = items.filter(i => i.filterPassed).length;
  const labelByPrompt =
    promptId === 'path_to_benchmark'
      ? 'Capture the advisor\'s "5 things to lift the valuation"'
      : 'Capture the 3 features an enterprise buyer would assign zero value to';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
          color: 'var(--accent-primary)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <ShieldCheck size={12} strokeWidth={2.5} aria-hidden />
        {labelByPrompt}
      </div>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 12.5,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
        }}
      >
        Each item only counts if the advisor explained{' '}
        <strong>WHY a specific enterprise buyer</strong> (Audit Committee Chair / F500 GC / Big-4
        acquirer) would pay a premium for it. Items without an enterprise-buyer rationale are
        recorded but flagged amber.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <input
          type="text"
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          placeholder="Item the advisor named (e.g., per-org Brier ≥ 0.20 across 5 closed outcomes)"
          style={{
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 13,
            color: 'var(--text-primary)',
          }}
        />
        <input
          type="text"
          value={draftWhy}
          onChange={e => setDraftWhy(e.target.value)}
          placeholder="WHY a specific enterprise buyer pays a premium (leave blank if no rationale → amber flag)"
          style={{
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 13,
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!draftText.trim()}
          style={{
            padding: '8px 14px',
            background: draftText.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: draftText.trim() ? '#fff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: draftText.trim() ? 'pointer' : 'not-allowed',
            justifySelf: 'flex-start',
          }}
        >
          Add item
        </button>
      </div>

      {items.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Captured · {items.length} item{items.length !== 1 ? 's' : ''} · {promotedCount} pass the
            enterprise-buyer filter
          </div>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                padding: '10px 12px',
                background: item.filterPassed
                  ? 'color-mix(in srgb, var(--success) 8%, transparent)'
                  : 'color-mix(in srgb, var(--warning) 8%, transparent)',
                border: `1px solid ${item.filterPassed ? 'color-mix(in srgb, var(--success) 30%, var(--border-color))' : 'color-mix(in srgb, var(--warning) 30%, var(--border-color))'}`,
                borderRadius: 'var(--radius-sm, 6px)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  {item.text}
                </div>
                {item.enterpriseBuyerWhy ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    Why an enterprise buyer pays for it: {item.enterpriseBuyerWhy}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--warning)',
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}
                  >
                    No enterprise-buyer rationale — capture but don&apos;t adopt until the advisor
                    re-frames against a specific F500 buyer pain.
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 6px',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
