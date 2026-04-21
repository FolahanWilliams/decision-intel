'use client';

/**
 * MarketingNav — the shared top bar for every public marketing surface.
 *
 * Replaces the per-page inline nav that previously lived on the landing
 * and the now-deleted CaseStudyNav. Three sections render as mega-menus
 * (Platform, Proof & Research, Enterprise); Pricing stays flat because
 * decision-making on a pricing click is not helped by a dropdown.
 *
 * Layout per mega-panel: link column on the left, featured card on the
 * right. On ≥1100px the panel is a two-column grid; below that the
 * featured card stacks under the links. Trigger opens on hover + on click
 * (toggles), closes on outside-click or Escape, swaps seamlessly when
 * you hover from one trigger to another.
 *
 * Accessibility notes: triggers are buttons with aria-expanded, the panel
 * is aria-labelled, Escape closes, and the mobile fallback is an
 * accordion (no nested hidden layers).
 */

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Dna,
  FileSearch,
  Gavel,
  GraduationCap,
  Handshake,
  Library,
  ListTree,
  Lock,
  Menu,
  MessageSquareQuote,
  Microscope,
  Scale,
  ShieldCheck,
  TrendingUp,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react';
import { BookDemoCTA } from '@/components/marketing/BookDemoCTA';

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
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
  green: '#16A34A',
  greenDark: '#15803D',
  greenLight: '#DCFCE7',
} as const;

// ─── IA ──────────────────────────────────────────────────────────────

type MenuLink = {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
};

type MenuSection = {
  eyebrow: string;
  links: MenuLink[];
};

type MenuFeatured = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: LucideIcon;
};

type MegaMenu = {
  id: string;
  label: string;
  sections: MenuSection[];
  featured: MenuFeatured;
};

