'use client';

/**
 * Design Partner Program — /design-partner
 *
 * Unlisted (robots noindex) landing surface for the 5-seat design-partner
 * cohort. Arrived at via warm intros from the founder's advisor network.
 * Combines the program pitch (what you receive / what we ask / timeline)
 * with an application form that POSTs to /api/design-partner/apply.
 *
 * Enterprise-procurement voice throughout. Price ($1,999/mo, 20% off
 * $2,499 list) is stated directly, not hidden — the founder is explicit
 * that charging is a feature of the relationship, not a concession.
 */

import { useState } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Handshake,
  Scale,
  Lock,
  Users,
  Sparkles,
  BookOpen,
  GraduationCap,
  Building2,
} from 'lucide-react';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  navy: '#0F172A',
  navyLight: '#1E293B',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
};

const YOU_RECEIVE: Array<{ icon: typeof ShieldCheck; title: string; body: string }> = [
  {
    icon: Lock,
    title: '$1,999/mo locked for 12 months',
    body: '20% off the $2,499 list price for Strategy tier. Locked rate for Year 1. First right of refusal at $2,499 for Year 2 before list price moves again.',
  },
  {
    icon: ShieldCheck,
    title: 'Decision Provenance Record free on every audit',
    body: 'The signed, hashed, 4-page artifact your General Counsel hands to the audit committee — mapped onto EU AI Act Article 14 record-keeping, SEC AI disclosure, and Basel III ICAAP. Bundled on every strategic memo you audit.',
  },
  {
    icon: Sparkles,
    title: 'Custom toxic-combination weights',
    body: 'The founder personally tunes the 20×20 interaction matrix to your industry\u2019s failure modes, using your historical memo library as calibration data.',
  },
  {
    icon: Users,
    title: 'Direct Slack channel with the founder',
    body: 'Bug reports and feature requests arrive in the same Slack the founder writes code in. No support ticket queues.',
  },
  {
    icon: GraduationCap,
    title: 'Quarterly 1-hour strategy session',
    body: 'Founder-led working session on your current board-deck cycle. Memo rehearsal, pitch review, or a direct run against the Recognition-Rigor Framework.',
  },
  {
    icon: BookOpen,
    title: 'Early access to new capabilities',
    body: 'R\u00b2F Playbook, Weekly Digest, Decision Rooms, outcome-learning recalibration — design-partner Slack gets the invite before the public changelog.',
  },
  {
    icon: Building2,
    title: 'Marquee placement on /proof (optional)',
    body: 'Logo + short attribution on the public proof page, subject to your approval. Decline freely — no clawback.',
  },
  {
    icon: Handshake,
    title: 'Named design partner in investor deck (optional)',
    body: 'Attribution in the pre-seed / seed deck, subject to your approval. Often the cleanest way to reciprocate a warm intro.',
  },
];

const YOU_COMMIT: Array<{ icon: typeof CheckCircle2; title: string; body: string }> = [
  {
    icon: CheckCircle2,
    title: 'Weekly 30-minute call',
    body: 'Product feedback, new-feature demos, triage of anything stuck. Skip when your quarter gets heavy; reschedule, don\u2019t cancel.',
  },
  {
    icon: CheckCircle2,
    title: 'Monthly structured feedback form',
    body: '5\u201310 questions, 10 minutes to complete. Signal more valuable than the NPS tracker most early-stage companies run.',
  },
  {
    icon: CheckCircle2,
    title: 'Public case study at Month 12 (or earlier)',
    body: 'One published case study with your permission at Month 12 \u2014 or earlier if you\u2019re enthusiastic. Anonymized version available if public attribution is a non-starter.',
  },
  {
    icon: CheckCircle2,
    title: 'First-month payment up front',
    body: 'First month\u2019s $1,999 lands before kickoff. The commitment is the fee \u2014 free pilots produce lead attitude, not customer attitude.',
  },
  {
    icon: CheckCircle2,
    title: 'Signed Master Service Agreement + DPA',
    body: 'MSA template available on request (docs/positioning/design-partner-msa-template.md for internal review). Signed DPA on any data processing.',
  },
];

