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
import { ShieldAlert, Check, X, Eye, EyeOff } from 'lucide-react';
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
export interface RedactionTrailContext
  extends Omit<RedactionTrailPayload, 'analysisId' | 'source'> {
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

const CATEGORY_ORDER: RedactionCategory[] = [
  'ssn',
  'email',
  'phone',
  'amount',
  'entity',
  'name',
];

const CATEGORY_HEX: Record<RedactionCategory, string> = {
  ssn: '#7F1D1D',
  email: '#2563EB',
  phone: '#2563EB',
  amount: '#D97706',
  entity: '#7C3AED',
  name: '#16A34A',
};

export function RedactionPreModal({ isOpen, text, scan, onRedact, onSkip, onCancel }: Props) {
  // Hit-level toggle; user can deselect false positives (especially names).
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [expandedCat, setExpandedCat] = useState<RedactionCategory | null>(null);

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
        className="card w-full sm:max-w-lg"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontSize: 15,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ShieldAlert size={16} style={{ color: 'var(--accent-primary)' }} />
            Redact before audit?
          </DialogTitle>
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            We scanned your paste for likely identifying details. Pick which to
            replace with stable placeholders (e.g. <code>[NAME_1]</code>,
            <code> [AMOUNT_2]</code>). Heuristic only — uncheck any false hit.
          </p>
        </DialogHeader>

        <div
          style={{
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {CATEGORY_ORDER.map(cat => {
            const count = scan.counts[cat];
            if (count === 0) return null;
            const catHits = scan.hits.filter(h => h.category === cat);
            const allExcluded = catHits.every(h => excluded.has(hitKey(h)));
            const expanded = expandedCat === cat;
            const colour = CATEGORY_HEX[cat];

            return (
              <div
                key={cat}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                  }}
                >
                  <button
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={!allExcluded}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `1.5px solid ${allExcluded ? 'var(--border-color)' : colour}`,
                      background: allExcluded ? 'transparent' : colour,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {!allExcluded && <Check size={12} style={{ color: 'white' }} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {REDACTION_CATEGORY_LABEL[cat]}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 1,
                      }}
                    >
                      {count} detected
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedCat(expanded ? null : cat)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {expanded ? <EyeOff size={11} /> : <Eye size={11} />}
                    {expanded ? 'Hide' : 'Review'}
                  </button>
                </div>

                {expanded && (
                  <div
                    style={{
                      padding: '8px 12px 12px 38px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      borderTop: '1px solid var(--border-color)',
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
                            gap: 8,
                            background: 'transparent',
                            border: 'none',
                            padding: '4px 0',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              border: `1.5px solid ${isExcluded ? 'var(--border-color)' : colour}`,
                              background: isExcluded ? 'transparent' : colour,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {!isExcluded && <Check size={10} style={{ color: 'white' }} />}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: isExcluded ? 'var(--text-muted)' : 'var(--text-primary)',
                              fontFamily: 'var(--font-mono, monospace)',
                              textDecoration: isExcluded ? 'line-through' : 'none',
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
                padding: '16px',
                fontSize: 12.5,
                color: 'var(--text-muted)',
                textAlign: 'center',
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              No identifying tokens detected. Safe to submit.
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            {selected.length} of {totalHits} will be redacted
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="outline"
              onClick={onCancel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <X size={13} /> Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              style={{ fontSize: 12 }}
            >
              Continue without redacting
            </Button>
            <Button
              onClick={handleRedact}
              disabled={selected.length === 0}
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={13} />
              Redact &amp; submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
