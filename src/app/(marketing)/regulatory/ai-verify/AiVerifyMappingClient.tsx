'use client';

/**
 * AI Verify Principle Mapping — /regulatory/ai-verify
 *
 * Public reference document that maps every Decision Provenance Record
 * field onto the 11 internationally-recognised AI governance principles
 * codified by the AI Verify Foundation (Singapore IMDA, aligned with EU
 * and OECD). Procurement-grade artifact — the kind of document a CSO's
 * General Counsel can paste into a vendor risk assessment.
 *
 * Language discipline — DO NOT change to "fully compliant" or "certified":
 *   - AI Verify is a self-assessment framework; no external certification
 *     exists for products.
 *   - Their own FAQ: the framework "does not guarantee that any AI system
 *     tested will be free from risks or biases or is completely safe."
 *   - "Aligned with" is the accurate, defensible, procurement-safe claim.
 *   - If a design-partner GC later reviews and accepts the mapping, we can
 *     upgrade the claim language; until then hold the line.
 *
 * The page doubles as a printable PDF — "Download as PDF" uses the
 * browser's native print dialog with print-optimized CSS. This is
 * maintainable (no third-party PDF generation dependency) and always in
 * sync with the live page.
 */

import { useCallback } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';

const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;
import {
  ArrowRight,
  Download,
  Eye,
  BookOpen,
  RefreshCw,
  ShieldCheck,
  Lock,
  Scale,
  Fingerprint,
  Database,
  ClipboardList,
  Users,
  Globe2,
  ExternalLink,
  Printer,
  FileText,
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
  amber: '#D97706',
  amberSoft: 'rgba(217, 119, 6, 0.06)',
  amberBorder: 'rgba(217, 119, 6, 0.22)',
};

interface PrincipleRow {
  num: number;
  icon: typeof Eye;
  name: string;
  definition: string;
  mechanism: string;
  dprFields: string[];
}

