'use client';

/**
 * EnhancedEmptyState — procurement-grade empty-state primitive.
 *
 * Redesigned 2026-05-11 after the founder flagged the prior layout as
 * "poorly designed viz" — the old version stacked a faded icon-in-circle
 * above a floating Lightbulb-icon-with-3-vertical-green-dots Tips header,
 * with text rendered in Tailwind `text-muted` classes that washed out
 * against the light platform background (the user could only see the
 * icons + dots, not the suggestion text).
 *
 * Redesign principles (per CLAUDE.md):
 *   - Inline `style={{}}` with CSS variables, NOT Tailwind utility classes
 *     for color (the platform is light-theme only; `text-muted` may resolve
 *     but at near-invisible contrast)
 *   - Clean horizontal hierarchy: icon on left, content on right (or
 *     centered for narrow surfaces)
 *   - Suggestions render as a clean inline list with proper bullets +
 *     visible text (no broken Lightbulb + dot-stack header pattern)
 *   - Primary action is unmistakable (high-contrast green button); secondary
 *     action is platform-secondary (border + text)
 *   - framer-motion animations kept minimal (single fade-in, no per-element
 *     spring choreography that adds nothing)
 *
 * API is unchanged — all 8 consumer surfaces continue to work without edits.
 */

import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Search,
  BarChart3,
  Brain,
  Users,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  MessageSquare,
  Bell,
  GitCompareArrows,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { IntelligenceBrief } from '@/components/ui/IntelligenceBrief';
import { ALL_CASES } from '@/lib/data/case-studies';

const HISTORICAL_CASE_COUNT = ALL_CASES.length;

export type EmptyStateType =
  | 'documents'
  | 'insights'
  | 'search'
  | 'cognitive-audits'
  | 'team'
  | 'meetings'
  | 'nudges'
  | 'chat'
  | 'compare'
  | 'generic'
  | 'error';

interface EmptyStateConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
  }>;
}

