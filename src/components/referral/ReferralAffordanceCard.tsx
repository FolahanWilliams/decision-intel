/**
 * ReferralAffordanceCard — peak-intent referral surface on the post-audit reveal.
 *
 * Founder rationale (locked 2026-05-19, follow-up to the access-amendment):
 * the whole reason non-wedge sign-ups are no longer waitlisted is that the
 * founder is "talking to so many people that are even just other founders.
 * I want to try it out, see what it's like, maybe even then recommend it to
 * people they know." Peak intent to refer is the moment right after the wow
 * (the post-audit reveal). This card operationalises that intent — without
 * it, the access change is "they can use it"; with it, the access change is
 * an actual referral engine.
 *
 * Two affordances, both copy-to-clipboard, both attribution-tracked:
 *  1. "Copy share link" — decision-intel.com root with ?ref={userId} so a
 *     future analytics pass can attribute conversion to the referrer.
 *  2. "Send them an example audit" — the public /demo so they can see what
 *     the audit looks like BEFORE signing up. Lower commitment than the
 *     full link, useful for the "I just tried this, look" message.
 *
 * Universal (HXC + non-wedge) — referral value is not persona-gated. The
 * access amendment lets non-wedge users IN; this card lets ANY user refer.
 *
 * Icon discipline: Share2 / Link / FileText / Check — NO Sparkles (banned
 * on conversion surfaces per the 2026-04-26 lock + the 2026-05-18 swap).
 */

'use client';

import { useState } from 'react';
import { Share2, Link as LinkIcon, FileText, Check, AlertCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

/**
 * Resilient clipboard copy with two fallbacks:
 *  1. navigator.clipboard.writeText (modern, requires secure context)
 *  2. document.execCommand('copy') via a temporary textarea (legacy fallback
 *     for incognito-tab edge cases, sandboxed iframes, and the rare browser
 *     where the Clipboard API resolves but silently writes nothing)
 * Returns 'clipboard' | 'execCommand' on success, 'failed' otherwise.
 *
 * Closes the 2026-05-20 bug where the silent catch on `navigator.clipboard`
 * meant the button gave ZERO feedback on failure — the founder's screenshot
 * showed "Copy share link" not working on the live /demo surface.
 */
async function copyToClipboard(text: string): Promise<'clipboard' | 'execCommand' | 'failed'> {
  if (typeof window === 'undefined') return 'failed';
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return 'clipboard';
    } catch {
      // canonical clipboard-failure exception class — fall through to the
      // execCommand fallback (the Clipboard API can fail on iframe-sandbox
      // origins / certain Safari incognito contexts even on HTTPS).
    }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.focus({ preventScroll: true });
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok ? 'execCommand' : 'failed';
  } catch {
    // canonical clipboard-failure exception class — execCommand also blocked
    return 'failed';
  }
}

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenSoft: '#F0FDF4',
};

const ORIGIN = 'https://www.decision-intel.com';

interface ReferralAffordanceCardProps {
  /** User id for referral attribution (becomes ?ref=). Omit on anonymous surfaces. */
  userId?: string | null;
  /** Analysis id (analytics breadcrumb only). */
  analysisId?: string | null;
  /** Where this card is mounted — analytics source label. */
  source: string;
}

