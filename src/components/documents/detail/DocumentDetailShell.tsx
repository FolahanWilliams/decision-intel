/**
 * DecisionDetailShell — the McKinsey-grade detail layout shared across
 * every "decision under audit" surface: standalone documents, deals,
 * decision packages.
 *
 * Two-pane architecture (locked 2026-05-05, generalised 2026-05-06):
 *
 *   ┌─── Header (sticky, minimal) ───────────────────────┐
 *   │  title · DqiPill · classification · primary action │
 *   └────────────────────────────────────────────────────┘
 *   ┌── Evidence pane (~58%) ──┬── Audit pane (~42%) ────┐
 *   │  PDF / docs list / text  │  Tab bar                │
 *   │  or empty-preview state  │  ─────                  │
 *   │                          │  Tab content            │
 *   │                          │  ⚙ corner gear          │
 *   └──────────────────────────┴─────────────────────────┘
 *
 * Shell is layout-only — it doesn't own data state. Parent passes the
 * tabs array, active tab, and slot content. The shell handles header
 * chrome, sticky behaviour, mobile collapse, and corner-gear settings
 * trigger.
 *
 * The original `DocumentDetailShell` export is aliased to
 * `DecisionDetailShell` for backward compatibility — both names point
 * at the same generic component now that deals and packages share it.
 */

'use client';

import type { ReactNode } from 'react';
import { Settings as SettingsIcon, FileText } from 'lucide-react';
import { DqiPill } from './primitives/DqiPill';
import styles from './DocumentDetailShell.module.css';

/**
 * Legacy 5-tab union for the document-detail page. Other detail
 * pages (deals, packages) supply their own union via the generic
 * `tabs` prop on `DecisionDetailShellProps`.
 */
export type DocDetailTab = 'findings' | 'actions' | 'stress' | 'perspectives' | 'regulatory';

const DOC_TAB_DEFS: { id: DocDetailTab; label: string }[] = [
  { id: 'findings', label: 'Findings' },
  { id: 'actions', label: 'Actions' },
  { id: 'stress', label: 'Stress test' },
  { id: 'perspectives', label: 'Perspectives' },
  { id: 'regulatory', label: 'Regulatory' },
];

export interface DetailShellTab {
  id: string;
  label: string;
  /** Optional badge — e.g. "3" or "new". */
  badge?: number | string;
  /** When false, tab renders disabled with a tooltip. */
  available?: boolean;
}

export interface DecisionDetailShellProps {
  /** Header H1 — filename for documents, deal name for deals, package name for packages. */
  title: string;
  /** DQI score (0-100) for the header pill — null when no audit yet. */
  dqiScore: number | null;
  /** Optional classification chip text. */
  classification?: 'specimen' | 'confidential' | 'client-safe-export' | 'sample';
  /** Optional per-detail-page header chips slotted to the right of the DqiPill (stage, IC date countdown, status). */
  headerChips?: ReactNode;
  /** Header's primary action (e.g. "Share & Export DPR" / "Export Deal DPR"). */
  primaryAction?: { label: string; onClick: () => void };
  /** Tab definitions — array of { id, label, badge?, available? }. */
  tabs?: DetailShellTab[];
  /** Active tab id. */
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Render the left pane. Parent supplies a PDF viewer, doc list, text fallback, or empty state. */
  leftPane: ReactNode;
  /** Right-pane tab content. Parent renders the active tab's body. */
  rightPaneContent: ReactNode;
  /** Optional pre-tabs slot — content rendered in the right pane ABOVE
   *  the tab bar. Used by the document-detail page for the
   *  persona-validated above-fold cluster (VerdictBand + Top-3 Fix
   *  Tiles + R²F signal strip) per DESIGN.md universal points #1 + #2.
   *  Item 1 lock 2026-05-07. */
  rightPaneAboveTabs?: ReactNode;
  /** Whether the active surface supports inline preview. False renders the empty-preview placeholder. */
  hasPreview?: boolean;
  /** Settings drawer trigger — parent owns drawer state. */
  onOpenSettings: () => void;
  /** Optional outcome-due / version-history strip below header. */
  outcomeStrip?: ReactNode;
  /** Optional toxic alert / pre-decision strip ABOVE the panes. */
  topAlert?: ReactNode;
  /** Optional breadcrumb row above the header. */
  breadcrumbs?: ReactNode;
  /** Settings button aria-label / title — defaults to "Document settings". */
  settingsLabel?: string;
}