const PRINCIPLES: PrincipleRow[] = [
  {
    num: 1,
    icon: Eye,
    name: 'Transparency',
    definition: 'The AI system discloses information about itself to relevant stakeholders.',
    mechanism:
      'Every audit ships with the SHA-256 fingerprint of the exact prompt version used, plus full model lineage: which model tier ran on which pipeline stage, with decoding parameters recorded per stage. Nothing about the model or the prompt is hidden.',
    dprFields: ['Prompt fingerprint', 'Model lineage'],
  },
  {
    num: 2,
    icon: BookOpen,
    name: 'Explainability',
    definition: 'The AI system\u2019s outputs can be understood in human terms.',
    mechanism:
      'Every flagged bias carries a stable taxonomy ID (DI-B-001 through DI-B-020, plus 11 strategy-specific biases) and a primary APA academic reference with DOI where available. A GC reading the DPR can trace every flag back to its peer-reviewed source.',
    dprFields: ['Academic citations', '30+ bias taxonomy with DOIs'],
  },
  {
    num: 3,
    icon: RefreshCw,
    name: 'Repeatability / Reproducibility',
    definition: 'The AI system\u2019s behavior can be reproduced given the same inputs.',
    mechanism:
      'Input-document hash + prompt fingerprint + model lineage together make every analysis reproducible from the same inputs. The risk-scorer node is deterministic (not LLM-generated), so the final score is stable for identical inputs.',
    dprFields: ['Input-document hash', 'Prompt fingerprint', 'Model lineage'],
  },
  {
    num: 4,
    icon: ShieldCheck,
    name: 'Safety',
    definition: 'The AI system behaves safely during deployment.',
    mechanism:
      'GDPR anonymiser runs as the first node of the pipeline \u2014 no analysis LLM ever sees raw PII. Content is encrypted at rest with AES-256-GCM and a keyVersion rotation protocol. Ensemble sampling across three Kahneman-side nodes (bias detective + noise judge + reference-class pull) bounds individual-model failures by measuring inter-judge variance directly.',
    dprFields: ['Pipeline lineage', 'Judge variance (noise score)'],
  },
  {
    num: 5,
    icon: Lock,
    name: 'Security',
    definition: 'The AI system resists unauthorised access and tampering.',
    mechanism:
      'TLS 1.2+ in transit, AES-256-GCM at rest with keyVersion rotation, Supabase SOC 2-adjacent infrastructure, CSRF protection via middleware, signed cryptographic fingerprints on the DPR itself. Every encrypted row carries a keyVersion stamp so keys rotate without bricking historical data.',
    dprFields: ['Input-document hash', 'Prompt fingerprint', 'Reviewer signatures'],
  },
  {
    num: 6,
    icon: Scale,
    name: 'Robustness',
    definition: 'The AI system remains reliable under perturbation or partial failure.',
    mechanism:
      'Three-judge noise jury arbitrated by a meta-judge \u2014 individual model failures do not cascade. Model routing classifies errors as transient vs permanent and fails over to a second provider when thresholds are exceeded. Exponential-backoff retries + atomic rate limiting on every call.',
    dprFields: ['Model lineage', 'Judge variance'],
  },
  {
    num: 7,
    icon: Fingerprint,
    name: 'Fairness',
    definition: 'The AI system mitigates unintended discrimination across groups.',
    mechanism:
      'The 30+ cognitive-bias taxonomy covers multiple fairness-relevant biases (authority bias, in-group favouritism, halo effect, availability bias). Cross-framework regulatory mapping includes GDPR Article 22 (non-discrimination on automated decisions) and the EU AI Act\u2019s high-risk fairness provisions. Recalibration learns per-org failure patterns so fairness is auditable per customer.',
    dprFields: ['Academic citations', 'Regulatory mapping (GDPR Art 22, EU AI Act)'],
  },
  {
    num: 8,
    icon: Database,
    name: 'Data Governance',
    definition: 'The AI system handles data lawfully and in line with governance policy.',
    mechanism:
      'No-training contract with every AI processor engaged. Per-org data isolation. Signed Data Processing Addendum on every paid tier. The GDPR anonymiser redacts PII before any third-party LLM receives the content. Encryption keys rotate with a documented protocol.',
    dprFields: ['Pipeline lineage (node 1 = GDPR anonymiser)'],
  },
  {
    num: 9,
    icon: ClipboardList,
    name: 'Accountability',
    definition: 'Responsibility for the AI system\u2019s outputs is clear and documented.',
    mechanism:
      'Every DPR includes a reviewer counter-signature block for the CSO or General Counsel to sign on receipt. Immutable audit log captures every action \u2014 who exported, who viewed, who edited \u2014 with filters, date range, and CSV export for downstream compliance tooling. Chain-of-custody timestamp on the record.',
    dprFields: ['Reviewer signatures', 'Audit log (separate)'],
  },
  {
    num: 10,
    icon: Users,
    name: 'Human Agency & Oversight',
    definition: 'The AI system supports, rather than replaces, human judgment.',
    mechanism:
      'The Recognition-Rigor Framework (R\u00b2F) is designed around this principle. Kahneman\u2019s rigor (debiasing) and Klein\u2019s recognition (expert-intuition amplification) are both applied \u2014 but the CSO\u2019s judgment stays in the centre, reinforced from both sides, never replaced. The DPR is the evidence of their oversight, not a substitute for it.',
    dprFields: ['Every field \u2014 the DPR is the oversight artifact'],
  },
  {
    num: 11,
    icon: Globe2,
    name: 'Inclusive Growth, Societal & Environmental Well-being',
    definition:
      'The AI system contributes to outcomes that are socially and environmentally positive.',
    mechanism:
      `Cross-framework regulatory mapping across ${FRAMEWORK_COUNT} frameworks — international anchors (Basel III, EU AI Act, SEC Reg D, FCA Consumer Duty, SOX, GDPR Art 22, LPOA) plus African-market regimes (NDPR, CBN, ISA Nigeria 2007, WAEMU, CMA Kenya, BoG, FRC Nigeria, CBE, PoPIA, SARB, BoT) — aligns Decision Intel with societal governance objectives. Decision-quality audits reduce the strategic-decision failures that cascade into stakeholder harm. Cost-tier model routing reduces inference energy per audit where decision quality allows.`,
    dprFields: ['Regulatory mapping', 'Model lineage (cost-tier routing)'],
  },
];

