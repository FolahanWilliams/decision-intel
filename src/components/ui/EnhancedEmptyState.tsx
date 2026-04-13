'use client';

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
  Video,
  Bell,
  GitCompareArrows,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDensity } from '@/components/DensityProvider';
import { IntelligenceBrief } from '@/components/ui/IntelligenceBrief';

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
  illustration?: React.ReactNode;
}

const emptyStateConfigs: Record<EmptyStateType, EmptyStateConfig> = {
  documents: {
    icon: <FileText className="w-12 h-12" />,
    title: 'Your Decision Knowledge Graph starts here',
    description:
      'Upload your first strategic memo, board deck, or market-entry recommendation. We\u2019ll audit the reasoning, score the biases, and add it to your Knowledge Graph.',
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
        icon: <Upload className="w-4 h-4" />,
      },
      {
        label: 'Learn More',
        href: '/dashboard/analytics?view=library',
        variant: 'secondary',
        icon: <Brain className="w-4 h-4" />,
      },
    ],
  },
  insights: {
    icon: <BarChart3 className="w-12 h-12" />,
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
        icon: <Plus className="w-4 h-4" />,
      },
    ],
  },
  search: {
    icon: <Search className="w-12 h-12" />,
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
    icon: <Brain className="w-12 h-12" />,
    title: 'No strategic memos audited yet',
    description:
      'Run your first audit and see the reasoning behind the numbers, scored against 146 historical decisions and 30+ cognitive biases.',
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
        icon: <Sparkles className="w-4 h-4" />,
      },
      {
        label: 'View Bias Library',
        href: '/dashboard/analytics?view=library',
        variant: 'secondary',
      },
    ],
  },
  team: {
    icon: <Users className="w-12 h-12" />,
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
        icon: <Plus className="w-4 h-4" />,
      },
    ],
  },
  meetings: {
    icon: <Video className="w-12 h-12" />,
    title: 'No meeting recordings',
    description: 'Upload meeting recordings or transcripts to analyze group decision dynamics.',
    suggestions: [
      'Support for video and audio files',
      'Automatic transcription available',
      'Identify groupthink and discussion biases',
    ],
    actions: [
      {
        label: 'Upload Recording',
        href: '/dashboard/meetings',
        variant: 'primary',
        icon: <Upload className="w-4 h-4" />,
      },
    ],
  },
  nudges: {
    icon: <Bell className="w-12 h-12" />,
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
    icon: <MessageSquare className="w-12 h-12" />,
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
        icon: <MessageSquare className="w-4 h-4" />,
      },
    ],
  },
  compare: {
    icon: <GitCompareArrows className="w-12 h-12" />,
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
    icon: <AlertCircle className="w-12 h-12" />,
    title: 'Nothing here yet',
    description: 'This section will populate as you use the platform.',
    actions: [],
  },
  error: {
    icon: <AlertCircle className="w-12 h-12 text-error" />,
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
    | 'analytics';
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
  const { density } = useDensity();

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalIcon = icon || config.icon;
  const finalActions = actions || config.actions;
  const finalSuggestions = suggestions || config.suggestions;

  const isCompact = density === 'compact' || density === 'dense';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 px-6 rounded-xl',
        'liquid-glass border border-white/10',
        isCompact ? 'py-8 px-4' : 'py-12 px-6',
        className
      )}
    >
      {/* Icon with animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className={cn(
          'mb-6 p-4 rounded-full',
          'bg-white/5 border border-white/10',
          isCompact && 'mb-4 p-3'
        )}
      >
        <div className="text-muted">{finalIcon}</div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn('text-xl font-semibold mb-2', isCompact && 'text-lg')}
      >
        {finalTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn('text-muted max-w-md mb-6', isCompact ? 'text-sm mb-4' : 'text-base mb-6')}
      >
        {finalDescription}
      </motion.p>

      {/* Suggestions */}
      {finalSuggestions && finalSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn('mb-6 text-left', isCompact && 'mb-4')}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            <span className={cn('text-xs font-medium text-muted', isCompact && 'text-xs')}>
              Tips
            </span>
          </div>
          <ul className="space-y-1">
            {finalSuggestions.map((suggestion, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={cn('flex items-start gap-2 text-sm text-muted', isCompact && 'text-xs')}
              >
                <span className="text-success mt-1">•</span>
                <span>{suggestion}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Intelligence Brief */}
      {showBrief && briefContext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md mb-6"
        >
          <IntelligenceBrief context={briefContext} />
        </motion.div>
      )}

      {/* Actions */}
      {finalActions && finalActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {finalActions.map((action, index) => {
            if (action.href) {
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                    'transition-all duration-200',
                    action.variant === 'primary'
                      ? 'bg-accent-primary text-black hover:bg-accent-secondary'
                      : 'bg-white/10 text-white hover:bg-white/20',
                    isCompact && 'px-3 py-1.5 text-sm'
                  )}
                >
                  {action.icon}
                  <span>{action.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              );
            }

            return (
              <button
                key={index}
                onClick={action.onClick}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'transition-all duration-200',
                  action.variant === 'primary'
                    ? 'bg-accent-primary text-black hover:bg-accent-secondary'
                    : 'bg-white/10 text-white hover:bg-white/20',
                  isCompact && 'px-3 py-1.5 text-sm'
                )}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