/** Backward-compatible alias preserving the doc-detail page's existing import. */
export interface DocumentDetailShellProps extends Omit<
  DecisionDetailShellProps,
  'title' | 'tabs' | 'activeTab' | 'onTabChange'
> {
  filename: string;
  activeTab: DocDetailTab;
  onTabChange: (tab: DocDetailTab) => void;
  /** Active bias id for cross-pane sync — passthrough; not consumed by the shell. */
  activeBiasId?: string | null;
}

const CLASSIFICATION_TONE: Record<
  NonNullable<DocumentDetailShellProps['classification']>,
  {
    bg: string;
    fg: string;
    border: string;
  }
> = {
  specimen: {
    bg: 'color-mix(in srgb, var(--severity-medium) 10%, var(--bg-card))',
    fg: 'var(--severity-medium)',
    border: 'color-mix(in srgb, var(--severity-medium) 30%, var(--border-color))',
  },
  confidential: {
    bg: 'var(--bg-tertiary)',
    fg: 'var(--text-secondary)',
    border: 'var(--border-color)',
  },
  'client-safe-export': {
    bg: 'color-mix(in srgb, var(--info) 10%, var(--bg-card))',
    fg: 'var(--info)',
    border: 'color-mix(in srgb, var(--info) 30%, var(--border-color))',
  },
  sample: {
    bg: 'color-mix(in srgb, var(--severity-medium) 8%, var(--bg-card))',
    fg: 'var(--severity-medium)',
    border: 'color-mix(in srgb, var(--severity-medium) 25%, var(--border-color))',
  },
};

/**
 * Generic shell consumed by deals + packages + documents. Documents go
 * through the `DocumentDetailShell` alias below, which forwards into
 * this component with the legacy 5-tab DOC_TAB_DEFS preset.
 */
