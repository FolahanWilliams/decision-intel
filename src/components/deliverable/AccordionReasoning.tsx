/**
 * AccordionReasoning — progressive disclosure for hierarchical
 * reasoning steps. Locked 2026-05-20 from DR §4 (executive sees
 * final conclusion, analyst manually expands to trace pipeline).
 *
 * Used inside ProgressiveDrawer body for showing:
 *   - The multi-step reasoning chain behind a flagged bias
 *   - The detection logic for a named compound pattern
 *   - The reference-class lookup that produced a forgotten question
 *
 * Each row is a collapsible step. Closed by default — the executive
 * view stays clean. Click expands the row body inline.
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export interface ReasoningStep {
  id: string;
  /** Short label (e.g. "Step 1 — Pattern Detection"). */
  label: string;
  /** Optional secondary chip (e.g. severity, source, model used). */
  meta?: string;
  /** Expandable body — verbatim quotes, longer explanations. */
  content: ReactNode;
}

interface AccordionReasoningProps {
  steps: ReasoningStep[];
  /** When true, the first step renders expanded by default. */
  defaultOpenFirst?: boolean;
}

export function AccordionReasoning({ steps, defaultOpenFirst = false }: AccordionReasoningProps) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(defaultOpenFirst && steps[0] ? [steps[0].id] : [])
  );

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (steps.length === 0) return null;

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {steps.map((step, idx) => {
        const isOpen = open.has(step.id);
        return (
          <li
            key={step.id}
            style={{
              borderBottom:
                idx === steps.length - 1 ? 'none' : '1px solid var(--border-color, #E2E8F0)',
            }}
          >
            <button
              type="button"
              onClick={() => toggle(step.id)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-muted, #64748B)',
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 180ms',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text-primary, #0F172A)',
                  flex: 1,
                  minWidth: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {step.label}
              </span>
              {step.meta ? (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #64748B)',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {step.meta}
                </span>
              ) : null}
            </button>
            {isOpen ? (
              <div
                style={{
                  paddingLeft: 24,
                  paddingBottom: 14,
                  fontSize: 13,
                  color: 'var(--text-secondary, #475569)',
                  lineHeight: 1.6,
                }}
              >
                {step.content}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
