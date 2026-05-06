/**
 * UnifiedDecisionsFeed — single feed across documents + deals + packages.
 *
 * Locked 2026-05-06. The home dashboard's answer to "what's happening
 * across all my decisions" — pulls from the three list endpoints, merges
 * chronologically, and renders each entry as a severity-edge card with
 * a type chip + DQI pill + status.
 *
 * Why this lives on the home dashboard:
 * The user's mental model is "the call I'm trying to make," not
 * "documents vs deals vs packages." The list pages stay separate per
 * Option B (workflow-shape-specific lifecycles), but the home dashboard
 * is the entry surface where everything converges. Every row deep-links
 * to the right detail page and inherits the same McKinsey-grade visual
 * rhythm.
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { FileText, Briefcase, Package, ChevronRight, Clock } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { useDeals } from '@/hooks/useDeals';
import { gradeFromScore } from '@/lib/utils/grade';

type DecisionKind = 'document' | 'deal' | 'package';

interface FeedEntry {
  kind: DecisionKind;
  id: string;
  title: string;
  href: string;
  dqi: number | null;
  /** ISO timestamp — when the entry was last touched. Drives ordering. */
  updatedAt: string;
  /** Subline copy under the title (e.g. "Strategic memo · audited 3 days ago"). */
  subtitle: string;
  /** Optional status chip (deal stage, package status, doc status). */
  statusChip?: { label: string; color: string };
}

interface PackageListItem {
  id: string;
  name: string;
  status: string;
  compositeDqi: number | null;
  documentCount: number;
  analyzedDocCount: number;
  updatedAt: string;
}

interface PackagesResponse {
  packages: PackageListItem[];
}

const PACKAGE_STATUS_COLOR: Record<string, string> = {
  drafting: '#3b82f6',
  under_review: '#eab308',
  decided: '#16A34A',
  superseded: '#94a3b8',
};

const PACKAGE_STATUS_LABEL: Record<string, string> = {
  drafting: 'Drafting',
  under_review: 'Under review',
  decided: 'Decided',
  superseded: 'Superseded',
};

const DEAL_STAGE_COLOR: Record<string, string> = {
  screening: '#3b82f6',
  due_diligence: '#eab308',
  ic_review: '#f97316',
  closing: '#a855f7',
  portfolio: '#16A34A',
  exited: '#94a3b8',
};

const KIND_ICON: Record<DecisionKind, typeof FileText> = {
  document: FileText,
  deal: Briefcase,
  package: Package,
};

const KIND_LABEL: Record<DecisionKind, string> = {
  document: 'Document',
  deal: 'Deal',
  package: 'Package',
};

const KIND_ACCENT: Record<DecisionKind, string> = {
  document: 'var(--accent-primary)',
  deal: '#a855f7',
  package: '#0891b2',
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface UnifiedDecisionsFeedProps {
  /** Max rows to render. Default 8. */
  limit?: number;
  /** Optional title override. Default "Recent decisions". */
  title?: string;
}

export function UnifiedDecisionsFeed({
  limit = 8,
  title = 'Recent decisions',
}: UnifiedDecisionsFeedProps) {
  // Documents — re-uses the existing dashboard hook.
  const { documents, isLoading: docsLoading } = useDocuments(true, 1);
  // Deals — re-uses the kanban list hook with a high cap (display-side
  // limited).
  const { deals, isLoading: dealsLoading } = useDeals(undefined, 1, 50);
  // Packages — pull directly from the list endpoint.
  const { data: pkgData, isLoading: pkgLoading } = useSWR<PackagesResponse>(
    '/api/decision-packages?limit=20',
    fetcher,
    { revalidateOnFocus: false }
  );

  const isLoading = docsLoading || dealsLoading || pkgLoading;

  const entries: FeedEntry[] = useMemo(() => {
    const out: FeedEntry[] = [];

    // Documents — UploadedDoc shape: { id, filename, status, score?, uploadedAt }
    for (const d of documents ?? []) {
      const dqi = d.score ?? null;
      out.push({
        kind: 'document',
        id: d.id,
        title: d.filename,
        href: `/documents/${d.id}`,
        dqi,
        updatedAt: d.uploadedAt,
        subtitle:
          d.status === 'analyzed'
            ? `Standalone audit · ${formatRelative(d.uploadedAt)}`
            : `Standalone audit · ${d.status}`,
        statusChip:
          d.status && d.status !== 'analyzed'
            ? { label: d.status, color: '#94a3b8' }
            : undefined,
      });
    }

    // Deals — DealSummary shape: { id, name, stage, compositeDqi?, _count.documents, updatedAt }
    for (const deal of deals ?? []) {
      const dqi = deal.compositeDqi ?? null;
      const stage = deal.stage;
      const stageColor = stage ? DEAL_STAGE_COLOR[stage] ?? '#6b7280' : '#6b7280';
      const docCount = deal._count?.documents ?? 0;
      out.push({
        kind: 'deal',
        id: deal.id,
        title: deal.name,
        href: `/dashboard/deals/${deal.id}`,
        dqi,
        updatedAt: deal.updatedAt,
        subtitle: `M&A pipeline · ${docCount} document${docCount === 1 ? '' : 's'}`,
        statusChip: stage
          ? { label: stage.replace(/_/g, ' '), color: stageColor }
          : undefined,
      });
    }

    // Packages
    for (const pkg of pkgData?.packages ?? []) {
      const statusColor = PACKAGE_STATUS_COLOR[pkg.status] ?? '#94a3b8';
      const statusLabel = PACKAGE_STATUS_LABEL[pkg.status] ?? pkg.status;
      out.push({
        kind: 'package',
        id: pkg.id,
        title: pkg.name,
        href: `/dashboard/decisions/${pkg.id}`,
        dqi: pkg.compositeDqi,
        updatedAt: pkg.updatedAt,
        subtitle: `Decision package · ${pkg.analyzedDocCount} analyzed of ${pkg.documentCount}`,
        statusChip: { label: statusLabel, color: statusColor },
      });
    }

    // Sort newest-first, cap at limit.
    return out
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [documents, deals, pkgData, limit]);

  if (isLoading && entries.length === 0) {
    return (
      <section
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: 18,
        }}
      >
        <FeedHeader title={title} />
        <div
          style={{
            padding: 24,
            color: 'var(--text-muted)',
            fontSize: 12.5,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Loading recent activity…
        </div>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: 18,
        }}
      >
        <FeedHeader title={title} />
        <div
          style={{
            padding: 24,
            color: 'var(--text-muted)',
            fontSize: 12.5,
            textAlign: 'center',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          No recent decisions yet. Upload a memo, start a deal, or assemble a decision
          package to populate this feed.
        </div>
        <FeedFooterRails />
      </section>
    );
  }

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: 18,
      }}
    >
      <FeedHeader title={title} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {entries.map(entry => (
          <FeedRow key={`${entry.kind}-${entry.id}`} entry={entry} />
        ))}
      </div>
      <FeedFooterRails />
    </section>
  );
}