export function DecisionDetailShell(props: DecisionDetailShellProps) {
  const {
    title,
    dqiScore,
    classification = 'confidential',
    headerChips,
    primaryAction,
    tabs,
    activeTab,
    onTabChange,
    leftPane,
    rightPaneContent,
    rightPaneAboveTabs,
    hasPreview = true,
    onOpenSettings,
    outcomeStrip,
    topAlert,
    breadcrumbs,
    settingsLabel = 'Settings',
  } = props;

  const resolvedTabs: DetailShellTab[] = tabs ?? DOC_TAB_DEFS;
  const tone = CLASSIFICATION_TONE[classification];

  // Map the legacy variable name `filename` references in JSX below.
  const filename = title;

  return (
    <div
      className="doc-detail-v2"
      style={{
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--bg-primary)',
      }}
    >
      {breadcrumbs && <div style={{ padding: '12px 24px 0' }}>{breadcrumbs}</div>}
      {topAlert && <div style={{ padding: '0 24px' }}>{topAlert}</div>}

      {/* Sticky header */}
      <header
        className="doc-detail-v2-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          backdropFilter: 'saturate(1.4) blur(8px)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.012em',
              fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {filename}
          </h1>
        </div>
        <DqiPill score={dqiScore} size="md" />
        {headerChips}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            color: tone.fg,
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {classification.replace('-', ' ')}
        </span>
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.92';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = '';
            }}
          >
            {primaryAction.label}
          </button>
        )}
      </header>

      {outcomeStrip && <div style={{ padding: '12px 24px 0' }}>{outcomeStrip}</div>}

      {/* Two-pane body */}
      <div
        className={`doc-detail-v2-body ${styles.body}`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 58fr) minmax(0, 42fr)',
          gap: 0,
          alignItems: 'flex-start',
          padding: '20px 24px 40px',
          minHeight: 'calc(100vh - 200px)',
        }}
      >
        {/* Left pane — PDF / text / empty.
            History: (1) original had a hard `maxHeight:calc(100vh-100px)`
            + sticky + `overflow:hidden` → CLIPPED tall PDFs and left a
            fixed void below the capped card. (2) 2026-05-17 dropped the
            cap → card hugged content, but in the 2-col grid the right
            column (verdict cluster + long R²F tab body) is much taller,
            so a short doc left a SCREEN of dead space beside it (the
            2026-05-18 founder screenshot). (3) THIS is the deferred
            fuller fix, founder-signed-off 2026-05-18: the pane is
            sticky-follow — it pins just below the sticky header and
            stays beside whatever R²F card you scroll to, so there is no
            dead space; `overflow:auto` (not hidden) means a PDF taller
            than the viewport scrolls INSIDE the pane instead of being
            clipped. Safe on the SHARED shell (documents + deals +
            packages) because DocumentDetailShell.module.css already
            force-overrides `.left` to `position:static !important` +
            `max-height:70vh/60vh !important` at ≤1100px / ≤640px — so
            mobile/tablet stacks normally and the desktop sticky never
            applies there. deals/packages (short doc-list / text
            leftPanes) simply pin in place — strictly better than
            scrolling away. The Item-1 above-fold IA lock is in the
            RIGHT pane and is untouched. */}
        <section
          className={`doc-detail-v2-left ${styles.left}`}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            overflow: 'auto',
            alignSelf: 'start',
            position: 'sticky',
            top: 72,
            maxHeight: 'calc(100vh - 96px)',
            display: 'flex',
            flexDirection: 'column',
            marginRight: 16,
          }}
        >
          {hasPreview ? leftPane : <EmptyPreviewState />}
        </section>

        {/* Right pane — tabs + active tab body */}
        <section
          className="doc-detail-v2-right"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            minWidth: 0,
          }}
        >
          {/* Optional above-tabs slot — VerdictBand + Top-3 Fix Tiles +
              R²F signal strip per DESIGN.md persona-validated layout
              direction (Item 1 lock 2026-05-07). When omitted, the right
              pane reads as before-tab-bar with no extra spacing. */}
          {rightPaneAboveTabs && <div style={{ marginBottom: 16 }}>{rightPaneAboveTabs}</div>}

          {/* Tab bar with corner settings gear */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 4px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: 18,
            }}
          >
            {resolvedTabs.map(t => {
              const active = t.id === activeTab;
              const disabled = t.available === false;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onTabChange(t.id)}
                  title={disabled ? `${t.label} — no data on this surface yet.` : t.label}
                  style={{
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: active
                      ? '2px solid var(--accent-primary)'
                      : '2px solid transparent',
                    marginBottom: -1,
                    color: disabled
                      ? 'var(--text-muted)'
                      : active
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.55 : 1,
                    transition: 'color 0.15s ease, border-color 0.15s ease',
                    letterSpacing: '-0.005em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={e => {
                    if (!active && !disabled) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    if (!active && !disabled) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {t.label}
                  {t.badge != null && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 999,
                        background: active ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: active ? '#fff' : 'var(--text-muted)',
                        minWidth: 16,
                        textAlign: 'center',
                      }}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label={settingsLabel}
              title={settingsLabel}
              style={{
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                borderRadius: 4,
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <SettingsIcon size={15} />
            </button>
          </div>

          {/* Tab content */}
          <div
            className="doc-detail-v2-tab-content"
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            {rightPaneContent}
          </div>
        </section>
      </div>

      {/* Mobile collapse now handled by DocumentDetailShell.module.css
         (replaces the disabled styled-jsx block). */}
    </div>
  );
}

function EmptyPreviewState() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <FileText size={24} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        Preview unavailable
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          maxWidth: 320,
          lineHeight: 1.55,
        }}
      >
        This document type doesn&apos;t support inline preview. The audit on the right is rendered
        against the extracted text — open the source file in your local app to cross-reference.
      </div>
    </div>
  );
}

/**
 * DocumentDetailShell — backward-compat alias preserving the original
 * 5-tab document-detail API so the existing /documents/[id] page
 * doesn't need to migrate. New surfaces (deals, packages) call
 * DecisionDetailShell directly with their own tabs[] array.
 */
export function DocumentDetailShell({
  filename,
  activeTab,
  onTabChange,
  // activeBiasId is consumed by parent for cross-pane sync; the shell
  // only forwards it as a prop without rendering anything from it.
  activeBiasId: _activeBiasId,
  ...rest
}: DocumentDetailShellProps) {
  void _activeBiasId;
  return (
    <DecisionDetailShell
      title={filename}
      activeTab={activeTab}
      onTabChange={tab => onTabChange(tab as DocDetailTab)}
      settingsLabel="Document settings"
      {...rest}
    />
  );
}
