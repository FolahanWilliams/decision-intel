'use client';

/**
 * Pre-submit redaction prompt (3.2).
 *
 * Renders a modal that lists every PII-ish token the scanner found in
 * the pasted memo, grouped by category, with a checkbox per group plus
 * a fold-out per-hit table. The user can:
 *   - "Redact selected" → applies placeholders, returns new text
 *   - "Continue without redacting" → escape hatch
 *   - "Cancel" → close, take no action
 *
 * The actual scanning happens in src/lib/utils/redaction-scanner.ts;
 * this component is purely the UX gate.
 */

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Check, ChevronDown, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  applyRedactions,
  REDACTION_CATEGORY_LABEL,
  type RedactionCategory,
  type RedactionHit,
  type ScanResult,
} from '@/lib/utils/redaction-scanner';
import {
  sha256Hex,
  type PlaceholderMapEntry,
  type RedactionTrailPayload,
} from '@/lib/utils/redaction-trail';

/**
 * Trail context emitted to parent on Redact/Skip — the parent attaches
 * the analysisId post-submission and POSTs to /api/redaction/log.
 * Originals NEVER appear here (only on the placeholder map, which the
 * parent stores in sessionStorage).
 */
export interface RedactionTrailContext extends Omit<
  RedactionTrailPayload,
  'analysisId' | 'source'
> {
  /** Client-only — passed to savePlaceholderMap once analysisId is known. */
  placeholderEntries: PlaceholderMapEntry[];
}

interface Props {
  isOpen: boolean;
  /** Original memo text (will be redacted in-place). */
  text: string;
  /** Result from scanForPii(text). */
  scan: ScanResult;
  /** User clicked "Redact selected" — receives the redacted text + trail. */
  onRedact: (redactedText: string, trail: RedactionTrailContext) => void;
  /** User clicked "Continue without redacting" — original text passes through. */
  onSkip: (trail: RedactionTrailContext) => void;
  /** User dismissed the modal; no submission action should run. */
  onCancel: () => void;
}

const CATEGORY_ORDER: RedactionCategory[] = ['ssn', 'email', 'phone', 'amount', 'entity', 'name'];

const CATEGORY_HEX: Record<RedactionCategory, string> = {
  ssn: '#7F1D1D',
  email: '#2563EB',
  phone: '#2563EB',
  amount: '#D97706',
  entity: '#7C3AED',
  name: '#16A34A',
};

// Plain-language sub-labels so a stranger pasting their first memo can
// recognise the category without parsing the example placeholder.
const CATEGORY_SUB: Record<RedactionCategory, string> = {
  ssn: 'Government IDs — replaced with [SSN_N]',
  email: 'Email addresses — replaced with [EMAIL_N]',
  phone: 'Phone numbers — replaced with [PHONE_N]',
  amount: 'Currency + financial totals — replaced with [AMOUNT_N]',
  entity: 'Company + organisation names — replaced with [ENTITY_N]',
  name: 'Person names — replaced with [NAME_N]',
};