function FeedFooterRails() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginTop: 14,
        paddingTop: 12,
        borderTop: '1px solid var(--border-color)',
        fontSize: 11.5,
        fontWeight: 600,
      }}
    >
      <Link
        href="/dashboard?view=browse"
        style={{
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        All documents <ChevronRight size={11} />
      </Link>
      <Link
        href="/dashboard/deals"
        style={{
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        All deals <ChevronRight size={11} />
      </Link>
      <Link
        href="/dashboard/decisions"
        style={{
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        All packages <ChevronRight size={11} />
      </Link>
    </div>
  );
}

function FeedHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.005em',
        }}
      >
        {title}
      </h2>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Across documents, deals, and packages
      </span>
    </div>
  );
}

function FeedRow({ entry }: { entry: FeedEntry }) {
  const Icon = KIND_ICON[entry.kind];
  const accent = KIND_ACCENT[entry.kind];
  const dqiColor = entry.dqi != null ? gradeColorFor(entry.dqi) : 'var(--text-muted)';

  return (
    <Link
      href={entry.href}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        gap: 12,
        alignItems: 'center',
        padding: '12px 14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-sm, 4px)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.12s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.borderColor = `color-mix(in srgb, ${accent} 30%, var(--border-color))`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: `color-mix(in srgb, ${accent} 12%, transparent)`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={14} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 2,
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: accent,
            }}
          >
            {KIND_LABEL[entry.kind]}
          </span>
          <span>·</span>
          <span>{entry.subtitle}</span>
        </div>
      </div>

      {entry.statusChip && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: entry.statusChip.color,
            background: `${entry.statusChip.color}1a`,
            border: `1px solid ${entry.statusChip.color}33`,
            padding: '2px 8px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {entry.statusChip.label}
        </span>
      )}

      {entry.dqi != null ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11.5,
            fontWeight: 700,
            color: dqiColor,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
          title={`DQI · grade ${gradeFromScore(entry.dqi)}`}
        >
          {gradeFromScore(entry.dqi)} · {Math.round(entry.dqi)}
        </span>
      ) : (
        <span
          style={{
            fontSize: 10.5,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Clock size={10} /> pending
        </span>
      )}
    </Link>
  );
}

function gradeColorFor(score: number): string {
  if (score >= 85) return 'var(--severity-low)';
  if (score >= 70) return 'var(--info)';
  if (score >= 55) return 'var(--severity-medium)';
  if (score >= 40) return 'var(--severity-high)';
  return 'var(--severity-critical)';
}

function formatRelative(iso: string): string {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(ms)) return '';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d}d ago`;
    const mo = Math.floor(d / 30);
    return `${mo}mo ago`;
  } catch {
    return '';
  }
}
