'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Compass,
  Share2,
  UserPlus,
  X,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';

const STORAGE_KEY = 'decision-intel-onboarding-completed';
const GRAPH_VISITED_KEY = 'decision-intel-graph-visited';
const TEAM_VISITED_KEY = 'decision-intel-team-visited';

interface OnboardingState {
  onboardingCompleted: boolean;
  onboardingStep: number;
  onboardingRole: string | null;
  onboardingTourSeen: boolean;
}

function persistOnboardingState(data: Partial<OnboardingState>) {
  fetch('/api/onboarding', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}

interface ChecklistItem {
  key: string;
  icon: typeof Upload;
  title: string;
  description: string;
  cta: string;
  action: () => void;
  isComplete: boolean;
}

export function OnboardingGuide({ documentCount = 0 }: { documentCount?: number }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const [tourSeen, setTourSeen] = useState(false);
  const [graphVisited, setGraphVisited] = useState(false);
  const [teamVisited, setTeamVisited] = useState(false);

  useEffect(() => {
    // Client-only visit flags
    if (typeof window !== 'undefined') {
      setGraphVisited(localStorage.getItem(GRAPH_VISITED_KEY) === 'true');
      setTeamVisited(localStorage.getItem(TEAM_VISITED_KEY) === 'true');
    }

    // Hide if the full onboarding was explicitly dismissed via the checklist itself.
    // We use a DIFFERENT key than WelcomeModal so the checklist persists after the
    // modal is dismissed (modal = first-touch gate, checklist = ongoing nudge).
    if (localStorage.getItem('decision-intel-checklist-dismissed') === 'true') {
      return;
    }

    fetch('/api/onboarding')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then((data: OnboardingState) => {
        setTourSeen(Boolean(data.onboardingTourSeen));
        // Show the checklist to any user who hasn't completed BOTH onboarding and the tour.
        // That way even users who skipped the welcome modal still get the checklist.
        const fullyDone =
          data.onboardingCompleted &&
          data.onboardingTourSeen &&
          documentCount > 0 &&
          localStorage.getItem(GRAPH_VISITED_KEY) === 'true';
        if (!fullyDone) {
          startTransition(() => setDismissed(false));
        }
      })
      .catch(() => {
        startTransition(() => setDismissed(false));
      });
  }, [documentCount]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('decision-intel-checklist-dismissed', 'true');
    localStorage.setItem(STORAGE_KEY, 'true');
    persistOnboardingState({ onboardingCompleted: true });
  }, []);

  const handleTrySample = useCallback(async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/api/onboarding/sample', { method: 'POST' });
      const data = await res.json();
      if (data.documentId) {
        router.push(`/documents/${data.documentId}`);
      }
    } catch {
      // silent — user can still upload manually
    } finally {
      setLoadingSample(false);
    }
  }, [router]);

  const handleLaunchTour = useCallback(() => {
    localStorage.setItem('decision-intel-launch-tour', 'pending');
    window.dispatchEvent(new CustomEvent('di:launch-tour'));
  }, []);

  const handleVisitGraph = useCallback(() => {
    localStorage.setItem(GRAPH_VISITED_KEY, 'true');
    setGraphVisited(true);
    router.push('/dashboard/analytics');
  }, [router]);

  const handleInviteTeam = useCallback(() => {
    localStorage.setItem(TEAM_VISITED_KEY, 'true');
    setTeamVisited(true);
    router.push('/dashboard/team');
  }, [router]);

  const items: ChecklistItem[] = [
    {
      key: 'upload',
      icon: Upload,
      title: 'Upload your first strategic memo',
      description:
        'Drop in a memo, board deck, or market-entry recommendation to see the 60-second audit in action.',
      cta: loadingSample ? 'Loading...' : 'Try a sample memo',
      action: handleTrySample,
      isComplete: documentCount > 0,
    },
    {
      key: 'tour',
      icon: Compass,
      title: 'Take the 60-second product tour',
      description:
        'We spotlight the upload zone, audit tabs, and Knowledge Graph so you know what you\u2019re looking at.',
      cta: 'Start tour',
      action: handleLaunchTour,
      isComplete: tourSeen,
    },
    {
      key: 'graph',
      icon: Share2,
      title: 'Explore the Decision Knowledge Graph',
      description:
        'Every audit joins the graph. Today\u2019s decision inherits yesterday\u2019s lessons, quarter after quarter.',
      cta: 'Open Analytics',
      action: handleVisitGraph,
      isComplete: graphVisited,
    },
    {
      key: 'team',
      icon: UserPlus,
      title: 'Invite your team',
      description:
        'Bring in the colleagues who own the decision so outcomes and lessons accrue to the whole group.',
      cta: 'Invite teammates',
      action: handleInviteTeam,
      isComplete: teamVisited,
    },
  ];

  const completedCount = items.filter(i => i.isComplete).length;
  const progressPct = Math.round((completedCount / items.length) * 100);

  if (dismissed) return null;

  return (
    <section
      className="onboarding-checklist animate-fade-in"
      role="region"
      aria-label="Onboarding checklist"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '3px solid var(--accent-primary)',
        borderRadius: 12,
        marginBottom: 'var(--spacing-xl, 24px)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border-color)',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginBottom: 2,
            }}
          >
            Getting started
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {completedCount === items.length
              ? 'You\u2019re all set \u2014 nice work.'
              : `${completedCount} of ${items.length} steps complete`}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 120,
              height: 6,
              borderRadius: 999,
              background: 'var(--bg-tertiary)',
              overflow: 'hidden',
            }}
            aria-label={`Progress: ${progressPct}%`}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'var(--accent-primary)',
                transition: 'width 0.3s',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              minWidth: 32,
              textAlign: 'right',
            }}
          >
            {progressPct}%
          </span>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss checklist"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              marginLeft: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Items */}
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          const isLast = i === items.length - 1;
          return (
            <li
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 20px',
                borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
                background: item.isComplete ? 'rgba(22, 163, 74, 0.04)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.isComplete
                    ? 'var(--accent-primary)'
                    : 'var(--text-muted)',
                }}
                aria-hidden
              >
                {item.isComplete ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>

              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: item.isComplete
                    ? 'rgba(22, 163, 74, 0.12)'
                    : 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden
              >
                <Icon
                  size={16}
                  style={{
                    color: item.isComplete
                      ? 'var(--accent-primary)'
                      : 'var(--text-secondary)',
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                    textDecoration: item.isComplete ? 'line-through' : 'none',
                    textDecorationColor: 'var(--text-muted)',
                    opacity: item.isComplete ? 0.7 : 1,
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  {item.description}
                </div>
              </div>

              {!item.isComplete && (
                <button
                  onClick={item.action}
                  className="btn btn-secondary"
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '7px 12px',
                  }}
                >
                  {item.cta}
                  <ArrowRight size={13} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <style jsx>{`
        @media (max-width: 640px) {
          :global(.onboarding-checklist li) {
            flex-wrap: wrap !important;
          }
          :global(.onboarding-checklist li button) {
            width: 100% !important;
            justify-content: center !important;
            margin-top: 4px;
          }
        }
      `}</style>
    </section>
  );
}
