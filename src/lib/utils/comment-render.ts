/**
 * Lightweight comment renderer for bias-comments + task descriptions
 * (2.2 deep). Supports @-mentions and a tiny safe markdown subset:
 *   **bold**, *italic*, `code`, [link text](https://...), and bare URLs.
 *
 * Returns ReactNodes — nothing is dangerouslySetInnerHTML so we never
 * splice user input back into HTML directly.
 */

import React from 'react';

const MENTION_RE = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const URL_RE = /(https?:\/\/[^\s]+)/g;
const MD_PATTERNS: Array<{
  re: RegExp;
  render: (match: string, content: string, url?: string) => React.ReactNode;
}> = [
  // **bold**
  {
    re: /\*\*([^*\n]+)\*\*/g,
    render: (_m, content) => React.createElement('strong', null, content),
  },
  // [text](url)
  {
    re: /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    render: (_m, content, url) =>
      React.createElement(
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          style: { color: 'var(--accent-primary)', textDecoration: 'underline' },
        },
        content
      ),
  },
  // *italic*
  {
    re: /(?<![*\w])\*([^*\n]+)\*(?![*\w])/g,
    render: (_m, content) => React.createElement('em', null, content),
  },
  // `code`
  {
    re: /`([^`\n]+)`/g,
    render: (_m, content) =>
      React.createElement(
        'code',
        {
          style: {
            fontFamily: 'var(--font-mono, monospace)',
            background: 'var(--bg-elevated)',
            padding: '1px 4px',
            borderRadius: 4,
            fontSize: '0.92em',
          },
        },
        content
      ),
  },
];

export interface CommentRenderOptions {
  /**
   * Resolver from email → display name + click target. If a mention
   * resolves, the rendered chip carries the display name; otherwise
   * the email-form is shown with the @ kept.
   */
  resolveMention?: (email: string) => { displayName?: string; href?: string } | null;
  /** Token color for unresolved mentions. Defaults to accent-primary. */
  mentionColour?: string;
}

/**
 * Render a single line of body text with markdown + mention + url
 * substitutions. Returned nodes are React.ReactNode arrays meant to be
 * spliced into a parent <p> or similar.
 */
function renderLine(line: string, opts: CommentRenderOptions): React.ReactNode[] {
  // Walk through patterns in priority order, splitting the string as we
  // go. This is a tiny rewrite engine — not a full Markdown parser. The
  // surface area is intentionally narrow.
  let pieces: Array<string | React.ReactNode> = [line];

  // Markdown patterns
  for (const { re, render } of MD_PATTERNS) {
    pieces = pieces.flatMap(p => {
      if (typeof p !== 'string') return [p];
      const out: Array<string | React.ReactNode> = [];
      let cursor = 0;
      const fresh = new RegExp(re.source, re.flags);
      let m: RegExpExecArray | null;
      while ((m = fresh.exec(p)) !== null) {
        if (m.index > cursor) out.push(p.slice(cursor, m.index));
        out.push(render(m[0], m[1], m[2]));
        cursor = m.index + m[0].length;
      }
      if (cursor < p.length) out.push(p.slice(cursor));
      return out;
    });
  }

  // URLs (unwrapped, not inside a markdown link)
  pieces = pieces.flatMap(p => {
    if (typeof p !== 'string') return [p];
    const out: Array<string | React.ReactNode> = [];
    let cursor = 0;
    const fresh = new RegExp(URL_RE.source, URL_RE.flags);
    let m: RegExpExecArray | null;
    while ((m = fresh.exec(p)) !== null) {
      if (m.index > cursor) out.push(p.slice(cursor, m.index));
      out.push(
        React.createElement(
          'a',
          {
            href: m[0],
            target: '_blank',
            rel: 'noopener noreferrer',
            style: { color: 'var(--accent-primary)', textDecoration: 'underline' },
            key: `u-${m.index}`,
          },
          m[0]
        )
      );
      cursor = m.index + m[0].length;
    }
    if (cursor < p.length) out.push(p.slice(cursor));
    return out;
  });

  // @-mentions
  pieces = pieces.flatMap(p => {
    if (typeof p !== 'string') return [p];
    const out: Array<string | React.ReactNode> = [];
    let cursor = 0;
    const fresh = new RegExp(MENTION_RE.source, MENTION_RE.flags);
    let m: RegExpExecArray | null;
    while ((m = fresh.exec(p)) !== null) {
      if (m.index > cursor) out.push(p.slice(cursor, m.index));
      const email = m[1];
      const resolved = opts.resolveMention?.(email);
      const colour = opts.mentionColour ?? 'var(--accent-primary)';
      const label = resolved?.displayName ?? email;
      const href = resolved?.href;
      const inner = React.createElement(
        'span',
        {
          style: {
            color: colour,
            background: 'rgba(22,163,74,0.10)',
            padding: '0 4px',
            borderRadius: 3,
            fontWeight: 600,
          },
        },
        `@${label}`
      );
      out.push(
        href
          ? React.createElement(
              'a',
              {
                href,
                style: { textDecoration: 'none' },
                key: `m-${m.index}`,
              },
              inner
            )
          : React.cloneElement(inner as React.ReactElement, { key: `m-${m.index}` })
      );
      cursor = m.index + m[0].length;
    }
    if (cursor < p.length) out.push(p.slice(cursor));
    return out;
  });

  return pieces;
}

/**
 * Render an entire comment body, preserving line breaks. The caller
 * embeds the returned nodes inside a <p> with whiteSpace:'pre-wrap'.
 */
export function renderCommentBody(
  body: string,
  opts: CommentRenderOptions = {}
): React.ReactNode[] {
  if (!body) return [];
  const lines = body.split('\n');
  const out: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    out.push(...renderLine(lines[i], opts));
    if (i < lines.length - 1) {
      out.push(React.createElement('br', { key: `br-${i}` }));
    }
  }
  return out;
}
