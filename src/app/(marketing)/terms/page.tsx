import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Decision Intel',
  description:
    'Terms and conditions for using Decision Intel, the native reasoning layer for every high-stakes call across corporate strategy, M&A, and fund-investment teams.',
  openGraph: {
    title: 'Terms of Service | Decision Intel',
    description:
      'Terms and conditions for using Decision Intel, the native reasoning layer for every high-stakes call across corporate strategy, M&A, and fund-investment teams.',
  },
};

export default function TermsOfServicePage() {
  return (
    <main
      className="min-h-screen py-24 px-6"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-8 hover:[color:var(--text-primary)] transition-colors"
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
          Terms of Service
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '48px' }}>
          Last updated: April 30, 2026
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
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Decision Intel (&quot;the Platform&quot;), you agree to be bound
              by these Terms of Service. If you are using the Platform on behalf of an organization,
              you represent that you have the authority to bind that organization to these terms. If
              you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              2. Description of Service
            </h2>
            <p>
              Decision Intel is the native reasoning layer for every high-stakes call. The Platform
              analyzes strategic documents for cognitive bias and decision noise, and provides bias
              detection, noise scoring, decision quality indexing, outcome tracking, and related
              analytics tools. Analysis results are generated with the assistance of
              machine-learning models and should be used as a supplement to, not a replacement for,
              professional judgment.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              3. Account Registration
            </h2>
            <p style={{ marginBottom: '12px' }}>
              To use the Platform, you must create an account using Google OAuth. You are
              responsible for:
            </p>
            <ul
              style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>
                Ensuring that your use of the Platform complies with all applicable laws and
                regulations
              </li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              4. Subscription Plans &amp; Billing
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The Platform offers free and paid subscription tiers. For paid plans:
            </p>
            <ul
              style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <li>Billing occurs monthly or annually depending on your selected plan</li>
              <li>
                You may cancel your subscription at any time; access continues until the end of the
                current billing period
              </li>
              <li>Refunds are handled on a case-by-case basis within 14 days of purchase</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice</li>
              <li>Payment processing is handled securely through Stripe</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              5. Acceptable Use
            </h2>
            <p style={{ marginBottom: '12px' }}>You agree not to:</p>
            <ul
              style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <li>
                Upload documents containing illegal content or that you do not have the right to
                analyze
              </li>
              <li>
                Attempt to reverse-engineer, decompile, or extract our proprietary algorithms, bias
                detection models, or scoring methodologies
              </li>
              <li>
                Use the Platform to make automated strategic decisions without human oversight
              </li>
              <li>
                Share your account credentials or allow unauthorized users to access the Platform
              </li>
              <li>Circumvent rate limits, usage quotas, or other technical restrictions</li>
              <li>Use the Platform in any way that could harm, disable, or impair our services</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              6. Intellectual Property
            </h2>
            <p style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Your Content:</strong> You retain
              ownership of all documents and data you upload to the Platform. By uploading, you
              grant us a limited license to process your content solely for the purpose of providing
              analysis services to you.
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Our Platform:</strong> The Decision
              Intel platform, including its AI pipeline, Decision Quality Index methodology, bias
              interaction matrix, noise scoring algorithms, causal models, and all related
              intellectual property, is owned by Decision Intel. You may not copy, modify, or create
              derivative works based on our proprietary technology.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              7. AI-Generated Content Disclaimer
            </h2>
            <p>
              Analysis results, bias detections, noise scores, and recommendations generated by the
              Platform are produced by artificial intelligence models. While we strive for accuracy,
              AI-generated content may contain errors, omissions, or inaccuracies.{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                Decision Intel does not provide investment or strategic advice.
              </strong>{' '}
              Our analysis is intended to augment human decision-making, not replace it. You are
              solely responsible for any decisions made based on Platform outputs.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              8. Confidentiality
            </h2>
            <p>
              We understand that documents uploaded to the Platform may contain confidential and
              commercially sensitive information. We commit to treating all uploaded documents as
              confidential, processing them only for providing our services, and not sharing them
              with third parties except as required by our data processing pipeline (see Privacy
              Policy). Documents are encrypted at rest and PII is automatically redacted before AI
              processing.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Decision Intel shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including but not
              limited to loss of profits, data, or investment returns, arising from your use of the
              Platform. Our total liability for any claim shall not exceed the amount you paid us in
              the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10. Termination
            </h2>
            <p>
              We may suspend or terminate your account if you violate these Terms. You may delete
              your account at any time through the Platform settings. Upon termination, your data
              will be handled in accordance with our Privacy Policy, including permanent deletion
              within 30 days.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10A. Data Portability on Termination
            </h2>
            <p>
              On any termination, you may request a machine-readable export of all Analyses,
              Decision Provenance Records, blind priors, outcomes, and associated metadata in JSON
              + PDF format. We will fulfil the request within fourteen (14) calendar days.
              Production data is preserved against deletion during any active export window (up to
              thirty days post-termination) before the standard 30-day permanent purge runs.
            </p>
            <p style={{ marginTop: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>
                GDPR Article 20 — raw-document portability.
              </strong>{' '}
              The standard export bundle contains derived artefacts (Analyses, DPRs, outcomes,
              metadata). Source documents you uploaded are NOT included in the standard bundle for
              storage-economy reasons. To the extent any source document constitutes personal data
              under GDPR Article 4, you may request a raw-document export covering all source files
              you authored or controlled by writing to{' '}
              <a
                href="mailto:compliance@decision-intel.com"
                style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
              >
                compliance@decision-intel.com
              </a>
              . Raw-document requests are fulfilled within fourteen (14) calendar days of the
              request, in the original file format with associated content hashes. This mechanism
              honours your portability right under GDPR Art. 20 and the equivalent rights under
              UK GDPR, NDPR (Nigeria), PoPIA (South Africa), and CMA (Kenya).
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10B. Exit Assistance (Enterprise)
            </h2>
            <p>
              For thirty (30) calendar days following termination of an Enterprise subscription, the
              account retains read-only access to the dashboard archive (no new audits) for the
              express purpose of completing the export under §10A. No additional fee applies. After
              that window the account is permanently disabled and content purged on the standard
              schedule.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10C. Service Level Commitments
            </h2>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Availability targets</strong> for the
              document analysis pipeline are committed by subscription tier:
            </p>
            <ul style={{ marginTop: '8px', marginBottom: '12px', paddingLeft: '20px' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Free and Individual:</strong>{' '}
                Best-effort availability. No service-credit commitment.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Strategy:</strong> 99.5% monthly
                uptime. Recovery time objective (RTO) under 4 hours; recovery point objective
                (RPO) under 15 minutes.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Enterprise:</strong> 99.9% monthly
                uptime, RTO under 4 hours, RPO under 15 minutes. Custom SLAs available in the
                executed Order Form.
              </li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Service credits.</strong> When
              measured uptime falls below the tier target in a calendar month, eligible Strategy
              and Enterprise customers may claim a credit against the next monthly invoice:
            </p>
            <ul style={{ marginTop: '8px', marginBottom: '12px', paddingLeft: '20px' }}>
              <li>
                Below the tier target but at or above 99.0%: <strong>10% of the monthly fee</strong>{' '}
                for the affected service.
              </li>
              <li>
                Below 99.0% but at or above 95.0%: <strong>20% of the monthly fee</strong>.
              </li>
              <li>
                Below 95.0%: <strong>30% of the monthly fee</strong> (the cap).
              </li>
            </ul>
            <p>
              Service credits are claimed in writing within 30 calendar days of the affected
              month. Credits are the customer&apos;s sole and exclusive remedy for availability
              shortfalls. Scheduled maintenance windows (notified at least seven calendar days in
              advance, capped at four hours per month outside business hours) and force-majeure
              events are excluded from availability calculations. Live status is published at{' '}
              <Link
                href="/security"
                style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
              >
                /security
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10D. Security-Incident Notification
            </h2>
            <p>
              We will notify you of any confirmed security incident affecting your data within
              twenty-four (24) hours of confirmation, with a follow-up written report within
              seventy-two (72) hours describing the scope, root cause, and remediation. Where a
              regulator (EU AI Act, GDPR, NDPR, PoPIA, Basel III, SEC) requires a separate
              notification, we will support your response.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10E. Sub-Processor Change Notification
            </h2>
            <p>
              The current sub-processor list is maintained at{' '}
              <Link
                href="/security"
                style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
              >
                /security
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
              >
                /privacy
              </Link>
              . Any addition or replacement of a sub-processor that processes customer data is
              preceded by thirty (30) calendar days&apos; written notice (delivered to the account
              email of record), during which you may object on reasonable grounds.
            </p>
            <p style={{ marginTop: '12px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Objection window.</strong> You have
              fifteen (15) calendar days from the notice to register a written objection to{' '}
              <a
                href="mailto:compliance@decision-intel.com"
                style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
              >
                compliance@decision-intel.com
              </a>
              . If your objection is sustained on reasonable grounds (regulatory conflict,
              material security regression, sanctions exposure) and we are unable to offer a
              commercially-reasonable alternative within thirty (30) calendar days of the
              objection, you may terminate the affected portion of the Services without penalty
              and receive a pro-rata refund of any pre-paid fees attributable to the unused
              remainder of the term.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10H. AI Sub-Processor No-Training Commitment
            </h2>
            <p>
              The AI inference layer of the Platform uses Google Gemini and Anthropic Claude as
              sub-processors. Both providers contractually commit, in their enterprise data
              processing terms, that customer prompts and outputs are NOT used to train upstream
              foundation models. Decision Intel itself does not train or fine-tune any model on
              customer content. The current provider DPA references are mirrored at{' '}
              <Link
                href="/security"
                style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
              >
                /security
              </Link>
              {' '}
              and updated within thirty (30) days of any provider-policy change. Where a customer
              elects sovereign-AI routing (Enterprise tier, executed Order Form), the same
              no-training commitment applies to the routed alternative provider.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10F. Audit Rights (Enterprise)
            </h2>
            <p>
              Once per calendar year, on reasonable notice, you may request the most recent SOC 2
              Type II report (or equivalent attestation) covering our production environment. While
              our own product-level SOC 2 Type I report is in progress (targeted Q4 2026), customers
              receive on request the underlying SOC 2 Type II reports of Vercel and Supabase, the
              production-tier infrastructure providers, plus an executive summary of in-flight
              controls. Customer-led on-site audits are by mutual agreement and at customer cost.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              10G. Indemnification
            </h2>
            <p>
              We will defend you against third-party claims that the Platform infringes a US patent,
              copyright, or trade secret. You will defend us against third-party claims arising from
              your use of the Platform in violation of law or these Terms. Each party&apos;s
              aggregate liability under this clause is capped at the fees you paid us in the twelve
              (12) months preceding the claim, except for breaches of confidentiality, the
              indemnification obligations themselves, or wilful misconduct.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              11. Changes to Terms
            </h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated via
              email or in-app notification at least 30 days before taking effect. Continued use of
              the Platform after changes are effective constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              12. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of Delaware, United States, without regard to conflict of law principles. For
              customers in the European Economic Area or the United Kingdom, the foregoing does not
              affect any mandatory rights under applicable EU or UK data-protection law (including
              GDPR and UK GDPR), which prevail over any conflicting term and may be exercised before
              a Member State or UK supervisory authority.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px' }}>
              13. Contact
            </h2>
            <p>
              For questions about these Terms, contact us at:{' '}
              <a
                href="mailto:team@decision-intel.com"
                style={{ color: '#FFFFFF', textDecoration: 'underline' }}
              >
                team@decision-intel.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
