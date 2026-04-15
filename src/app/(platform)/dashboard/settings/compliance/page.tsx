'use client';

import { useState } from 'react';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ─── Static compliance mapping: DI features → framework controls ────────────

interface ControlMapping {
  controlId: string;
  controlName: string;
  description: string;
  diFeature: string;
  status: 'pass' | 'configured' | 'partial';
}

interface FrameworkPosture {
  id: string;
  name: string;
  jurisdiction: string;
  category: string;
  controls: ControlMapping[];
}

const FRAMEWORKS: FrameworkPosture[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    jurisdiction: 'US',
    category: 'Trust Services',
    controls: [
      {
        controlId: 'CC6.1',
        controlName: 'Logical Access',
        description: 'Restricts logical access to information assets',
        diFeature:
          'Supabase Auth with Google OAuth, role-based TeamMember access, API key scoping with granular permissions',
        status: 'pass',
      },
      {
        controlId: 'CC6.3',
        controlName: 'Access Removal',
        description: 'Removes access when no longer required',
        diFeature:
          'Team invite revocation, API key expiration, session management via Supabase Auth',
        status: 'pass',
      },
      {
        controlId: 'CC7.2',
        controlName: 'System Monitoring',
        description: 'Monitors system components for anomalies',
        diFeature:
          'AuditLog model tracking all actions, /api/health endpoint with 7 service checks, Sentry error tracking, error fingerprinting with deduplication',
        status: 'pass',
      },
      {
        controlId: 'CC8.1',
        controlName: 'Change Management',
        description: 'Authorizes, documents, and controls changes',
        diFeature:
          'AnalysisVersion model for result versioning, PromptVersion model for prompt tracking, Git-based CI/CD with automated tests',
        status: 'pass',
      },
      {
        controlId: 'CC6.6',
        controlName: 'Encryption',
        description: 'Protects data in transit and at rest',
        diFeature:
          'AES-256-GCM encryption for documents (DOCUMENT_ENCRYPTION_KEY) and Slack tokens (SLACK_TOKEN_ENCRYPTION_KEY), HTTPS enforced via HSTS headers',
        status: 'pass',
      },
      {
        controlId: 'CC7.4',
        controlName: 'Incident Response',
        description: 'Responds to identified security incidents',
        diFeature:
          'Error tracking with fingerprinting, critical error auto-logging to AuditLog, structured logging with severity levels',
        status: 'configured',
      },
    ],
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    jurisdiction: 'International',
    category: 'Information Security',
    controls: [
      {
        controlId: 'A.8.2',
        controlName: 'Information Classification',
        description: 'Classifies information according to business needs',
        diFeature:
          'GDPR anonymizer strips PII before LLM processing, document encryption at rest, content classification via analysis pipeline',
        status: 'pass',
      },
      {
        controlId: 'A.8.10',
        controlName: 'Information Deletion',
        description: 'Deletes information when no longer required',
        diFeature:
          'Document deletion API with cascade cleanup, CacheEntry TTL-based expiration with probabilistic pruning',
        status: 'pass',
      },
      {
        controlId: 'A.9.4',
        controlName: 'System Access Control',
        description: 'Restricts access to systems and applications',
        diFeature:
          'Rate limiting (Postgres-backed with in-memory deny cache), CSRF protection, API key authentication with scope validation',
        status: 'pass',
      },
      {
        controlId: 'A.12.4',
        controlName: 'Logging and Monitoring',
        description: 'Produces, stores, and reviews event logs',
        diFeature:
          'AuditLog model with action/resource/timestamp tracking, CSV export for compliance audits, NotificationLog for delivery tracking',
        status: 'pass',
      },
      {
        controlId: 'A.14.2',
        controlName: 'Security in Development',
        description: 'Ensures security in the development lifecycle',
        diFeature:
          '586+ automated tests, Vitest + Playwright E2E, pre-commit hooks via Husky, dependency vulnerability scanning',
        status: 'configured',
      },
    ],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    jurisdiction: 'EU',
    category: 'Data Privacy',
    controls: [
      {
        controlId: 'Art. 25',
        controlName: 'Data Protection by Design',
        description: 'Implements appropriate technical measures for data protection',
        diFeature:
          'GDPR anonymizer as first pipeline node, PII never reaches LLM layer, AES-256-GCM encryption for stored documents',
        status: 'pass',
      },
      {
        controlId: 'Art. 30',
        controlName: 'Records of Processing',
        description: 'Maintains records of processing activities',
        diFeature:
          'AuditLog captures all document access, analysis runs, and data exports with timestamps and user IDs',
        status: 'pass',
      },
      {
        controlId: 'Art. 32',
        controlName: 'Security of Processing',
        description: 'Ensures appropriate security for personal data processing',
        diFeature:
          'Encryption at rest and in transit, timing-safe secret comparison, HMAC-signed webhooks, SSRF protection on outbound requests',
        status: 'pass',
      },
      {
        controlId: 'Art. 17',
        controlName: 'Right to Erasure',
        description: 'Enables deletion of personal data on request',
        diFeature:
          'Document deletion with cascade to Analysis, BiasInstance, and related records. Cache cleanup via TTL expiration.',
        status: 'configured',
      },
    ],
  },
  {
    id: 'eu_ai_act',
    name: 'EU AI Act',
    jurisdiction: 'EU',
    category: 'AI Governance',
    controls: [
      {
        controlId: 'Art. 10',
        controlName: 'Data Governance',
        description: 'Training data must be relevant, representative, and free of errors',
        diFeature:
          '146 annotated case studies with pre-decision evidence, curated bias taxonomy (DI-B-001 through DI-B-020), academic citations for all bias detection methodology',
        status: 'pass',
      },
      {
        controlId: 'Art. 13',
        controlName: 'Transparency',
        description: 'AI systems must be sufficiently transparent',
        diFeature:
          'DQI score breakdown (6 components with exact weights), bias detection with excerpt highlighting, Explainability tab in Analytics, PromptVersion tracking',
        status: 'pass',
      },
      {
        controlId: 'Art. 14',
        controlName: 'Human Oversight',
        description: 'AI systems must enable human oversight',
        diFeature:
          'Human-in-the-loop via Outcome Gate (confirmed/false-positive bias ratings), Decision Rooms with blind priors, thumbs-up/down on nudges',
        status: 'pass',
      },
      {
        controlId: 'Art. 15',
        controlName: 'Accuracy & Robustness',
        description: 'AI systems must be accurate, robust, and cybersecure',
        diFeature:
          'Multi-model fallback (Gemini → Claude), 3-judge noise scoring, A/B prompt testing with Thompson sampling, circuit breaker resilience patterns',
        status: 'pass',
      },
    ],
  },
];