export function AiVerifyMappingClient() {
  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  return (
    <div
      className="ai-verify-page"
      style={{ background: C.white, color: C.slate900, minHeight: '100vh' }}
    >
      <div className="screen-only">
        <MarketingNav />
      </div>

      {/* Print-only header — shows on the PDF but not the live page */}
      <div
        className="print-only"
        style={{
          padding: '0 0 16px',
          borderBottom: `1.5px solid ${C.slate900}`,
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: C.green }}>
          DECISION INTEL · REGULATORY ALIGNMENT
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.slate900, marginTop: 4 }}>
          AI Verify Principle Mapping
        </div>
        <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>
          decision-intel.com/regulatory/ai-verify
        </div>
      </div>

      {/* Hero */}
      <section
        className="screen-only"
        style={{
          padding: '88px 24px 48px',
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.slate50} 100%)`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: C.green,
              marginBottom: 16,
            }}
          >
            Regulatory alignment
          </p>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: C.slate900,
              marginBottom: 18,
            }}
          >
            Decision Intel &amp; the AI Verify Foundation.
          </h1>
          <p
            style={{
              fontSize: 18,
              color: C.slate600,
              lineHeight: 1.6,
              maxWidth: 820,
              marginBottom: 14,
            }}
          >
            Every Decision Provenance Record maps onto the{' '}
            <strong>11 internationally-recognised AI governance principles</strong> codified by AI
            Verify, Singapore IMDA&rsquo;s governance framework, cross-aligned with the EU AI Act
            and the OECD AI Principles. The reference implementation a Fortune 500 procurement team
            can paste into a vendor risk assessment.
          </p>
          <p
            style={{
              fontSize: 14,
              color: C.slate500,
              lineHeight: 1.65,
              maxWidth: 820,
              marginBottom: 30,
              fontStyle: 'italic',
            }}
          >
            AI Verify is a self-assessment governance framework under the AI Verify Foundation, a
            subsidiary of Singapore&rsquo;s Infocomm Media Development Authority (IMDA). It does not
            certify products. &ldquo;Aligned with&rdquo; is the accurate claim; we state this
            openly.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                background: C.green,
                color: C.white,
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(22,163,74,0.24)',
              }}
            >
              <Download size={14} /> Download the mapping (PDF)
            </button>
            <Link
              href="/security"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                background: C.white,
                color: C.slate900,
                border: `1px solid ${C.slate200}`,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              <ShieldCheck size={14} /> Read the security posture
            </Link>
            <a
              href="https://aiverifyfoundation.sg/what-is-ai-verify/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                color: C.slate600,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              AI Verify Foundation <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* The mapping table */}
      <section id="mapping" style={{ padding: '56px 24px', background: C.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 'clamp(24px, 3vw, 30px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: C.slate900,
                marginBottom: 10,
              }}
            >
              The 11 principles, and the DPR field that satisfies each.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: C.slate600,
                lineHeight: 1.6,
                maxWidth: 820,
              }}
            >
              Each row names the AI Verify principle, defines it in one sentence, describes the
              mechanism inside Decision Intel that satisfies it, and points at the specific Decision
              Provenance Record field that makes the mechanism verifiable.
            </p>
          </div>

          <ol
            className="mapping-list"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {PRINCIPLES.map(p => (
              <li
                key={p.num}
                style={{
                  padding: '22px 24px 24px',
                  borderRadius: 14,
                  border: `1px solid ${C.slate200}`,
                  background: C.white,
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr',
                  gap: 18,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: C.greenSoft,
                    border: `1px solid ${C.greenBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <p.icon size={22} color={C.green} strokeWidth={2} />
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      marginBottom: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: C.green,
                      }}
                    >
                      Principle {p.num.toString().padStart(2, '0')}
                    </span>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: C.slate900,
                        margin: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {p.name}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: C.slate500,
                      margin: '0 0 10px',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    {p.definition}
                  </p>
                  <p
                    style={{
                      fontSize: 14.5,
                      color: C.slate700,
                      margin: '0 0 12px',
                      lineHeight: 1.65,
                    }}
                  >
                    {p.mechanism}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {p.dprFields.map(f => (
                      <span
                        key={f}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          fontSize: 11.5,
                          fontWeight: 600,
                          background: C.slate50,
                          color: C.slate700,
                          border: `1px solid ${C.slate200}`,
                          borderRadius: 999,
                        }}
                      >
                        <FileText size={11} />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Honest caveats section */}
      <section
        style={{
          padding: '56px 24px',
          background: C.slate50,
          borderTop: `1px solid ${C.slate200}`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.amber,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 10,
            }}
          >
            What alignment does, and does not, mean
          </p>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.6vw, 28px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: C.slate900,
              marginBottom: 14,
            }}
          >
            Accurate, defensible, and stated openly.
          </h2>
          <div
            style={{
              padding: '22px 24px',
              background: C.amberSoft,
              border: `1px solid ${C.amberBorder}`,
              borderRadius: 14,
              display: 'grid',
              gap: 10,
            }}
          >
            <p style={{ fontSize: 14, color: C.slate700, lineHeight: 1.65, margin: 0 }}>
              AI Verify is a <strong>self-assessment</strong> governance framework. The AI Verify
              Foundation does not certify products. No &ldquo;AI Verify certified&rdquo; label
              exists. Claims of full compliance or certification would be inaccurate.
            </p>
            <p style={{ fontSize: 14, color: C.slate700, lineHeight: 1.65, margin: 0 }}>
              What Decision Intel claims: every field of the Decision Provenance Record maps onto
              one or more of the 11 principles codified by AI Verify. The mechanism that satisfies
              each principle is named above. A procurement team, General Counsel, or internal
              auditor can verify the mapping row by row against the product.
            </p>
            <p style={{ fontSize: 14, color: C.slate700, lineHeight: 1.65, margin: 0 }}>
              The AI Verify Foundation&rsquo;s own FAQ states that the framework &ldquo;does not
              guarantee that any AI system tested will be free from risks or biases or is completely
              safe.&rdquo; Decision Intel makes the same disclaimer: a bias-audit tool is a control,
              not a guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* African-regulatory bridge — the 11 AI Verify principles translate.
          Renders on screen AND in print: this is procurement-grade evidence
          a Pan-African GC carries home in the PDF, not navigation chrome. */}
      <section
        style={{
          padding: '48px 24px',
          background: C.white,
          borderTop: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: C.navy,
              marginBottom: 10,
            }}
          >
            The same principles travel across African regulatory regimes
          </h2>
          <p style={{ fontSize: 14, color: C.slate500, lineHeight: 1.7 }}>
            The 11 internationally-recognised AI governance principles the Decision Provenance
            Record already maps to (transparency, explainability, repeatability, safety, security,
            robustness, fairness, data governance, accountability, human agency &amp; oversight,
            inclusive growth) align beat-for-beat with the emerging African framework stack. Every
            DPR field already satisfies these obligations; the full provision-level cross-walk is
            covered in the /security posture.
          </p>
          <ul
            style={{
              marginTop: 18,
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
              fontSize: 13,
              color: C.slate600,
              lineHeight: 1.55,
            }}
          >
            {[
              {
                code: 'NDPR Art. 12',
                jurisdiction: 'Nigeria',
                gates: 'Automated-decision rights for Nigerian data subjects',
              },
              {
                code: 'CBN AI Guidelines',
                jurisdiction: 'Nigeria',
                gates:
                  'Model governance + explainability for regulated financial institutions (draft 2024)',
              },
              {
                code: 'FRC Nigeria',
                jurisdiction: 'Nigeria',
                gates: 'Code of Corporate Governance — board-level decisioning + dissent capture',
              },
              {
                code: 'WAEMU',
                jurisdiction: '8 West African Member States',
                gates: 'Cross-border data localisation + BCEAO financial-sector governance',
              },
              {
                code: 'CMA Kenya',
                jurisdiction: 'Kenya',
                gates: 'Listed-company decisioning + prospectus disclosure (Conduct Regs 2024)',
              },
              {
                code: 'CBK',
                jurisdiction: 'Kenya',
                gates: 'Banking (Amendment) Act 2024 §33B — digital-lending + AI/ML model risk',
              },
              {
                code: 'BoG Cyber & ICT Risk',
                jurisdiction: 'Ghana',
                gates:
                  'Cyber, data and AI/ML model-governance for regulated financial institutions',
              },
              {
                code: 'CBE AI Guidelines',
                jurisdiction: 'Egypt',
                gates: 'AI/ML governance + explainability for Egyptian banks (CBE 2023 framework)',
              },
              {
                code: 'PoPIA §71',
                jurisdiction: 'South Africa',
                gates: 'Automated-decision rights + data-subject access (in force July 2021)',
              },
              {
                code: 'SARB Model Risk',
                jurisdiction: 'South Africa',
                gates:
                  'Model risk + AI governance for SA-regulated banks (Directive D2/2022 + JS 2/2024)',
              },
              {
                code: 'BoT FinTech',
                jurisdiction: 'Tanzania',
                gates: 'AI/ML decisioning under the BoT Regulatory Sandbox Guidelines 2023',
              },
            ].map(row => (
              <li
                key={row.code}
                style={{
                  padding: '12px 14px',
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ color: C.navy, fontSize: 13 }}>{row.code}</strong>
                  <span
                    style={{
                      fontSize: 11,
                      color: C.slate500,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {row.jurisdiction}
                  </span>
                </div>
                <div>{row.gates}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section
        className="screen-only"
        style={{
          padding: '56px 24px',
          background: C.navy,
          color: C.white,
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 14,
            }}
          >
            Ready to put the DPR into your procurement pack?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: C.slate300,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            The design-partner cohort gets the Decision Provenance Record bundled on every audit at
            $1,999/mo (20% off the $2,499 Strategy list) so the mapping above stops being a
            reference doc and starts being the artifact your General Counsel forwards to the audit
            committee.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/design-partner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 26px',
                background: C.green,
                color: C.white,
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 10,
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(22,163,74,0.32)',
              }}
            >
              See the design-partner program <ArrowRight size={14} />
            </Link>
            <Link
              href="/security"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 26px',
                background: 'transparent',
                color: C.white,
                border: '1px solid rgba(255,255,255,0.24)',
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              <Printer size={14} /> Security posture
            </Link>
          </div>
        </div>
      </section>

      {/* Print-specific + screen-hiding utilities */}
      <style>{`
        .print-only { display: none; }
        @media print {
          @page {
            size: A4;
            margin: 18mm 16mm 18mm 16mm;
          }
          body { background: #fff !important; color: #0F172A !important; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          .ai-verify-page { background: #fff !important; }
          section {
            padding: 8px 0 !important;
            border: none !important;
            background: #fff !important;
            color: #0F172A !important;
          }
          .mapping-list li {
            break-inside: avoid;
            page-break-inside: avoid;
            padding: 12px 14px !important;
            background: #fff !important;
            border: 1px solid #CBD5E1 !important;
            box-shadow: none !important;
          }
          h1, h2, h3 { color: #0F172A !important; page-break-after: avoid; }
          p, li, span, strong { color: #0F172A !important; }
          a { color: #16A34A !important; text-decoration: none !important; }
        }
      `}</style>
    </div>
  );
}
