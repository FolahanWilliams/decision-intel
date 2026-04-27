/**
 * Shared constants for Human Cognitive Audit UI pages.
 *
 * Centralises source labels, icons, severity styles, and nudge type labels
 * used across the cognitive-audits list, detail, and nudges pages.
 */

import { MessageSquare, Users, Mail, Ticket, PenLine } from 'lucide-react';

// ─── Source Metadata ────────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<string, string> = {
  slack: 'Slack',
  meeting_transcript: 'Meeting',
  email: 'Email',
  jira: 'Jira',
  manual: 'Manual',
};

/** Longer labels used on the detail page */
export const SOURCE_LABELS_LONG: Record<string, string> = {
  slack: 'Slack Conversation',
  meeting_transcript: 'Meeting Transcript',
  email: 'Email Thread',
  jira: 'Jira Ticket',
  manual: 'Manual Submission',
};

export const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  slack: MessageSquare,
  meeting_transcript: Users,
  email: Mail,
  jira: Ticket,
  manual: PenLine,
};

// ─── Severity / Quality Styles ──────────────────────────────────────────────

export const SEVERITY_COLORS: Record<string, string> = {
  critical: 'var(--error)',
  high: '#f97316',
  medium: 'var(--warning)',
  low: 'var(--success)',
};

export const SEVERITY_STYLES: Record<string, { color: string; bg: string }> = {
  critical: { color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' },
  warning: { color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
  info: { color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.1)' },
};

export function getQualityLevel(score: number) {
  if (score < 40)
    return { label: 'HIGH RISK', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' };
  if (score < 70)
    return { label: 'MODERATE', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' };
  return { label: 'GOOD', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' };
}

// ─── Nudge Types ────────────────────────────────────────────────────────────

// Every nudgeType used in code MUST appear here, or the UI surfaces the raw
// enum string (e.g. "pre_decision_coaching") because of the `|| nudge.nudgeType`
// fallback in NudgeWidget / NudgesPageContent. Before adding a new value,
// search the call-sites with: grep -rE "nudgeType: ?['\"]" src/
export const NUDGE_TYPE_LABELS: Record<string, string> = {
  anchor_alert: 'Anchor Alert',
  dissent_prompt: 'Dissent Prompt',
  base_rate_reminder: 'Base Rate Reminder',
  pre_mortem_trigger: 'Pre-Mortem Trigger',
  noise_check: 'Noise Check',
  shallow_verification: 'Shallow Verification',
  graph_pattern_warning: 'Graph Pattern Warning',
  bias_comment_mention: 'Comment Mention',
  toxic_combination: 'Toxic Combination',
  pre_decision_coaching: 'Pre-Decision Coaching',
  document_access_granted: 'Document Access Granted',
  bias_task_assigned: 'Bias Task Assigned',
  playbook_followup: 'Playbook Follow-Up',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getBiasArray<T = { severity: string; biasType: string }>(
  biasFindings: unknown
): T[] {
  if (Array.isArray(biasFindings)) return biasFindings;
  return [];
}

/**
 * Format a date string into a locale-independent format safe for SSR.
 * Avoids hydration mismatches from new Date().toLocaleString() in JSX.
 */
export function formatDate(dateStr: string | undefined | null, includeTime = false): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  if (!includeTime) return `${year}-${month}-${day}`;
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const mins = String(d.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
}

/**
 * Format a date string into short month + day (e.g. "Mar 16").
 * UTC-based to avoid hydration mismatches.
 */
export function formatDateShort(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