const TIMELINE: Array<{ label: string; body: string }> = [
  {
    label: 'Week 1',
    body: 'Application received. Intro call booked within 2 business days. Technical + procurement Q&A covered in that call.',
  },
  {
    label: 'Week 2',
    body: 'MSA + DPA signed. Commitment fee invoiced. Slack channel provisioned. First audit runs on your choice of strategic memo.',
  },
  {
    label: 'Weeks 3\u20138',
    body: 'Core flow stabilizes on your memos. Founder tunes the 20\u00d720 matrix to your industry. Weekly calls establish the feedback cadence.',
  },
  {
    label: 'Months 3\u20136',
    body: 'Decision Provenance Records start circulating to your GC / audit committee. First feedback loop closes on an outcome you\u2019ve confirmed.',
  },
  {
    label: 'Month 12',
    body: 'Public case study drafted. Year 2 pricing confirmed at $2,499/mo locked. Option to renew or step back cleanly.',
  },
];

type FormStatus = 'idle' | 'submitting' | 'done' | 'error';

export function DesignPartnerClient() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: (fd.get('name') as string)?.trim(),
      email: (fd.get('email') as string)?.trim(),
      company: (fd.get('company') as string)?.trim(),
      role: (fd.get('role') as string)?.trim(),
      linkedInUrl: (fd.get('linkedInUrl') as string)?.trim() || undefined,
      industry: fd.get('industry') as string,
      teamSize: fd.get('teamSize') as string,
      memoCadence: (fd.get('memoCadence') as string)?.trim() || undefined,
      currentStack: (fd.get('currentStack') as string)?.trim() || undefined,
      whyNow: (fd.get('whyNow') as string)?.trim(),
      source: (fd.get('source') as string) || undefined,
    };
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/design-partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: { bookingUrl?: string | null };
        error?: string;
      } | null;
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data?.error || 'We could not submit your application. Please try again.');
        return;
      }
      setBookingUrl(data?.data?.bookingUrl ?? null);
      setStatus('done');
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again or email team@decision-intel.com.');
    }
  };

  return (
    <div style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}>
      <MarketingNav />

      {/* Hero */}
      <section
        style={{
          padding: '88px 24px 56px',
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.slate50} 100%)`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.green,
              marginBottom: 18,
            }}
          >
            Design Partner Program &middot; 5 seats
          </p>
          <h1
            style={{
              fontSize: 'clamp(34px, 5.4vw, 58px)',
              fontWeight: 800,
              color: C.slate900,
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              marginBottom: 22,
            }}
          >
            Shape the Recognition-Rigor Framework alongside four other Fortune 500 corporate
            strategy teams.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: C.slate600,
              lineHeight: 1.6,
              maxWidth: 760,
              margin: '0 auto 22px',
            }}
          >
            Twelve months. $1,999/mo, 20% off the $2,499 Strategy list price. Decision Provenance
            Records free on every memo. Custom toxic-combination weights tuned to your industry by
            the founder personally. Your feedback becomes the product.
          </p>
          <p
            style={{
              fontSize: 14,
              color: C.slate500,
              lineHeight: 1.6,
              maxWidth: 680,
              margin: '0 auto',
              fontStyle: 'italic',
            }}
          >
            We charge because each audit runs seventeen LLM calls across twelve specialized nodes
            and carries real infrastructure cost. Free pilots produce lead attitude, not customer
            attitude. The 20% concession signals the opposite.
          </p>
          <div style={{ marginTop: 30 }}>
            <a
              href="#apply"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                background: C.green,
                color: C.white,
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 10,
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(22,163,74,0.28)',
              }}
            >
              Apply for a seat <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Regulatory tailwinds \u2014 a compact strip positioning the program
          as infrastructure for the wave already in motion. Enterprise
          procurement cares about this first; the program details follow. */}
      <section
        style={{
          padding: '32px 24px',
          background: C.slate50,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.green,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 8,
            }}
          >
            Why now
          </p>
          <div
            style={{
              fontSize: 15,
              color: C.slate700,
              lineHeight: 1.65,
              maxWidth: 880,
            }}
          >
            Three regulatory waves are already in force or on the enforcement calendar &mdash;{' '}
            <strong style={{ color: C.slate900, fontWeight: 700 }}>
              EU AI Act Article 14 record-keeping
            </strong>{' '}
            (high-risk obligations enforceable Aug&nbsp;2026),{' '}
            <strong style={{ color: C.slate900, fontWeight: 700 }}>
              SEC AI disclosure rulemaking
            </strong>{' '}
            (2024&ndash;2026), and{' '}
            <strong style={{ color: C.slate900, fontWeight: 700 }}>
              Basel III Pillar 2 ICAAP documentation
            </strong>{' '}
            (live for regulated banks). Each asks for exactly the artifact our Decision Provenance
            Record produces. Design partners get this built-in from day one, not bolted on after
            procurement flags the gap.
          </div>
        </div>
      </section>

      {/* What you receive / what we ask */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            className="dp-twocol"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: 40,
              alignItems: 'flex-start',
            }}
          >
            {/* You receive */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: C.green,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 10,
                }}
              >
                You receive
              </p>
              <h2
                style={{
                  fontSize: 'clamp(26px, 3.2vw, 34px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: C.slate900,
                  marginBottom: 20,
                }}
              >
                The most direct line into the product you can buy right now.
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {YOU_RECEIVE.map(item => (
                  <div
                    key={item.title}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 1fr',
                      gap: 14,
                      padding: '14px 16px',
                      background: C.white,
                      border: `1px solid ${C.slate200}`,
                      borderRadius: 12,
                    }}
                  >
                    <item.icon size={18} color={C.green} strokeWidth={2} style={{ marginTop: 3 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: C.slate600,
                          lineHeight: 1.55,
                          marginTop: 3,
                        }}
                      >
                        {item.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* You commit */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: C.slate500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 10,
                }}
              >
                You commit
              </p>
              <h2
                style={{
                  fontSize: 'clamp(22px, 2.8vw, 28px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: C.slate900,
                  marginBottom: 20,
                }}
              >
                Specific, bounded, and survivable for a busy CSO.
              </h2>
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  padding: 20,
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 14,
                }}
              >
                {YOU_COMMIT.map(item => (
                  <div
                    key={item.title}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '20px 1fr',
                      gap: 12,
                    }}
                  >
                    <item.icon
                      size={16}
                      color={C.green}
                      strokeWidth={2.25}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.slate900 }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: C.slate600,
                          lineHeight: 1.55,
                          marginTop: 2,
                        }}
                      >
                        {item.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: '14px 16px',
                  background: C.greenSoft,
                  border: `1px solid ${C.greenBorder}`,
                  borderRadius: 12,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <Scale size={18} color={C.green} strokeWidth={2} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.slate900 }}>
                    Twelve-month term, clean exit
                  </div>
                  <div
                    style={{ fontSize: 12.5, color: C.slate600, marginTop: 2, lineHeight: 1.55 }}
                  >
                    At Month 12, you renew at the locked $2,499 rate, step up to full Strategy
                    terms, or step back. Your Decision Knowledge Graph + all packets remain
                    exportable either way.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline strip */}
      <section
        style={{
          padding: '64px 24px',
          background: C.navy,
          color: C.white,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#86EFAC',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 10,
            }}
          >
            How a seat unfolds
          </p>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.2vw, 34px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: C.white,
              marginBottom: 30,
              maxWidth: 820,
            }}
          >
            From warm intro to Month 12 case study — the cadence is specific.
          </h2>
          <div
            className="dp-timeline"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 12,
            }}
          >
            {TIMELINE.map(t => (
              <div
                key={t.label}
                style={{
                  padding: 18,
                  background: C.navyLight,
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: '#86EFAC',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 8,
                  }}
                >
                  {t.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#E2E8F0',
                    lineHeight: 1.6,
                  }}
                >
                  {t.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.green,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 10,
            }}
          >
            Apply
          </p>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.2vw, 34px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: C.slate900,
              marginBottom: 10,
            }}
          >
            Tell us what your quarter actually looks like.
          </h2>
          <p style={{ fontSize: 15, color: C.slate600, marginBottom: 26, lineHeight: 1.6 }}>
            Brief. Specific. You&rsquo;ll hear back within 2 business days with an intro-call slot.
          </p>

          {status === 'done' ? (
            <div
              style={{
                padding: 22,
                background: C.greenSoft,
                border: `1px solid ${C.greenBorder}`,
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <CheckCircle2 size={22} color={C.green} strokeWidth={2.25} />
                <div style={{ fontSize: 16, fontWeight: 700, color: C.slate900 }}>
                  Application received
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.slate600, lineHeight: 1.65, margin: 0 }}>
                The founder reviews design-partner applications daily. You&rsquo;ll hear back within
                2 business days with an intro-call link and the program MSA for your review.
              </p>
              {bookingUrl && (
                <div style={{ marginTop: 14 }}>
                  <Link
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      background: C.green,
                      color: C.white,
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: 10,
                      textDecoration: 'none',
                    }}
                  >
                    Book the intro call now <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
              <Row>
                <Field label="Full name" name="name" required />
                <Field label="Work email" name="email" type="email" required />
              </Row>
              <Row>
                <Field label="Company" name="company" required />
                <Field label="Role / title" name="role" required />
              </Row>
              <Field label="LinkedIn URL (optional)" name="linkedInUrl" type="url" />

              <Row>
                <SelectField
                  label="Industry"
                  name="industry"
                  required
                  options={[
                    { value: 'banking', label: 'Banking' },
                    { value: 'insurance', label: 'Insurance' },
                    { value: 'pharma', label: 'Pharma' },
                    { value: 'aerospace', label: 'Aerospace' },
                    { value: 'energy', label: 'Energy' },
                    { value: 'mna', label: 'M&A / Corp Dev' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
                <SelectField
                  label="Team size"
                  name="teamSize"
                  required
                  options={[
                    { value: '1-5', label: '1\u20135' },
                    { value: '6-15', label: '6\u201315' },
                    { value: '16-50', label: '16\u201350' },
                    { value: '51-200', label: '51\u2013200' },
                    { value: '200+', label: '200+' },
                  ]}
                />
              </Row>

              <Field
                label="Memo cadence (optional)"
                name="memoCadence"
                placeholder="e.g. 3\u20135 board-level memos per quarter"
              />
              <Field
                label="Current decision-archaeology stack (optional)"
                name="currentStack"
                placeholder="e.g. Google Docs + Slack + Confluence + board deck"
              />

              <TextareaField
                label="Why now?"
                name="whyNow"
                required
                rows={5}
                placeholder="What memo or decision is triggering this interest? What would a 12-month design-partner engagement make possible that doesn\u2019t exist today?"
              />

              <SelectField
                label="How did you hear about us?"
                name="source"
                options={[
                  { value: '', label: 'Select (optional)' },
                  { value: 'warm-intro', label: 'Warm intro from advisor' },
                  { value: 'linkedin', label: 'LinkedIn (founder post)' },
                  { value: 'press', label: 'Press / coverage' },
                  { value: 'direct', label: 'Direct outreach from founder' },
                  { value: 'other', label: 'Other' },
                ]}
              />

              {errorMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.22)',
                    borderRadius: 10,
                    color: '#B91C1C',
                    fontSize: 13,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  background: C.green,
                  color: C.white,
                  fontSize: 15,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 10,
                  cursor: status === 'submitting' ? 'wait' : 'pointer',
                  boxShadow: '0 6px 20px rgba(22,163,74,0.28)',
                  opacity: status === 'submitting' ? 0.8 : 1,
                }}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting&hellip;
                  </>
                ) : (
                  <>
                    Apply for a seat <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p
                style={{
                  fontSize: 12,
                  color: C.slate500,
                  lineHeight: 1.6,
                  textAlign: 'center',
                  margin: '4px auto 0',
                  maxWidth: 560,
                }}
              >
                By applying you agree to a single follow-up email from the founder. We don&rsquo;t
                add you to any marketing list. Your application is reviewed personally, not by a
                BDR.
              </p>
            </form>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .dp-twocol { grid-template-columns: 1fr !important; gap: 32px !important; }
          .dp-timeline { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .dp-timeline { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Form field primitives ───────────────────────────────────────────

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
      }}
      className="dp-row"
    >
      {children}
      <style>{`
        @media (max-width: 600px) {
          .dp-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.slate700 }}>
        {label}
        {required && <span style={{ color: C.green, marginLeft: 4 }}>*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        style={{
          padding: '10px 12px',
          fontSize: 14,
          border: `1px solid ${C.slate200}`,
          borderRadius: 8,
          background: C.white,
          color: C.slate900,
          outline: 'none',
          width: '100%',
        }}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.slate700 }}>
        {label}
        {required && <span style={{ color: C.green, marginLeft: 4 }}>*</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        style={{
          padding: '10px 12px',
          fontSize: 14,
          border: `1px solid ${C.slate200}`,
          borderRadius: 8,
          background: C.white,
          color: C.slate900,
          outline: 'none',
          width: '100%',
          appearance: 'auto',
        }}
      >
        <option value="" disabled>
          Select&hellip;
        </option>
        {options.map(o => (
          <option key={`${name}-${o.value}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  rows = 4,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.slate700 }}>
        {label}
        {required && <span style={{ color: C.green, marginLeft: 4 }}>*</span>}
      </span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        style={{
          padding: '10px 12px',
          fontSize: 14,
          border: `1px solid ${C.slate200}`,
          borderRadius: 8,
          background: C.white,
          color: C.slate900,
          outline: 'none',
          width: '100%',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
    </label>
  );
}
