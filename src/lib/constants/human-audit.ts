/**
 * Shared constants for Human Cognitive Audit UI pages.
 *
 * Centralises source labels, icons, severity styles, and nudge type labels
 * used across the cognitive-audits list, detail, and nudges pages.
 */

import {
  MessageSquare,
  Users,
  Mail,
  Ticket,
  PenLine,
} from 'lucide-react';

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
  if (score < 40) return { label: 'HIGH RISK', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' };
  if (score < 70) return { label: 'MODERATE', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' };
  return { label: 'GOOD', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' };
}

// ─── Nudge Types ────────────────────────────────────────────────────────────

export const NUDGE_TYPE_LABELS: Record<string, string> = {
  anchor_alert: 'Anchor Alert',
  dissent_prompt: 'Dissent Prompt',
  base_rate_reminder: 'Base Rate Reminder',
  pre_mortem_trigger: 'Pre-Mortem Trigger',
  noise_check: 'Noise Check',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getBiasArray<T = { severity: string; biasType: string }>(biasFindings: unknown): T[] {
  if (Array.isArray(biasFindings)) return biasFindings;
  return [];
}
