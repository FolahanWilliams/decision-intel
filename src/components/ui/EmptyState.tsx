'use client';

import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  badges?: string[];
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  badges,
  children,
}: EmptyStateProps) {
  return (
    <div className="animate-fade-in" style={{ padding: 'var(--spacing-2xl)' }}>
      <div className="flex flex-col items-center gap-lg text-center">
        {/* Icon with decorative ring */}
        <div
          style={{
            position: 'relative',
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer decorative ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(99, 102, 241, 0.04)',
              border: '1px dashed rgba(99, 102, 241, 0.15)',
            }}
          />
          {/* Inner filled circle */}
          <div
            style={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Icon size={28} style={{ color: 'var(--accent-primary)' }} />
          </div>
        </div>

        {/* Text content */}
        <div>
          <h2 className="text-lg font-semibold mb-sm">{title}</h2>
          <p
            className="text-sm text-muted"
            style={{ maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}
          >
            {description}
          </p>
        </div>

        {/* Optional badges */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-sm">
            {badges.map((badge) => (
              <span
                key={badge}
                className="badge badge-complete"
                style={{ fontSize: '0.7rem' }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {(action || secondaryAction) && (
          <div className="flex items-center gap-sm">
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="btn btn-ghost text-sm"
              >
                {secondaryAction.label}
              </button>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className="btn btn-primary flex items-center gap-sm"
              >
                {action.icon && <action.icon size={16} />}
                {action.label}
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
