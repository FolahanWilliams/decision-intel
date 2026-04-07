'use client';

import {
  MessageSquare,
  Mail,
  HardDrive,
  Zap,
  BarChart3,
  Network,
  TrendingUp,
  Users,
} from 'lucide-react';
import { card, sectionTitle, badge } from '@/components/founder-hub/shared-styles';

export function IntegrationsAndFlywheelTab() {
  return (
    <div>
      {/* Slack */}
      <div style={{ ...card, borderTop: '3px solid #4A154B' }}>
        <div style={sectionTitle}>
          <MessageSquare size={18} style={{ color: '#4A154B' }} /> Slack Integration
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          A cognitive coach embedded where decisions actually happen. Enterprise-grade with OAuth,
          multi-tenant token encryption, and HMAC signature verification.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Decision Detection',
              desc: 'Auto-identifies decisions from message patterns (approve, reject, escalate, override)',
            },
            {
              title: 'Pre-Decision Coaching',
              desc: 'Detects deliberation ("should we", "thinking about") and nudges BEFORE the vote',
            },
            {
              title: 'Org-Calibrated Nudges',
              desc: 'Messages enriched with org bias history: "In your org, anchoring confirmed 73% of the time"',
            },
            {
              title: 'Thread Bias Accumulation',
              desc: 'Tracks biases across thread messages — only nudges for NEW biases, no repeats',
            },
            {
              title: 'Audit Summary Card',
              desc: 'Rich Block Kit card posted when commitment detected: score, biases, summary, link',
            },
            {
              title: '/di Commands',
              desc: 'analyze, prior, outcome, status, help — full Slack-native workflow',
            },
            {
              title: 'App Home Dashboard',
              desc: 'Calibration level, recent decisions, pending outcomes, twin effectiveness',
            },
            {
              title: 'Interactive Feedback',
              desc: 'Helpful/Not relevant buttons calibrate future nudges and adjust graph edge weights',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <ul
          style={{
            fontSize: 13,
            color: 'var(--text-secondary, #b4b4bc)',
            lineHeight: 1.8,
            paddingLeft: 16,
            marginTop: 12,
          }}
        >
          <li>
            <strong>Setup Guide UI:</strong> Step-by-step wizard in Settings → Integrations with
            connection status indicators
          </li>
          <li>
            <strong>Token Expiry Detection:</strong> Automatic detection of revoked/expired tokens
            with markInstallationInactive()
          </li>
          <li>
            <strong>Error Recovery:</strong> Graceful handling of auth failures in nudge delivery
            with structured logging
          </li>
        </ul>
      </div>

      {/* Slack Deep Analysis */}
      <div style={{ ...card, borderTop: '3px solid #4A154B' }}>
        <div style={sectionTitle}>
          <MessageSquare size={18} style={{ color: '#4A154B' }} /> Slack Deep Thread Analysis
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Run <code>/di analyze</code> inside any Slack thread to trigger a full decision analysis.
          The bot fetches all thread messages, combines them with timestamps and speaker
          attribution, and runs the complete analysis pipeline — then posts rich results back to the
          thread.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Thread Fetching',
              desc: 'conversations.replies API with pagination for threads with 100+ messages',
            },
            {
              title: 'Speaker Attribution',
              desc: 'Each message tagged with user + timestamp — detects group dynamics and influence patterns',
            },
            {
              title: 'Full Pipeline',
              desc: 'Creates a Document record and runs the same 12-node analysis pipeline as uploaded docs',
            },
            {
              title: 'In-Thread Results',
              desc: 'Rich Block Kit card posted directly to the thread with score, biases, and dashboard link',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Forwarding */}
      <div style={{ ...card, borderTop: '3px solid #16A34A' }}>
        <div style={sectionTitle}>
          <Mail size={18} style={{ color: '#16A34A' }} /> Email Forwarding Integration
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Every user gets a unique email address (<code>analyze+token@in.decision-intel.com</code>).
          Forward any document or paste decision text — auto-analyzed with results emailed back.
          Zero setup, works from any email client on any device.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'Attachment Parsing',
              desc: 'PDF, DOCX, XLSX, CSV, PPTX extracted and analyzed automatically',
            },
            {
              title: 'Body Text Fallback',
              desc: 'No attachment? Email body text is analyzed as a decision document',
            },
            {
              title: 'Confirmation Email',
              desc: 'Immediate reply with link to results in dashboard',
            },
            {
              title: 'Secure Token Auth',
              desc: 'Unique per-user token, Resend webhook HMAC verification, rate + plan limits',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Drive */}
      <div style={{ ...card, borderTop: '3px solid #4285F4' }}>
        <div style={sectionTitle}>
          <HardDrive size={18} style={{ color: '#4285F4' }} /> Google Drive Connector
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Connect Google Drive, select folders to watch. New documents are auto-analyzed every 10
          minutes. For PE/VC firms, deal memos landing in Drive are analyzed before anyone opens
          them.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              title: 'OAuth 2.0 Connection',
              desc: 'Secure Google OAuth with encrypted refresh token storage (AES-256-GCM)',
            },
            {
              title: 'Folder Watch',
              desc: 'Select specific folders to monitor — only watched folders trigger analysis',
            },
            {
              title: 'Google Docs Support',
              desc: 'Google Docs, Sheets, Slides auto-exported to analyzable format + all standard files',
            },
            {
              title: 'Polling Cron Job',
              desc: 'Drive Changes API polled every 10 min. Deduplication via file ID tracking',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Browser Extension */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#f59e0b' }} /> Browser Extension (Chrome)
        </div>
        <ul
          style={{
            fontSize: 13,
            color: 'var(--text-secondary, #b4b4bc)',
            lineHeight: 1.8,
            paddingLeft: 16,
          }}
        >
          <li>
            <strong>Quick Score Popup:</strong> &lt;5 second bias-only scan from any webpage. Sends
            to <code>/api/extension/quick-score</code>
          </li>
          <li>
            <strong>Full Analysis Sidepanel:</strong> Complete 12-node pipeline from the browser.
            Calls <code>/api/extension/analyze</code>
          </li>
          <li>
            <strong>Auth:</strong> API key + user ID via extension options. Rate limited: 30 req/hr
            (quick) / 10 req/hr (full)
          </li>
          <li>
            <strong>Content Script:</strong> Annotates page text with detected biases inline
          </li>
          <li>
            <strong>PDF Support:</strong> Extracts text from PDF tabs for analysis
          </li>
        </ul>
      </div>

      {/* Product Analytics */}
      <div style={card}>
        <div style={sectionTitle}>
          <BarChart3 size={18} style={{ color: '#06b6d4' }} /> Product Analytics
        </div>
        <ul
          style={{
            fontSize: 13,
            color: 'var(--text-secondary, #b4b4bc)',
            lineHeight: 1.8,
            paddingLeft: 16,
          }}
        >
          <li>
            <strong>Client Library:</strong> <code>trackEvent(name, properties)</code> —
            fire-and-forget, no await needed
          </li>
          <li>
            <strong>API Endpoint:</strong> <code>POST /api/analytics/events</code> — stores in
            AnalyticsEvent table, auth optional
          </li>
          <li>
            <strong>Key Events:</strong> demo_viewed, demo_sample_selected, roi_calculator_used,
            case_study_shared, extension_installed, slack_connected, signup_started,
            first_analysis_completed
          </li>
          <li>
            <strong>Schema Drift Safe:</strong> Returns 200 silently if table doesn&apos;t exist
          </li>
        </ul>
      </div>

      {/* Decision Knowledge Graph */}
      <div style={card}>
        <div style={sectionTitle}>
          <Network size={18} style={{ color: '#3b82f6' }} /> Decision Knowledge Graph
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}
        >
          {[
            {
              title: '8 Edge Types',
              desc: 'influenced_by, escalated_from, reversed, depends_on, similar_to, shared_bias, same_participants, cross_department',
            },
            {
              title: '5 Node Types',
              desc: 'analysis, human_decision, person, bias_pattern, outcome',
            },
            {
              title: '5 Anti-Patterns',
              desc: 'Echo chamber clusters, cascade failures, bias concentration, isolated high-risk, knowledge fragmentation',
            },
            {
              title: 'Multi-Touch Attribution',
              desc: 'BFS path tracing: "Decision A contributed X% to Decision B\'s outcome"',
            },
            {
              title: 'Edge Learning',
              desc: 'Outcome-driven: edge strength adjusts when outcomes are reported',
            },
            {
              title: 'Temporal Inference',
              desc: 'Granger-causality for causal strength between sequential decisions',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: 'var(--bg-tertiary, #0a0a0a)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Flywheel */}
      <div style={{ ...card, borderLeft: '3px solid #22c55e' }}>
        <div style={sectionTitle}>
          <TrendingUp size={18} style={{ color: '#22c55e' }} /> Behavioral Data Flywheel
        </div>
        <pre
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            background: 'var(--bg-tertiary, #0a0a0a)',
            padding: 16,
            borderRadius: 8,
            lineHeight: 1.6,
          }}
        >
          {`Analysis ──> BiasInstance + DecisionOutcome (user feedback)
    │
    ├── Calibration: recalibrateBiasSeverity() [runs on cron]
    │   ├── Confirmation rates per bias type
    │   ├── Failure impact per bias
    │   └── Adjust severity weights 0.5x to 1.5x
    │
    ├── Nudge Suppression: suppress types users mark unhelpful
    │
    ├── Twin Effectiveness: track which personas' dissent was accurate
    │
    └── Autonomous Detection: 3 channels (documents, Slack, web)
        └── DraftOutcomes ──> one-click confirm ──> feeds calibration`}
        </pre>
      </div>

      {/* Committee Rooms + Calibration */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card}>
          <div style={sectionTitle}>
            <Users size={16} style={{ color: '#16A34A' }} /> Committee Decision Rooms
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>Types: investment_committee, board_review, deal_committee, risk_committee</li>
            <li>Blind prior collection — independent assessments before group discussion</li>
            <li>Consensus scoring (0-100) computed on room close</li>
            <li>Auto-generated bias briefing from linked analysis</li>
            <li>
              Pre-meeting checklist: dissenter, pre-mortem, base rates, criteria, blind priors
            </li>
            <li>Committee prior gap nudge: alerts when members haven&apos;t submitted</li>
          </ul>
        </div>
        <div style={card}>
          <div style={sectionTitle}>
            <TrendingUp size={16} style={{ color: '#22c55e' }} /> Calibration Gamification
          </div>
          <ul
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 14,
            }}
          >
            <li>
              <span style={badge('#CD7F32')}>Bronze</span> 0-4 outcomes reported
            </li>
            <li>
              <span style={badge('#C0C0C0')}>Silver</span> 5-14 outcomes, &gt;50% accuracy
            </li>
            <li>
              <span style={badge('#FFD700')}>Gold</span> 15-29 outcomes, &gt;60% accuracy
            </li>
            <li>
              <span style={badge('#E5E4E2')}>Platinum</span> 30+ outcomes, &gt;70% accuracy
            </li>
            <li>Progress bar toward next level with encouraging messaging</li>
            <li>Milestone tracking at 5, 10, 15, 25, 50 outcomes</li>
            <li>
              Replaces punitive &quot;you must report&quot; with &quot;each outcome makes AI
              smarter&quot;
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