const MENUS: MegaMenu[] = [
  {
    id: 'platform',
    label: 'Platform',
    sections: [
      {
        eyebrow: 'How the system works',
        links: [
          {
            icon: Workflow,
            label: 'How it works',
            description: 'The 12-node pipeline, explained end-to-end.',
            href: '/how-it-works',
          },
          {
            icon: ListTree,
            label: 'Bias taxonomy',
            description: '20 corporate-strategy biases, stable IDs, academic citations.',
            href: '/taxonomy',
          },
          {
            icon: MessageSquareQuote,
            label: 'Simulate my CEO',
            description: 'Paste a memo, get the three questions your CEO will ask. Free.',
            href: '/simulate-ceo',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'IP moat',
      title: 'The Recognition-Rigor Framework',
      body: "Kahneman's System 2 debiasing and Klein's Recognition-Primed Decision, arbitrated in one pipeline. The only vendor running both halves of the decision stack.",
      href: '/how-it-works',
      cta: 'See the synthesis',
      icon: GraduationCap,
    },
  },
  {
    id: 'proof',
    label: 'Proof & Research',
    sections: [
      {
        eyebrow: 'Public evidence',
        links: [
          {
            icon: Library,
            label: '135-case library',
            description: '135 audited corporate decisions across 11 industries.',
            href: '/case-studies',
          },
          {
            icon: FileSearch,
            label: 'Pre-decision evidence',
            description: 'Biases detectable in the memo, before the outcome was known.',
            href: '/proof',
          },
          {
            icon: Microscope,
            label: 'Bias Genome',
            description: 'Which biases predict failure, by industry. Sortable, citable.',
            href: '/bias-genome',
          },
          {
            icon: TrendingUp,
            label: 'Decision Alpha',
            description: 'Quarterly sector index of bias-load and decision quality.',
            href: '/decision-alpha',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Flagship dataset',
      title: 'Bias Genome',
      body: 'The first public ranking of which biases predict failure by industry. Every metric carries its sample size; dimmed rows flag n<3. Built from 33 seed case studies; migrating to live customer data once 3+ orgs consent.',
      href: '/bias-genome',
      cta: 'Explore the data',
      icon: Dna,
    },
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    sections: [
      {
        eyebrow: 'Trust & procurement',
        links: [
          {
            icon: ShieldCheck,
            label: 'Security',
            description: 'AES-256-GCM with rotation, GDPR anonymizer, SOC 2 infrastructure.',
            href: '/security',
          },
          {
            icon: Scale,
            label: 'AI Verify alignment',
            description: 'Every DPR field mapped onto the 11 IMDA governance principles.',
            href: '/regulatory/ai-verify',
          },
          {
            icon: Lock,
            label: 'Privacy',
            description: 'No upstream training, GDPR rights, data-lifecycle diagram.',
            href: '/privacy',
          },
        ],
      },
      {
        eyebrow: 'Programs',
        links: [
          {
            icon: Handshake,
            label: 'Design partner program',
            description: 'Five seats. Twelve months. Fortune 500 strategy teams shaping R²F.',
            href: '/design-partner',
          },
          {
            icon: Building2,
            label: 'For the board',
            description: 'Four-minute read for the director whose CSO is about to ask.',
            href: '/decision-intel-for-boards',
          },
        ],
      },
    ],
    featured: {
      eyebrow: 'Why now',
      title: 'Regulatory tailwinds already in motion',
      body: 'EU AI Act (Aug 2026), SEC AI Disclosure (2024-26), Basel III ICAAP (live), SOX §404. Every DPR maps onto a named statute. Not speculative. Calendared.',
      href: '/security',
      cta: 'Read the posture',
      icon: Gavel,
    },
  },
];

// ─── Component ───────────────────────────────────────────────────────

export function MarketingNav() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | null>(null);

  const open = useCallback((id: string) => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenId(id);
  }, []);

  // Small grace period before close so users can traverse into the panel
  // without it snapping shut when the pointer leaves the trigger.
  const scheduleClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpenId(null);
      closeTimer.current = null;
    }, 150);
  }, []);

  const closeNow = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setOpenId(null);
  }, []);

  // Outside-click + Escape to close
  useEffect(() => {
    if (!openId) return;
    function onClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) closeNow();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeNow();
    }
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [openId, closeNow]);

  const activeMenu = openId ? MENUS.find(m => m.id === openId) : null;

  return (
    <nav
      ref={rootRef}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        background: C.navy,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Image
            src="/logo.png"
            alt="Decision Intel"
            width={28}
            height={28}
            style={{ borderRadius: 6, objectFit: 'cover' }}
          />
          <span
            style={{ fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: '-0.02em' }}
          >
            Decision Intel
          </span>
        </Link>

        {/* Desktop triggers */}
        <div
          className="marketing-nav-desktop"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {MENUS.map(m => {
            const isOpen = openId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onMouseEnter={() => open(m.id)}
                onMouseLeave={scheduleClose}
                onClick={() => (isOpen ? closeNow() : open(m.id))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isOpen ? C.white : C.slate300,
                  background: isOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'color 0.15s, background 0.15s',
                }}
              >
                {m.label}
                <ChevronDown
                  size={14}
                  style={{
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
            );
          })}
          <Link
            href="/pricing"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: C.slate300,
              textDecoration: 'none',
              padding: '10px 14px',
            }}
          >
            Pricing
          </Link>
        </div>

        {/* Right CTAs */}
        <div
          className="marketing-nav-desktop"
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <Link
            href="/login"
            style={{ fontSize: 14, color: C.slate300, textDecoration: 'none', fontWeight: 500 }}
          >
            Sign In
          </Link>
          <BookDemoCTA variant="nav" source="marketing_nav" />
          <Link
            href="/demo"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: C.white,
              background: C.green,
              padding: '8px 20px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Try the Demo
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="marketing-nav-mobile-btn"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          style={{
            background: 'none',
            border: 'none',
            color: C.white,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mega panel */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            key={activeMenu.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => open(activeMenu.id)}
            onMouseLeave={scheduleClose}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 64,
              background: C.white,
              borderBottom: `1px solid ${C.slate200}`,
              boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
            }}
            role="region"
            aria-label={`${activeMenu.label} menu`}
          >
            <MegaPanel menu={activeMenu} onNavigate={closeNow} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile accordion */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="marketing-nav-mobile-panel"
            style={{
              background: C.navyLight,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 24px 20px' }}>
              {MENUS.map(m => (
                <div key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => setMobileExpanded(prev => (prev === m.id ? null : m.id))}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 0',
                      background: 'none',
                      border: 'none',
                      color: C.white,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                    <ChevronDown
                      size={16}
                      style={{
                        transition: 'transform 0.2s',
                        transform:
                          mobileExpanded === m.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                  {mobileExpanded === m.id && (
                    <div style={{ paddingBottom: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {m.sections.flatMap(s => s.links).map(link => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 4px',
                              textDecoration: 'none',
                              color: C.slate300,
                              fontSize: 14,
                            }}
                          >
                            <Icon size={14} color={C.green} />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '14px 0',
                  color: C.white,
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Pricing
              </Link>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{ color: C.slate300, fontSize: 14, textDecoration: 'none' }}
                >
                  Sign In
                </Link>
                <div onClick={() => setMobileOpen(false)}>
                  <BookDemoCTA variant="nav" source="marketing_nav_mobile" />
                </div>
                <Link
                  href="/demo"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'inline-block',
                    textAlign: 'center',
                    padding: '12px 20px',
                    background: C.green,
                    color: C.white,
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Try the Demo
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .marketing-nav-desktop {
            display: none !important;
          }
        }
        @media (min-width: 1025px) {
          .marketing-nav-mobile-btn,
          .marketing-nav-mobile-panel {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}

// ─── MegaPanel ────────────────────────────────────────────────────────

function MegaPanel({ menu, onNavigate }: { menu: MegaMenu; onNavigate: () => void }) {
  const { sections, featured } = menu;
  const FeaturedIcon = featured.icon;
  return (
    <div
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '32px 24px 40px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
        gap: 40,
        alignItems: 'start',
      }}
      className="mega-panel-grid"
    >
      {/* Link columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            sections.length > 1 ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
          gap: 32,
        }}
      >
        {sections.map(section => (
          <div key={section.eyebrow}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.slate500,
                marginBottom: 14,
              }}
            >
              {section.eyebrow}
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {section.links.map(link => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      className="mega-link"
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(22,163,74,0.08)',
                          border: '1px solid rgba(22,163,74,0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <Icon size={15} color={C.green} strokeWidth={2.3} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 14.5,
                            fontWeight: 700,
                            color: C.slate900,
                            letterSpacing: '-0.005em',
                          }}
                        >
                          {link.label}
                        </span>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 12.5,
                            color: C.slate500,
                            lineHeight: 1.45,
                            marginTop: 2,
                          }}
                        >
                          {link.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Featured card */}
      <Link
        href={featured.href}
        onClick={onNavigate}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: 22,
          borderRadius: 14,
          background: C.navy,
          color: C.white,
          textDecoration: 'none',
          overflow: 'hidden',
          minHeight: 200,
        }}
        className="mega-featured"
      >
        {/* Soft green glow top-right */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(22,163,74,0.22) 0%, transparent 65%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'rgba(22,163,74,0.22)',
              border: '1px solid rgba(134,239,172,0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FeaturedIcon size={16} color="#86EFAC" strokeWidth={2.3} />
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#86EFAC',
            }}
          >
            {featured.eyebrow}
          </span>
        </div>
        <div
          style={{
            position: 'relative',
            fontSize: 18,
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          {featured.title}
        </div>
        <div
          style={{
            position: 'relative',
            fontSize: 13,
            color: C.slate300,
            lineHeight: 1.55,
          }}
        >
          {featured.body}
        </div>
        <div
          style={{
            position: 'relative',
            marginTop: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#86EFAC',
          }}
        >
          {featured.cta}
          <ArrowRight size={14} />
        </div>
      </Link>

      <style jsx>{`
        .mega-link:hover {
          background: ${C.slate50};
        }
        @media (max-width: 900px) {
          .mega-panel-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Keyboard focus ring — bare-minimum polish; outline is theme-aware */}
      <style jsx global>{`
        .mega-link:focus-visible {
          outline: 2px solid ${C.green};
          outline-offset: 2px;
        }
        .mega-featured:focus-visible {
          outline: 2px solid #86efac;
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}

// Shared brand colour tokens for marketing surfaces. Previously lived on
// the now-deleted CaseStudyNav; kept here so callers only need to import
// from a single marketing-nav module. Small surface, keeps the palette
// consistent across every public page.
export const BRAND_COLORS = C;

export type { LucideIcon };