export function RedactionPreModal({ isOpen, text, scan, onRedact, onSkip, onCancel }: Props) {
  // Hit-level toggle; user can deselect false positives (especially names).
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [expandedCat, setExpandedCat] = useState<RedactionCategory | null>(null);
  // Guards a double-click double-submit: the handlers await SHA-256 hashing,
  // leaving a window where a second click fires a second audit — the 2nd then
  // trips the 1-audit-per-IP-per-day limit and shows a confusing 429 AFTER the
  // 1st already succeeded.
  const [submitting, setSubmitting] = useState(false);

  // Reset selection state every time the modal re-opens. Deferred via a
  // microtask-scheduled timeout so react-hooks/set-state-in-effect doesn't
  // flag the synchronous setState (matches the FirstRunInlineWalkthrough
  // pattern; the cascading-render risk is real on a React-19 strict mode
  // pass even though this effect's only trigger is the open prop).
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      setExcluded(new Set());
      setExpandedCat(null);
      setSubmitting(false);
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  const hitKey = (h: RedactionHit) => `${h.category}:${h.start}:${h.end}`;

  const toggleHit = (h: RedactionHit) => {
    setExcluded(prev => {
      const next = new Set(prev);
      const k = hitKey(h);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const toggleCategory = (cat: RedactionCategory) => {
    setExcluded(prev => {
      const next = new Set(prev);
      const catHits = scan.hits.filter(h => h.category === cat);
      const allExcluded = catHits.every(h => next.has(hitKey(h)));
      if (allExcluded) {
        for (const h of catHits) next.delete(hitKey(h));
      } else {
        for (const h of catHits) next.add(hitKey(h));
      }
      return next;
    });
  };

  const selected = useMemo(
    () => scan.hits.filter(h => !excluded.has(hitKey(h))),
    [scan.hits, excluded]
  );

  const buildCounts = (
    hits: ReturnType<typeof Array.from> & RedactionHit[]
  ): Record<RedactionCategory, number> => {
    const c: Record<RedactionCategory, number> = {
      email: 0,
      phone: 0,
      ssn: 0,
      amount: 0,
      entity: 0,
      name: 0,
    };
    for (const h of hits) c[h.category] += 1;
    return c;
  };

  const handleRedact = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { redactedText, placeholderMap } = applyRedactions(text, selected);
    const placeholderEntries: PlaceholderMapEntry[] = Object.entries(placeholderMap).map(
      ([placeholder, original]) => {
        // Recover category from the placeholder prefix ([NAME_..] → 'name').
        const m = placeholder.match(/^\[([A-Z]+)_/);
        const prefix = (m?.[1] || '').toLowerCase();
        const category =
          prefix === 'name'
            ? ('name' as RedactionCategory)
            : prefix === 'amount'
              ? ('amount' as RedactionCategory)
              : prefix === 'entity'
                ? ('entity' as RedactionCategory)
                : prefix === 'email'
                  ? ('email' as RedactionCategory)
                  : prefix === 'phone'
                    ? ('phone' as RedactionCategory)
                    : ('ssn' as RedactionCategory);
        return { placeholder, original, category };
      }
    );
    const [originalHash, submittedHash] = await Promise.all([
      sha256Hex(text),
      sha256Hex(redactedText),
    ]);
    const trail: RedactionTrailContext = {
      originalHash,
      submittedHash,
      detectedCounts: buildCounts(scan.hits as unknown as RedactionHit[]),
      redactedCounts: buildCounts(selected as unknown as RedactionHit[]),
      action: 'applied',
      placeholderCount: placeholderEntries.length,
      placeholderEntries,
    };
    onRedact(redactedText, trail);
  };

  const handleSkip = async () => {
    if (submitting) return;
    setSubmitting(true);
    const hash = await sha256Hex(text);
    const trail: RedactionTrailContext = {
      originalHash: hash,
      submittedHash: hash,
      detectedCounts: buildCounts(scan.hits as unknown as RedactionHit[]),
      redactedCounts: {
        email: 0,
        phone: 0,
        ssn: 0,
        amount: 0,
        entity: 0,
        name: 0,
      },
      action: 'skipped',
      placeholderCount: 0,
      placeholderEntries: [],
    };
    onSkip(trail);
  };

  const totalHits = scan.hits.length;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onCancel()}>
      <DialogContent
        className="w-full sm:max-w-[560px]"
        style={{
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: 0,
          borderRadius: 20,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
        }}
        showCloseButton
      >
        {/* Hero header — prominent shield in a green-tinted square, large
            title, plain-language subtitle. Replaces the prior dense
            inline title/paragraph pair. */}
        <DialogHeader style={{ padding: '24px 26px 0', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 22%, transparent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-hidden
            >
              <ShieldCheck size={22} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DialogTitle
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '-0.015em',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                Redact before audit?
              </DialogTitle>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  margin: '6px 0 0',
                  lineHeight: 1.55,
                }}
              >
                We scanned your paste for likely identifying details. Choose which to replace with
                stable placeholders before the audit runs.
              </p>
            </div>
          </div>

          {/* Trust strip — anchors the "on-device, nothing has left yet"
              promise so a procurement reader leans forward instead of
              closing the tab. */}
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 18%, transparent)',
              borderRadius: 10,
            }}
          >
            <Lock size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span
              style={{
                fontSize: 11.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              Heuristic scan ran on this device — your paste has not left the browser yet. Uncheck
              any false positive before you submit.
            </span>
          </div>
        </DialogHeader>

        {/* Category list — fuller rows with a coloured severity rail, a
            category label, a plain-language sub-label, a count chip, and
            a chevron that expands the per-hit list inline. */}
        <div
          style={{
            padding: '18px 26px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {CATEGORY_ORDER.map(cat => {
            const count = scan.counts[cat];
            if (count === 0) return null;
            const catHits = scan.hits.filter(h => h.category === cat);
            const allExcluded = catHits.every(h => excluded.has(hitKey(h)));
            const someExcluded =
              catHits.some(h => excluded.has(hitKey(h))) &&
              !catHits.every(h => excluded.has(hitKey(h)));
            const expanded = expandedCat === cat;
            const colour = CATEGORY_HEX[cat];

            return (
              <div
                key={cat}
                style={{
                  border: `1px solid ${
                    allExcluded
                      ? 'var(--border-color)'
                      : `color-mix(in srgb, ${colour} 22%, transparent)`
                  }`,
                  borderRadius: 14,
                  background: 'var(--bg-primary)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: allExcluded
                    ? 'none'
                    : `inset 4px 0 0 0 ${colour}, 0 1px 2px rgba(15, 23, 42, 0.03)`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                  }}
                >
                  <button
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={!allExcluded}
                    aria-label={`Toggle redaction for ${REDACTION_CATEGORY_LABEL[cat]}`}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: `1.5px solid ${allExcluded ? 'var(--border-color)' : colour}`,
                      background: allExcluded
                        ? 'transparent'
                        : someExcluded
                          ? `color-mix(in srgb, ${colour} 50%, transparent)`
                          : colour,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.2s, border-color 0.2s',
                    }}
                  >
                    {!allExcluded && (
                      <Check size={13} strokeWidth={2.6} style={{ color: 'white' }} />
                    )}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {REDACTION_CATEGORY_LABEL[cat]}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: colour,
                          background: `color-mix(in srgb, ${colour} 10%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${colour} 22%, transparent)`,
                          padding: '1px 7px',
                          borderRadius: 999,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-muted)',
                        marginTop: 3,
                        lineHeight: 1.4,
                      }}
                    >
                      {CATEGORY_SUB[cat]}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedCat(expanded ? null : cat)}
                    aria-label={expanded ? 'Hide detected items' : 'Review detected items'}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 999,
                      padding: '6px 11px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      flexShrink: 0,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    {expanded ? 'Hide' : 'Review'}
                    <ChevronDown
                      size={12}
                      style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>
                </div>

                {expanded && (
                  <div
                    style={{
                      padding: '0 16px 14px 48px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      maxHeight: 240,
                      overflowY: 'auto',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: 10,
                      marginTop: -2,
                    }}
                  >
                    {catHits.map(h => {
                      const isExcluded = excluded.has(hitKey(h));
                      return (
                        <button
                          key={hitKey(h)}
                          onClick={() => toggleHit(h)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: 'transparent',
                            border: 'none',
                            padding: '6px 4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            borderRadius: 6,
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e =>
                            (e.currentTarget.style.background = 'var(--bg-secondary)')
                          }
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              border: `1.5px solid ${isExcluded ? 'var(--border-color)' : colour}`,
                              background: isExcluded ? 'transparent' : colour,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {!isExcluded && (
                              <Check size={11} strokeWidth={2.6} style={{ color: 'white' }} />
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: 12.5,
                              color: isExcluded ? 'var(--text-muted)' : 'var(--text-primary)',
                              fontFamily: 'var(--font-mono, monospace)',
                              textDecoration: isExcluded ? 'line-through' : 'none',
                              wordBreak: 'break-word',
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            {h.value}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {totalHits === 0 && (
            <div
              style={{
                padding: '20px 16px',
                fontSize: 13,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                background: 'var(--bg-primary)',
                border: '1px dashed var(--border-color)',
                borderRadius: 14,
              }}
            >
              No identifying tokens detected. Safe to submit.
            </div>
          )}
        </div>

        {/* Footer — single dominant primary action; skip-redaction is a
            quiet tertiary text link below; cancel lives in the X close
            button at top-right. Replaces the prior three-equal-buttons
            row where the visual hierarchy got lost. */}
        <div
          style={{
            marginTop: 20,
            padding: '16px 26px 22px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 500,
            }}
          >
            {totalHits === 0 ? (
              'Nothing flagged — safe to submit'
            ) : (
              <>
                <strong style={{ color: 'var(--text-primary)' }}>{selected.length}</strong>
                {' of '}
                <strong style={{ color: 'var(--text-primary)' }}>{totalHits}</strong>
                {' flagged '}
                {totalHits === 1 ? 'item' : 'items'} will be replaced with placeholders
              </>
            )}
          </div>

          {totalHits === 0 ? (
            <Button
              onClick={handleSkip}
              disabled={submitting}
              style={{
                width: '100%',
                background: 'var(--accent-primary)',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                padding: '12px 18px',
                borderRadius: 12,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Check size={15} strokeWidth={2.5} />
              Submit memo for audit
            </Button>
          ) : (
            <Button
              onClick={handleRedact}
              disabled={selected.length === 0 || submitting}
              style={{
                width: '100%',
                background: 'var(--accent-primary)',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                padding: '12px 18px',
                borderRadius: 12,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: selected.length === 0 || submitting ? 0.55 : 1,
              }}
            >
              <ShieldCheck size={15} strokeWidth={2.4} />
              Redact {selected.length} {selected.length === 1 ? 'item' : 'items'} and submit
            </Button>
          )}

          {totalHits > 0 && (
            <button
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 500,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 0',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                textDecorationColor: 'var(--border-color)',
                alignSelf: 'center',
              }}
            >
              Submit without redacting
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