const emptyStateConfigs: Record<EmptyStateType, EmptyStateConfig> = {
  documents: {
    icon: <FileText size={28} strokeWidth={1.5} />,
    title: 'Start your first audit',
    description:
      'Upload a strategic memo, board deck, or market-entry recommendation. We’ll audit the reasoning, score the biases, and surface the questions your CEO is about to ask in under 60 seconds.',
    suggestions: [
      'Strategic memos, board decks, market-entry papers',
      'PDF, Word, Excel, or plain text',
      'First audit takes under 60 seconds',
    ],
    actions: [
      {
        label: 'Upload Document',
        onClick: () => document.getElementById('file-input')?.click(),
        variant: 'primary',
        icon: <Upload size={14} />,
      },
      {
        label: 'Learn More',
        href: '/dashboard/analytics?view=library',
        variant: 'secondary',
        icon: <Brain size={14} />,
      },
    ],
  },
  insights: {
    icon: <BarChart3 size={28} strokeWidth={1.5} />,
    title: 'No insights available yet',
    description:
      'Upload and analyze documents to see trends, patterns, and bias breakdowns over time.',
    suggestions: [
      'Analyze at least 3 documents to see trends',
      'Insights update automatically as you upload more',
      'Track improvement over time',
    ],
    actions: [
      {
        label: 'Upload First Document',
        href: '/dashboard',
        variant: 'primary',
        icon: <Plus size={14} />,
      },
    ],
  },
  search: {
    icon: <Search size={28} strokeWidth={1.5} />,
    title: 'No search results',
    description: "Try adjusting your search terms or filters to find what you're looking for.",
    suggestions: [
      'Use broader search terms',
      'Check your spelling',
      'Remove some filters',
      'Search across all document types',
    ],
    actions: [
      {
        label: 'Clear Search',
        onClick: () => (window.location.href = window.location.pathname),
        variant: 'secondary',
      },
    ],
  },
  'cognitive-audits': {
    icon: <Brain size={28} strokeWidth={1.5} />,
    title: 'No strategic memos audited yet',
    description: `Run your first audit and see the reasoning behind the numbers, scored against ${HISTORICAL_CASE_COUNT} historical decisions and 30+ cognitive biases.`,
    suggestions: [
      'Walk into the board with rigor that matches your data',
      'Predict steering-committee objections before the meeting',
      'Build your Decision Quality Index, quarter over quarter',
    ],
    actions: [
      {
        label: 'Start New Audit',
        href: '/dashboard/cognitive-audits/submit',
        variant: 'primary',
        icon: <Sparkles size={14} />,
      },
      {
        label: 'View Bias Library',
        href: '/dashboard/analytics?view=library',
        variant: 'secondary',
      },
    ],
  },
  team: {
    icon: <Users size={28} strokeWidth={1.5} />,
    title: 'No team members yet',
    description: 'Invite colleagues to collaborate on decision analysis and share insights.',
    suggestions: [
      'Invite team members via email',
      'Share analyses and reports',
      'Track team decision patterns',
    ],
    actions: [
      {
        label: 'Invite Team Member',
        href: '/dashboard/team',
        variant: 'primary',
        icon: <Plus size={14} />,
      },
    ],
  },
  // Meetings empty-state retired 2026-05-10 — meetings → document type
  // cascade. Transcripts + minutes upload as documents now via the
  // standard /dashboard upload flow. Kept the key for back-compat with
  // upstream type unions; redirects users to the canonical upload entry.
  meetings: {
    icon: <Upload size={28} strokeWidth={1.5} />,
    title: 'No meeting transcripts yet',
    description:
      'Upload meeting transcripts or minutes as documents. They flow into the Decision Container alongside memos, models, and DPRs.',
    suggestions: [
      'Paste a transcript from Otter, Fireflies, or AssemblyAI',
      'Upload .txt or .docx with speaker turns',
      'Tag the document type as Meeting Transcript or Meeting Minutes',
    ],
    actions: [
      {
        label: 'Upload Transcript',
        href: '/dashboard',
        variant: 'primary',
        icon: <Upload size={14} />,
      },
    ],
  },
  nudges: {
    icon: <Bell size={28} strokeWidth={1.5} />,
    title: 'No active nudges',
    description:
      'Nudges will appear here when the system detects decision patterns that need attention.',
    suggestions: [
      'Nudges help prevent bias in real-time',
      'Based on your historical patterns',
      'Customizable alert preferences',
    ],
    actions: [
      {
        label: 'Configure Nudges',
        href: '/dashboard/settings',
        variant: 'secondary',
      },
    ],
  },
  chat: {
    icon: <MessageSquare size={28} strokeWidth={1.5} />,
    title: 'Start a conversation',
    description: 'Ask questions about your documents, biases, or get decision-making advice.',
    suggestions: [
      'Ask about specific biases in your documents',
      'Get recommendations for better decisions',
      'Explore what-if scenarios',
    ],
    actions: [
      {
        label: 'Start Chat',
        onClick: () => document.querySelector<HTMLInputElement>('[data-chat-input]')?.focus(),
        variant: 'primary',
        icon: <MessageSquare size={14} />,
      },
    ],
  },
  compare: {
    icon: <GitCompareArrows size={28} strokeWidth={1.5} />,
    title: 'Select documents to compare',
    description:
      'Choose two or more documents to see how their biases and decision quality differ.',
    suggestions: [
      'Compare versions of the same document',
      'See how decisions evolved over time',
      'Identify improvement areas',
    ],
    actions: [
      {
        label: 'Browse Documents',
        href: '/dashboard?view=browse',
        variant: 'primary',
      },
    ],
  },
  generic: {
    icon: <AlertCircle size={28} strokeWidth={1.5} />,
    title: 'Nothing here yet',
    description: 'This section will populate as you use the platform.',
    actions: [],
  },
  error: {
    icon: <AlertCircle size={28} strokeWidth={1.5} />,
    title: 'Something went wrong',
    description:
      "We couldn't load this content. Please try again or contact support if the issue persists.",
    actions: [
      {
        label: 'Retry',
        onClick: () => window.location.reload(),
        variant: 'primary',
      },
      {
        label: 'Go to Dashboard',
        href: '/dashboard',
        variant: 'secondary',
      },
    ],
  },
};

