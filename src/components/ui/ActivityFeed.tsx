'use client';

import { formatDistanceToNow } from 'date-fns';
import { FileText, AlertCircle, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Activity {
  id: string;
  type: 'analysis' | 'alert' | 'success' | 'pending' | 'trend' | 'team' | 'upload' | 'analysis_complete' | 'analysis_error' | 'nudge' | 'outcome';
  title: string;
  description?: string;
  timestamp: Date | string;
  user?: string;
  metadata?: Record<string, unknown>;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
  compact?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  analysis: FileText,
  analysis_complete: CheckCircle,
  analysis_error: AlertCircle,
  alert: AlertCircle,
  success: CheckCircle,
  pending: Clock,
  trend: TrendingUp,
  team: Users,
  upload: FileText,
  nudge: TrendingUp,
  outcome: CheckCircle,
};

const activityColors: Record<string, string> = {
  analysis: 'text-blue-500',
  analysis_complete: 'text-green-500',
  analysis_error: 'text-red-500',
  alert: 'text-red-500',
  success: 'text-green-500',
  pending: 'text-orange-500',
  trend: 'text-purple-500',
  team: 'text-indigo-500',
  upload: 'text-blue-500',
  nudge: 'text-purple-500',
  outcome: 'text-green-500',
};

export function ActivityFeed({ activities, className, compact = false }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type];
        const iconColor = activityColors[activity.type];

        return (
          <div
            key={activity.id}
            className={cn(
              'flex gap-3 p-3 rounded-lg',
              'liquid-glass',
              'hover:bg-white/5 transition-colors',
              compact && 'p-2'
            )}
          >
            <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
              <Icon className={cn('w-5 h-5', compact && 'w-4 h-4')} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium text-white truncate',
                    compact && 'text-sm'
                  )}>
                    {activity.title}
                  </p>

                  {!compact && activity.description && (
                    <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">
                      {activity.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    {activity.user && (
                      <span className="text-xs text-gray-500">
                        {activity.user}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(
                        typeof activity.timestamp === 'string' ? new Date(activity.timestamp) : activity.timestamp,
                        { addSuffix: true }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}