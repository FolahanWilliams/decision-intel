'use client';

import { AlertTriangle, Users, TrendingUp, Zap } from 'lucide-react';
import { card, sectionTitle, label, stat, tableRow } from './shared-styles';

export function ProductOverviewTab() {
  return (
    <div>
      {/* Hero */}
      <div style={{ ...card, borderTop: '3px solid #16A34A' }}>
        <div style={label}>POSITIONING</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          The Decision Performance OS for Corporate Strategy &amp; M&amp;A Teams
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #b4b4bc)', lineHeight: 1.6 }}>
          Audit every strategic decision for cognitive bias and decision noise. Protect business
          outcomes. AI-powered cognitive auditing purpose-built for corporate strategy and M&amp;A
          teams.
        </p>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { value: '20', label: 'Standard Biases', sub: '+ 11 investment-specific' },
          { value: '12', label: 'Pipeline Nodes', sub: '7-way parallel fan-out' },
          { value: '146', label: 'Case Studies', sub: 'failures + successes' },
          { value: '3', label: 'Outcome Channels', sub: 'Autonomous detection' },
          { value: '2', label: 'AI Providers', sub: 'Gemini + Claude fallback' },
          { value: '6', label: 'Touchpoints', sub: 'Web, Slack, Drive, Email, Extension, API' },
        ].map((m, i) => (
          <div key={i} style={card}>
            <div style={stat}>{m.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
              {m.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* The Problem */}
      <div style={card}>
        <div style={sectionTitle}>
          <AlertTriangle size={18} style={{ color: '#ef4444' }} /> The Problem
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
            Executive teams make high-stakes decisions on documents riddled with cognitive biases
            nobody detects
          </li>
          <li>A single bad strategic decision costs organizations millions in value destruction</li>
          <li>
            Decision-makers anchored to initial assumptions hold failing initiatives 40% longer than
            optimal
          </li>
          <li>
            Competitive pressure and time constraints trigger overconfidence and groupthink in 65%
            of major decisions (Malmendier &amp; Tate, 2008)
          </li>
          <li>
            Confirmation bias in due diligence causes teams to rubber-stamp rather than stress-test
            strategies
          </li>
          <li>
            No organization has a way to track which biases actually correlated with poor outcomes
          </li>
        </ul>
      </div>

      {/* Value Prop by Persona */}
      <div style={card}>
        <div style={sectionTitle}>
          <Users size={18} style={{ color: '#3b82f6' }} /> Value by Persona
        </div>
        <div
          style={{
            ...tableRow,
            fontWeight: 700,
            color: 'var(--text-primary, #fff)',
            borderBottom: '2px solid var(--border-primary, #222)',
          }}
        >
          <div>Persona</div>
          <div>Pain Point</div>
          <div>What We Deliver</div>
        </div>
        {[
          [
            'Strategy Leaders',
            'No systematic decision quality measurement',
            'Document-level DQI scoring (0-100), bias tracking across projects',
          ],
          [
            'M&A / Decision Owners',
            'Memos anchored to initial assumptions',
            '20 cognitive biases detected with exact excerpts + coaching',
          ],
          [
            'Risk & Compliance',
            'Operational optimism in execution plans',
            'Boardroom simulation with custom personas (Risk, Ops, Finance, Domain)',
          ],
          [
            'Board / Stakeholders',
            'Reports cherry-pick metrics and frame selectively',
            'Document analysis: survivorship bias, selective reporting, framing',
          ],
          [
            'Executive Committees',
            'Groupthink silences genuine debate',
            'Blind voting, noise measurement, dissent tracking',
          ],
        ].map(([persona, pain, deliver], i) => (
          <div key={i} style={{ ...tableRow, color: 'var(--text-secondary, #b4b4bc)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary, #fff)' }}>{persona}</div>
            <div>{pain}</div>
            <div>{deliver}</div>
          </div>
        ))}
      </div>

      {/* ROI */}
      <div style={{ ...card, borderLeft: '3px solid #22c55e' }}>
        <div style={sectionTitle}>
          <TrendingUp size={18} style={{ color: '#22c55e' }} /> ROI Story
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #b4b4bc)', lineHeight: 1.7 }}>
          A single avoided bad decision saves organizations{' '}
          <strong style={{ color: '#22c55e' }}>millions to billions</strong> in value. The platform
          pays for itself after one corrected thesis. Organizations using systematic decision
          hygiene report <strong style={{ color: '#22c55e' }}>up to 60% reduction</strong> in
          decision variance.
        </p>
      </div>

      {/* Recently Shipped */}
      <div style={card}>
        <div style={sectionTitle}>
          <Zap size={18} style={{ color: '#8b5cf6' }} /> Recently Shipped
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
            <strong>Email Forwarding Integration</strong> — Unique email address per user (analyze+
            {'{token}'}@in.decision-intel.com). Forward documents or paste text, auto-analyzed with
            results emailed back.
          </li>
          <li>
            <strong>Google Drive Connector</strong> — OAuth 2.0 integration. Watch folders for new
            documents, auto-analyze every 10 minutes. Folder picker UI in Settings.
          </li>
          <li>
            <strong>Slack Deep Thread Analysis</strong> — <code>/di analyze</code> in threads
            fetches all messages, runs full analysis, posts rich results back. Zero-friction.
          </li>
          <li>
            <strong>Forgotten Questions Node</strong> — 12th pipeline node surfaces
            unknown-unknowns: questions the document should address but doesn&apos;t.
          </li>
          <li>
            <strong>Free 30-Day Pilot</strong> — Full platform access on a live deal to seed the
            Knowledge Graph. Converts to Corp Dev subscription ($2,499/mo) at trial end.
          </li>
          <li>
            <strong>Toxic Mitigation Playbooks</strong> — Auto-generated research-backed debiasing
            steps for all 10 named patterns with owner, timing, and citations.
          </li>
          <li>
            <strong>Dollar Impact Estimation</strong> — Connects toxic combos to deal ticketSize for
            financial risk estimates (ticketSize × historicalFailRate).
          </li>
          <li>
            <strong>Decision Alpha</strong> — Public CEO bias analysis (Buffett, Musk, Huang,
            Zuckerberg) with DQI leaderboard.
          </li>
          <li>
            <strong>Investor Defense Tab</strong> — Competitive positioning vs. Cloverpop, moat
            layers, objection handling with technical proof points.
          </li>
          <li>
            <strong>Slack → Copilot Auto-Trigger</strong> — Auto-creates CopilotSession seeded with
            decision context after every Slack audit. &quot;Continue in Copilot&quot; button in
            Slack messages for seamless handoff.
          </li>
          <li>
            <strong>Intelligence Brief on Empty States</strong> — Contextual org intelligence (top
            dangerous biases, maturity grade, decision stats) replaces generic empty states across 4
            dashboard pages.
          </li>
          <li>
            <strong>Enhanced Slack Commands</strong> — 7 slash commands with rich Block Kit:{' '}
            <code>/di help</code> (categorized), <code>/di score</code> (instant bias check),{' '}
            <code>/di brief</code> (org intelligence), <code>/di status</code> (quality trends),{' '}
            <code>/di analyze</code> (with Copilot link).
          </li>
          <li>
            <strong>Bias Heat Map Enhancement</strong> — Density gutter minimap, confidence-based
            opacity, hover tooltips with excerpts, keyboard navigation (←→ cycle, H toggle).
          </li>
          <li>
            <strong>Enterprise Language Pivot</strong> — Decision types renamed from PE/VC-specific
            to enterprise-neutral (resource allocation, strategic proposal, initiative closure).
          </li>
          <li>
            <strong>Klein RPD Framework</strong> — Expert intuition amplification: pattern
            recognition cues, narrative pre-mortems, RPD mental simulator, personal calibration
            dashboard.
          </li>
          <li>
            <strong>Enhanced Public Demo</strong> — Streaming simulation UX with 3 sample docs, DQI
            badge, no login required at <code>/demo</code>
          </li>
          <li>
            <strong>Case Study Export</strong> — One-click anonymized, branded shareable analyses
            with permanent links for stakeholder reporting
          </li>
          <li>
            <strong>Browser Extension</strong> — Chrome extension with quick-score popup (&lt;5s)
            and full analysis sidepanel
          </li>
          <li>
            <strong>A/B Prompt Testing</strong> — Experiment CRUD with Thompson sampling
            auto-optimization
          </li>
          <li>
            <strong>Multi-Model Fallback</strong> — Gemini → Claude failover routing
          </li>
          <li>
            <strong>Quick Bias Check</strong> — Dashboard modal for instant &lt;5s bias scan via
            paste, shared Gemini utility across extension + platform
          </li>
          <li>
            <strong>Counterfactual Analysis API</strong> — &quot;What-if&quot; decision path
            computation with narrative explanations
          </li>
        </ul>
      </div>
    </div>
  );
}