interface EnhancedEmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: EmptyStateConfig['actions'];
  suggestions?: string[];
  className?: string;
  /** Show an intelligence brief based on org data */
  showBrief?: boolean;
  /** Context for the intelligence brief */
  briefContext?:
    | 'documents'
    | 'deals'
    | 'nudges'
    | 'effectiveness'
    | 'meetings'
    | 'rooms'
    | 'playbooks'
    | 'journal'
    | 'analytics'
    | 'outcomes';
}

export function EnhancedEmptyState({
  type = 'generic',
  title,
  description,
  icon,
  actions,
  suggestions,
  className,
  showBrief,
  briefContext,
}: EnhancedEmptyStateProps) {
  const config = emptyStateConfigs[type];

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalIcon = icon || config.icon;
  const finalActions = actions || config.actions;
  const finalSuggestions = suggestions || config.suggestions;

  const accentColor = type === 'error' ? 'var(--error)' : 'var(--accent-primary)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '32px 24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        maxWidth: 640,
        marginInline: 'auto',
      }}
    >
      {/* Icon — clean, no spinning spring animation. Just a sized circle
          with the icon in the accent color. */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          marginBottom: 16,
        }}
      >
        {finalIcon}
      </div>

      {/* Title — explicit color, no Tailwind class drift. */}
      <h3
        style={{
          fontSize: 'var(--fs-lg)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {finalTitle}
      </h3>

      {/* Description — explicit color, NOT Tailwind text-muted (which
          rendered near-invisible against the light card background). */}
      <p
        style={{
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          margin: 0,
          marginBottom: finalSuggestions && finalSuggestions.length > 0 ? 20 : 16,
          maxWidth: 520,
          lineHeight: 1.55,
        }}
      >
        {finalDescription}
      </p>

      {/* Suggestions — replaces the prior broken "Lightbulb header + 3
          vertical green dots" pattern. Each suggestion renders as a row
          with a check icon + visible text. */}
      {finalSuggestions && finalSuggestions.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'flex-start',
            textAlign: 'left',
            maxWidth: 480,
            width: '100%',
          }}
        >
          {finalSuggestions.map(suggestion => (
            <li
              key={suggestion}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              <CheckCircle
                size={12}
                style={{
                  color: accentColor,
                  flexShrink: 0,
                  marginTop: 3,
                }}
              />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Intelligence brief — kept inline below suggestions when requested.
          Contained in a max-width wrapper so a long brief doesn't blow out
          the card width. */}
      {showBrief && briefContext && (
        <div style={{ width: '100%', maxWidth: 520, marginBottom: 20 }}>
          <IntelligenceBrief context={briefContext} />
        </div>
      )}

      {/* Actions — primary always green, secondary always bordered. No
          Tailwind `bg-accent-primary text-black` which may not resolve;
          inline styles guarantee the buttons render correctly. */}
      {finalActions && finalActions.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {finalActions.map(action => {
            const isPrimary = action.variant === 'primary';
            const buttonStyle: React.CSSProperties = {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              border: isPrimary ? 'none' : '1px solid var(--border-color)',
              background: isPrimary ? accentColor : 'var(--bg-card)',
              color: isPrimary ? '#fff' : 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'opacity 0.15s, transform 0.15s',
            };

            if (action.href) {
              return (
                <Link key={action.label} href={action.href} style={buttonStyle}>
                  {action.icon}
                  <span>{action.label}</span>
                  {isPrimary && <ArrowRight size={12} />}
                </Link>
              );
            }

            return (
              <button key={action.label} type="button" onClick={action.onClick} style={buttonStyle}>
                {action.icon}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
