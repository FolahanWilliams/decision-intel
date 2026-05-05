/**
 * DPR Notice — small annotation / footnote callout used to add context
 * below stat grids and KV tables. Carries an uppercase mark on the left
 * (e.g. "NOTE", "ON COST-TIER ROUTING", "DISCLOSURE") and an italic body.
 */

import type { ReactNode } from 'react';

export interface DprNoticeProps {
  mark: string;
  children: ReactNode;
}

export function DprNotice({ mark, children }: DprNoticeProps) {
  return (
    <div className="dpr-notice">
      <span className="dpr-notice-mark">{mark}</span>
      {children}
    </div>
  );
}