export function ReferralAffordanceCard({
  userId,
  analysisId,
  source,
}: ReferralAffordanceCardProps) {
  const [copiedKind, setCopiedKind] = useState<'ref' | 'specimen' | null>(null);
  const [failedKind, setFailedKind] = useState<'ref' | 'specimen' | null>(null);

  const refLink = userId ? `${ORIGIN}/?ref=${encodeURIComponent(userId)}` : `${ORIGIN}/`;
  const specimenLink = `${ORIGIN}/demo`;

  const copy = async (text: string, kind: 'ref' | 'specimen') => {
    const result = await copyToClipboard(text);
    if (result === 'failed') {
      setFailedKind(kind);
      // Auto-clear the failure state after a few seconds so the next click
      // can re-try cleanly. The readonly URL preview below stays visible
      // so the user can select + copy it manually in the meantime.
      setTimeout(() => setFailedKind(null), 4000);
      trackEvent('referral_link_copy_failed', {
        kind,
        source,
        analysisId: analysisId ?? undefined,
        hasUserId: Boolean(userId),
      });
      return;
    }
    setCopiedKind(kind);
    setFailedKind(null);
    setTimeout(() => setCopiedKind(null), 2000);
    trackEvent('referral_link_copied', {
      kind,
      source,
      method: result,
      analysisId: analysisId ?? undefined,
      hasUserId: Boolean(userId),
    });
  };

  // Always-visible link preview so the URL is selectable + copyable even if
  // both clipboard paths fail (e.g. an aggressively-locked-down browser).
  // Doubles as a trust signal — the share link is the real thing, visible.
  const previewLink =
    copiedKind === 'specimen' || failedKind === 'specimen' ? specimenLink : refLink;

  return (
    <section
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderTop: `3px solid ${C.green}`,
        borderRadius: 16,
        padding: '22px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: C.greenSoft,
            border: `1px solid ${C.greenLight}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Share2 size={16} style={{ color: C.green }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: C.slate900,
              margin: '0 0 4px',
              letterSpacing: '-0.01em',
            }}
          >
            Know someone this would help?
          </h3>
          <p
            style={{
              fontSize: 13.5,
              color: C.slate600,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Founders, fractional CSOs, corp-dev heads — anyone wrestling with a high-stakes memo.
            Share the platform, or send them an example audit so they see what it does first.
          </p>
        </div>
      </div>

      <div
        className="referral-affordance-actions"
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
      >
        <button
          onClick={() => copy(refLink, 'ref')}
          aria-label="Copy a share link to Decision Intel"
          style={{
            flex: '1 1 220px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13.5,
            fontWeight: 700,
            color: C.white,
            background: copiedKind === 'ref' ? C.green : C.slate900,
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {copiedKind === 'ref' ? (
            <>
              <Check size={14} /> Copied
            </>
          ) : (
            <>
              <LinkIcon size={14} /> Copy share link
            </>
          )}
        </button>
        <button
          onClick={() => copy(specimenLink, 'specimen')}
          aria-label="Copy a link to an example audit they can see without signing up"
          style={{
            flex: '1 1 220px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13.5,
            fontWeight: 700,
            color: copiedKind === 'specimen' ? C.white : C.slate900,
            background: copiedKind === 'specimen' ? C.green : C.white,
            border: `1px solid ${copiedKind === 'specimen' ? C.green : C.slate200}`,
            padding: '10px 16px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {copiedKind === 'specimen' ? (
            <>
              <Check size={14} /> Copied
            </>
          ) : (
            <>
              <FileText size={14} /> Send them an example audit
            </>
          )}
        </button>
      </div>

      {/* Always-visible URL preview — selectable readonly input so the
          user can manually copy when both clipboard paths fail (locked-down
          browser / sandboxed iframe / Safari edge cases). Doubles as a
          trust signal: the share link is the real URL, no shortener. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          background: C.slate100,
          border: `1px solid ${C.slate200}`,
          borderRadius: 8,
        }}
      >
        <LinkIcon size={12} style={{ color: C.slate500, flexShrink: 0 }} />
        <input
          type="text"
          readOnly
          value={previewLink}
          onFocus={e => e.currentTarget.select()}
          aria-label="Share link — select to copy manually"
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            color: C.slate700,
            padding: 0,
          }}
        />
      </div>

      {failedKind && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 8,
            fontSize: 12,
            color: '#92400E',
            lineHeight: 1.5,
          }}
          role="alert"
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          Your browser blocked the clipboard. Select the link above to copy it manually.
        </div>
      )}

      <p style={{ fontSize: 11.5, color: C.slate500, margin: 0, lineHeight: 1.5 }}>
        The share link tracks who referred them so we know your network is the source.
      </p>
    </section>
  );
}