// ─── Components ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pass: { label: 'Satisfied', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  configured: { label: 'Configured', color: '#0284c7', bg: 'rgba(2,132,199,0.1)' },
  partial: { label: 'Partial', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
};

function StatusBadge({ status }: { status: 'pass' | 'configured' | 'partial' }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 'var(--radius-full, 9999px)',
        background: config.bg,
        color: config.color,
      }}
    >
      {status === 'pass' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
      {config.label}
    </span>
  );
}

function FrameworkCard({ framework }: { framework: FrameworkPosture }) {
  const [expanded, setExpanded] = useState(false);
  const passCount = framework.controls.filter(c => c.status === 'pass').length;
  const coveragePercent = Math.round((passCount / framework.controls.length) * 100);

  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl, 16px)',
        background: 'var(--bg-card, rgba(0,0,0,0.01))',
        border: '1px solid var(--border-color, rgba(0,0,0,0.15))',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={20} style={{ color: 'var(--accent-primary, #16a34a)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{framework.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {framework.jurisdiction} &middot; {framework.category}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: coveragePercent === 100 ? 'var(--success)' : 'var(--text-primary)',
              }}
            >
              {coveragePercent}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {passCount}/{framework.controls.length} controls
            </div>
          </div>
          {expanded ? (
            <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </button>

      {/* Controls list */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {framework.controls.map(control => (
            <div
              key={control.controlId}
              style={{
                padding: 16,
                borderRadius: 'var(--radius-lg, 12px)',
                background: 'var(--bg-tertiary, #f3f4f6)',
                border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {control.controlId}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {control.controlName}
                  </span>
                </div>
                <StatusBadge status={control.status} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {control.description}
              </p>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: 'var(--bg-card, rgba(0,0,0,0.02))',
                  borderLeft: '3px solid var(--accent-primary, #16a34a)',
                }}
              >
                <strong>Decision Intel:</strong> {control.diFeature}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CompliancePosturePage() {
  const totalControls = FRAMEWORKS.reduce((sum, f) => sum + f.controls.length, 0);
  const passControls = FRAMEWORKS.reduce(
    (sum, f) => sum + f.controls.filter(c => c.status === 'pass').length,
    0
  );

  return (
    <ErrorBoundary sectionName="Compliance Posture">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Shield size={24} style={{ color: 'var(--accent-primary, #16a34a)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Compliance Posture
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Decision Intel maps to {totalControls} compliance controls across {FRAMEWORKS.length}{' '}
            frameworks. {passControls} controls are fully satisfied by existing platform features.
          </p>
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {FRAMEWORKS.map(f => {
            const pass = f.controls.filter(c => c.status === 'pass').length;
            return (
              <div
                key={f.id}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-lg, 12px)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 6,
                  }}
                >
                  {f.name}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: pass === f.controls.length ? 'var(--success)' : 'var(--text-primary)',
                  }}
                >
                  {pass}/{f.controls.length}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>controls satisfied</div>
              </div>
            );
          })}
        </div>

        {/* Framework details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FRAMEWORKS.map(framework => (
            <FrameworkCard key={framework.id} framework={framework} />
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 32,
            padding: 16,
            borderRadius: 'var(--radius-lg, 12px)',
            background: 'var(--bg-tertiary, #f3f4f6)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            This compliance posture is indicative and based on platform feature analysis. Consult
            your compliance team for formal certification requirements. For enterprise audit packet
            generation, see{' '}
            <a
              href="/dashboard/settings?tab=audit-log"
              style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
            >
              Audit Log{' '}
              <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}
