import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Decision Intel collects, uses, and protects your data. GDPR-compliant data processing for M&A and investment decision analysis.',
};

export default function PrivacyPolicyPage() {
  return (
    <main
      className="min-h-screen py-24 px-6"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-8 hover:text-white transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          &larr; Back to Home
        </Link>

        <h1
          style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: '8px',
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '48px' }}>
          Last updated: March 29, 2026
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            fontSize: '0.9rem',
            lineHeight: 1.8,
            color: 'var(--text-muted)',
          }}
        >
          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              1. Introduction
            </h2>
            <p>
              Decision Intel (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the
              decision-intel.com platform. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our AI-powered decision
              intelligence platform, including our web application, browser extension, Slack
              integration, and API.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              2. Information We Collect
            </h2>
            <p style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Account Information:</strong> When
              you create an account, we collect your name, email address, and organization details
              via Google OAuth through Supabase. We do not store your Google password.
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>
                Documents &amp; Analysis Data:
              </strong>{' '}
              Investment memos, IC papers, and other documents you upload for analysis. These are
              processed by our AI pipeline and stored in encrypted form (AES-256-GCM) when
              encryption is enabled.
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Usage Data:</strong> We collect
              analytics events, feature usage patterns, and performance metrics to improve the
              platform. This includes pages visited, features used, and analysis completion rates.
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Integration Data:</strong> If you
              connect Slack, we store encrypted workspace tokens and process messages you explicitly
              route through our bot. We do not access your full Slack history.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              3. How We Use Your Information
            </h2>
            <ul
              style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <li>Perform cognitive bias and decision noise analysis on your uploaded documents</li>
              <li>Generate Decision Quality Index (DQI) scores and improvement recommendations</li>
              <li>Track decision outcomes and calibrate accuracy over time</li>
              <li>Send analysis results and nudges via Slack or email</li>
              <li>
                Improve our AI models and analysis accuracy (using anonymized, aggregated data only)
              </li>
              <li>Provide customer support and respond to inquiries</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              4. Data Protection &amp; Security
            </h2>
            <p style={{ marginBottom: '12px' }}>
              We take the security of your investment data seriously. Our platform implements:
            </p>
            <ul
              style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Encryption at rest:</strong>{' '}
                Document content encrypted with AES-256-GCM
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Encryption in transit:</strong> All
                communications secured via TLS 1.2+
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>GDPR Anonymization:</strong> PII is
                automatically detected and redacted before AI processing
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Access controls:</strong>{' '}
                Organization-based data isolation with role-based permissions
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Audit logging:</strong> All user
                actions are logged for compliance and transparency
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              5. GDPR &amp; Data Subject Rights
            </h2>
            <p style={{ marginBottom: '12px' }}>
              If you are located in the European Economic Area (EEA), United Kingdom, or a
              jurisdiction with similar data protection laws, you have the following rights:
            </p>
            <ul
              style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Right to access:</strong> Request a
                copy of your personal data
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Right to rectification:</strong>{' '}
                Correct inaccurate personal data
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Right to erasure:</strong> Request
                deletion of your account and all associated data
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Right to portability:</strong>{' '}
                Export your data in a machine-readable format
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Right to object:</strong> Opt out
                of certain processing activities
              </li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              To exercise any of these rights, contact us at{' '}
              <a
                href="mailto:folahanwilliams@gmail.com"
                style={{ color: '#FFFFFF', textDecoration: 'underline' }}
              >
                folahanwilliams@gmail.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              6. Third-Party Services
            </h2>
            <p style={{ marginBottom: '12px' }}>We use the following third-party services:</p>
            <ul
              style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Supabase:</strong> Authentication
                and database hosting
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Google AI (Gemini):</strong>{' '}
                Document analysis and bias detection (data is processed per Google&apos;s AI data
                usage policies and is not used to train models)
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Stripe:</strong> Payment processing
                (we do not store credit card information)
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Sentry:</strong> Error tracking and
                performance monitoring
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Vercel:</strong> Application
                hosting
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              7. Data Retention
            </h2>
            <p>
              We retain your data for as long as your account is active. Upon account deletion, all
              personal data, uploaded documents, analyses, and associated records are permanently
              deleted within 30 days. Anonymized, aggregated analytics data may be retained
              indefinitely for platform improvement.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              8. Cookies
            </h2>
            <p>
              We use essential cookies for authentication session management (Supabase session
              cookies). We do not use third-party tracking cookies or advertising cookies. Analytics
              data is collected server-side without cookies.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new policy on this page and updating the &quot;Last
              updated&quot; date. Your continued use of the platform after changes are posted
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p style={{ marginTop: '8px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Email:</strong>{' '}
              <a
                href="mailto:folahanwilliams@gmail.com"
                style={{ color: '#FFFFFF', textDecoration: 'underline' }}
              >
                folahanwilliams@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
