/**
 * DPR Key-Value Grid — the canonical key-value display used for record
 * identity, model lineage, judge variance stats, and any other typed
 * metadata block. Mono values get the JetBrains Mono treatment so
 * cryptographic hashes are immediately recognisable.
 */

import type { ReactNode } from 'react';

export interface DprKvRowProps {
  /** The key (left column). Sentence case; rendered in muted grey. */
  k: string;
  /** The value (right column). Can be a plain string or rich content. */
  v: ReactNode;
  /** Render the value column in monospace. Use for hashes, IDs, model names. */
  mono?: boolean;
  /** Optional tag rendered after the value — "ok", "info", or text. */
  mark?: { kind: 'ok' | 'info'; label: string };
}

export interface DprKvGridProps {
  rows: DprKvRowProps[];
}

export function DprKvGrid({ rows }: DprKvGridProps) {
  return (
    <dl className="dpr-kv-grid">
      {rows.map(row => (
        <DprKvRow key={row.k} {...row} />
      ))}
    </dl>
  );
}

function DprKvRow({ k, v, mono = false, mark }: DprKvRowProps) {
  return (
    <>
      <dt className="dpr-kv-key">{k}</dt>
      <dd className={mono ? 'dpr-kv-value dpr-kv-value--mono' : 'dpr-kv-value'}>
        {mark ? (
          <span className="dpr-kv-value-with-mark">
            <span>{v}</span>
            <span className={`dpr-kv-mark dpr-kv-mark--${mark.kind}`}>{mark.label}</span>
          </span>
        ) : (
          v
        )}
      </dd>
    </>
  );
}
