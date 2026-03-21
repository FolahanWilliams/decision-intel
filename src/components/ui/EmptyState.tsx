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
        {/* Icon with animated decorative rings + glow */}
        <div
          style={{
            position: 'relative',
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Ambient glow pulse */}
          <div className="empty-state-glow" />
          {/* Outer spinning ring */}
          <div className="empty-state-ring" />
          {/* Inner counter-spinning ring */}
          <div className="empty-state-ring-inner" />
          {/* Icon container with glass treatment */}
          <div className="empty-state-icon">
            <Icon size={26} style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>

        {/* Text content */}
        <div>
          <h2 className="text-lg font-semibold mb-sm">{title}</h2>
          <p
            className="text-sm"
            style={{
              maxWidth: 420,
              margin: '0 auto',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
            }}
          >
            {description}
          </p>
        </div>

        {/* Optional badges with glass pill style */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-sm">
            {badges.map(badge => (
              <span
                key={badge}
                className="glass-pill"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  padding: '4px 12px',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {(action || secondaryAction) && (
          <div className="flex items-center gap-sm" style={{ marginTop: 'var(--spacing-sm)' }}>
            {secondaryAction && (
              <button onClick={secondaryAction.onClick} className="btn btn-ghost text-sm">
                {secondaryAction.label}
              </button>
            )}
            {action && (
              <button onClick={action.onClick} className="btn btn-primary flex items-center gap-sm">
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
