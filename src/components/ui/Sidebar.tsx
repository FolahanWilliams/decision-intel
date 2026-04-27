'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  Menu,
  X,
  Search,
  ChevronLeft,
  LogOut as LogOutIcon,
  Video,
  Users,
  Bot,
  Plus,
  ChevronRight as ChevronR,
  PenLine,
  Briefcase,
  BookTemplate,
  Share2,
  Repeat,
  ShieldCheck,
  Package,
  Brain,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ThemeToggle, ThemeToggleCompact } from '@/components/ThemeToggle';
import { DensityToggle } from '@/components/DensityProvider';
import { UsageMeter } from '@/components/billing/UsageMeter';
import { FlywheelChips } from '@/components/ui/FlywheelChips';

const SIDEBAR_COLLAPSED_KEY = 'di-sidebar-main-collapsed';
const SIDEBAR_SECTIONS_KEY = 'di-sidebar-collapsed';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view') ?? null;
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plan, setPlan] = useState<string>('free');
  // Sidebar clusters (2026-04-23 rework): Act / Reflect / Together matches
  // how a CSO's week actually runs — do the thing, learn from last quarter,
  // operate with the team. "Act" is non-collapsible top-level; "Reflect"
  // and "Together" fold away to keep the rail short.
  // Reflect default flipped 2026-04-25 from collapsed to expanded — first-time
  // users were missing Analytics / Decision Graph / Outcome Flywheel because
  // those features hide behind the cluster header. Together stays collapsed
  // (post-team activation a user usually only opens it when actively
  // collaborating). Existing users who explicitly collapsed Reflect will keep
  // their preference via the localStorage hydration below.
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    Reflect: false,
    Together: true,
  });

  // Persist the full-sidebar collapse state so the hamburger's effect is
  // durable — previously the button toggled state that reset on every page
  // load, which made it look broken. Wrapped setter so every call writes
  // through to localStorage.
  const setCollapsed = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setCollapsedState(prev => {
      const value = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? '1' : '0');
      } catch {
        // localStorage may throw on quota / private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      }
      return value;
    });
  }, []);

  // Hydrate from localStorage on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved === '1') setCollapsedState(true);
    } catch {
      // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  }, []);

  // Fetch plan for feature-gating team-only nav items
  useEffect(() => {
    fetch('/api/billing')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.plan) setPlan(data.plan);
      })
      .catch(err => console.warn('[Sidebar] billing fetch failed:', err));
  }, []);

  const isTeamPlan = plan === 'team' || plan === 'enterprise';

  // Persist collapsed sections to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
      if (saved) setCollapsedSections(JSON.parse(saved));
    } catch {
      // localStorage / JSON.parse may throw — silent fallback per CLAUDE.md fire-and-forget exceptions.
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [section]: !prev[section] };
      try {
        localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(next));
      } catch {
        // localStorage may throw in private-mode Safari — silent fallback per CLAUDE.md fire-and-forget exceptions.
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  // Scales subtly with viewport so the sidebar doesn't look undersized on
  // 27"+ monitors. Stays fixed at 72px when collapsed.
  const sidebarWidth = collapsed ? '72px' : 'clamp(260px, 15vw, 300px)';

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        style={{
          position: 'fixed',
          top: '52px',
          left: '12px',
          zIndex: 60,
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-elevated)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--text-primary)',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          boxShadow: 'var(--liquid-shadow)',
        }}
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-bg, rgba(0,0,0,0.7))',
            zIndex: 69,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={mobileOpen ? 'sidebar-mobile-open' : ''}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          borderRight: '1px solid var(--liquid-border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--liquid-tint)',
          backdropFilter: 'blur(var(--liquid-blur-strong)) saturate(160%)',
          WebkitBackdropFilter: 'blur(var(--liquid-blur-strong)) saturate(160%)',
          height: 'calc(100vh - 44px)',
          position: 'sticky',
          top: '44px',
          transition:
            'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          boxShadow: '1px 0 0 var(--bg-card-hover) inset, var(--liquid-shadow)',
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: collapsed ? '16px 12px' : '24px 20px',
            borderBottom: '1px solid var(--liquid-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '72px',
          }}
        >
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Image
                src="/logo.png"
                alt="Decision Intel"
                width={32}
                height={32}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  objectFit: 'cover',
                }}
              />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                  <span style={{ color: 'var(--text-highlight)' }}>Decision</span>
                  <span
                    style={{
                      marginLeft: '4px',
                      color: 'var(--text-highlight)',
                    }}
                  >
                    Intel
                  </span>
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <Image
              src="/logo.png"
              alt="Decision Intel"
              width={32}
              height={32}
              style={{
                borderRadius: 'var(--radius-lg)',
                objectFit: 'cover',
                margin: '0 auto',
                display: 'block',
              }}
            />
          )}
          <button
            onClick={() => {
              if (mobileOpen) setMobileOpen(false);
              else setCollapsed(!collapsed);
            }}
            aria-label={
              mobileOpen ? 'Close navigation' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            className="hidden md:flex"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--bg-elevated)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {mobileOpen ? (
              <X size={16} />
            ) : collapsed ? (
              <Menu size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="md:hidden"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav style={{ padding: collapsed ? '12px 8px' : '16px 12px', flex: 1, overflowY: 'auto' }}>
          {/* Quick search shortcut */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
              );
            }}
            title={collapsed ? 'Search (⌘K)' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: '8px',
              width: '100%',
              padding: collapsed ? '8px' : '8px 12px',
              marginBottom: '16px',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} />
              {!collapsed && <span>Search...</span>}
            </span>
            {!collapsed && (
              <kbd
                style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--bg-elevated)',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                }}
              >
                ⌘K
              </kbd>
            )}
          </button>

          {/* Start-an-audit button. The label was previously "New Decision"
              which Adaeze's audit flagged as unfamiliar — the modal it
              opens routes to one of four concrete entry points (Analyze a
              Document, Think Through a Decision, Audit a Decision, Upload
              a Meeting), none of which is a "decision frame" in the
              audit's misread sense. The label now matches what actually
              happens. */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-new-decision-modal'))}
            title={collapsed ? 'Start an audit' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? '0' : '10px',
              width: '100%',
              padding: collapsed ? '10px' : '10px 14px',
              marginBottom: '16px',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-on-accent, #fff)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            <Plus size={16} />
            {!collapsed && <span>Start an audit</span>}
          </button>

          {/* Act — what the CSO does this week. Drafting, uploading,
              logging, chasing the live portfolio of decisions. Not
              collapsible: these are the daily verbs. */}
          <SectionLabel collapsed={collapsed} icon={<ActGlyph />}>
            Act
          </SectionLabel>
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            description="Upload, browse & analyze"
            active={pathname === '/dashboard'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/deals"
            icon={<Briefcase size={18} />}
            label="Projects"
            description="Track projects from intake to completion"
            active={pathname.startsWith('/dashboard/deals')}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard?view=browse"
            icon={<FileText size={18} />}
            label="Documents"
            description="Browse uploaded documents"
            active={
              pathname.startsWith('/documents') ||
              (pathname === '/dashboard' && viewParam === 'browse')
            }
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/ask"
            icon={<Bot size={18} />}
            label="AI Copilot"
            description="Decision copilot & document chat"
            active={
              pathname.startsWith('/dashboard/ask') ||
              pathname.startsWith('/dashboard/ai-assistant')
            }
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/decision-log"
            icon={<PenLine size={18} />}
            label="Decision Log"
            description="Journal entries + cognitive audits in one feed"
            active={
              pathname === '/dashboard/decision-log' ||
              pathname.startsWith('/dashboard/cognitive-audits')
            }
            collapsed={collapsed}
            onNavigate={closeMobile}
          />

          {/* Reflect — what the CSO learns from last quarter. Analytics,
              graph, outcome loop, playbooks. Collapsible — these are the
              deeper surfaces you dive into, not the daily rituals. */}
          <CollapsibleSection
            label="Reflect"
            icon={<ReflectGlyph />}
            collapsed={collapsed}
            isOpen={!collapsedSections.Reflect}
            onToggle={() => toggleSection('Reflect')}
          >
            <NavItem
              id="onborda-nav-analytics"
              href="/dashboard/analytics"
              icon={<BarChart3 size={18} />}
              label="Analytics"
              description="Trends, quality, outcomes & decision graph"
              active={
                pathname.startsWith('/dashboard/analytics') ||
                pathname.startsWith('/dashboard/outcome-flywheel') ||
                pathname.startsWith('/dashboard/decision-graph') ||
                pathname.startsWith('/dashboard/decision-quality')
              }
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
            {!collapsed &&
              (pathname.startsWith('/dashboard/analytics') ||
                pathname.startsWith('/dashboard/outcome-flywheel') ||
                pathname.startsWith('/dashboard/decision-graph') ||
                pathname.startsWith('/dashboard/decision-quality')) && (
                <>
                  <SubNavItem
                    href="/dashboard/decision-graph"
                    icon={<Share2 size={14} />}
                    label="Decision Graph"
                    active={pathname.startsWith('/dashboard/decision-graph')}
                    onNavigate={closeMobile}
                  />
                  <SubNavItem
                    href="/dashboard/outcome-flywheel"
                    icon={<Repeat size={14} />}
                    label="Outcome Flywheel"
                    active={pathname.startsWith('/dashboard/outcome-flywheel')}
                    onNavigate={closeMobile}
                  />
                </>
              )}
            <NavItem
              href="/dashboard/decisions"
              icon={<Package size={18} />}
              label="Decisions"
              description="Decision Packages — composite DQI + cross-doc audit"
              active={pathname.startsWith('/dashboard/decisions')}
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
            <NavItem
              href="/dashboard/decision-dna"
              icon={<Brain size={18} />}
              label="Decision DNA"
              description="Your personal calibration — biases, agents, outcomes over time"
              active={pathname.startsWith('/dashboard/decision-dna')}
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
            <NavItem
              href="/dashboard/playbooks"
              icon={<BookTemplate size={18} />}
              label="Playbooks"
              description="Pre-configured analysis templates"
              active={pathname.startsWith('/dashboard/playbooks')}
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
            <NavItem
              href="/dashboard/provenance"
              icon={<ShieldCheck size={18} />}
              label="Provenance"
              description="Archive of hashed, tamper-evident Decision Provenance Records"
              active={pathname.startsWith('/dashboard/provenance')}
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
          </CollapsibleSection>

          {/* Together — how the team operates. Meetings, decision rooms,
              teammates, integrations, settings. Collapsible. */}
          <CollapsibleSection
            label="Together"
            icon={<TogetherGlyph />}
            collapsed={collapsed}
            isOpen={!collapsedSections.Together}
            onToggle={() => toggleSection('Together')}
          >
            {isTeamPlan && (
              <NavItem
                href="/dashboard/meetings"
                icon={<Video size={18} />}
                label="Meetings & Rooms"
                description="Recordings, transcripts & decision rooms"
                active={pathname.startsWith('/dashboard/meetings')}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            )}
            <NavItem
              href="/dashboard/team"
              icon={<Users size={18} />}
              label="Team"
              description="Manage your team and invites"
              active={pathname === '/dashboard/team'}
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
            <NavItem
              href="/dashboard/settings"
              icon={<Settings size={18} />}
              label="Settings"
              active={
                pathname === '/dashboard/settings' ||
                pathname.startsWith('/dashboard/settings/') ||
                pathname === '/dashboard/audit-log'
              }
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
          </CollapsibleSection>
        </nav>

        {!collapsed && (
          <div
            style={{
              padding: '10px 14px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <UsageMeter variant="compact" />
            <FlywheelChips variant="compact" />
          </div>
        )}

        <div
          style={{
            padding: collapsed ? '12px' : '12px 20px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {collapsed ? (
              <>
                <ThemeToggleCompact className="flex-1" />
                <DensityToggle className="flex-1" />
              </>
            ) : (
              <>
                <ThemeToggle className="flex-1" />
                <DensityToggle className="flex-1" />
              </>
            )}
            <button
              onClick={async () => {
                const { createClient } = await import('@/utils/supabase/client');
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              title={collapsed ? 'Sign out' : undefined}
              aria-label="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? '0' : '12px',
                padding: collapsed ? '10px' : '9px 12px',
                flex: collapsed ? 1 : 'none',
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                transition: 'color 0.15s',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <LogOutIcon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
        <div
          style={{
            padding: collapsed ? '12px' : '16px 20px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span
              className="status-glow-green"
              style={{
                width: '8px',
                height: '8px',
                background: '#34d399',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
            {!collapsed && <span>Online</span>}
          </div>
        </div>
      </aside>

      <style jsx>{`
        @media (max-width: 767px) {
          aside[role='navigation'] {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            z-index: 70;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 260px !important;
            min-width: 260px !important;
          }
          aside[role='navigation'].sidebar-mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

function SectionLabel({
  collapsed,
  icon,
  children,
}: {
  collapsed: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (collapsed) return <div style={{ height: '20px' }} />;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        padding: '20px 10px 8px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {icon}
      {children}
    </div>
  );
}

// Sidebar cluster glyphs — bespoke 12×12 SVGs so Act / Reflect / Together
// read at a glance as a thought-out information architecture, not a generic
// Lucide sidebar. Stroke-only, currentColor, matches Lucide weight.
function ActGlyph() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.25 6h6" />
      <path d="M5.5 3.25 8.25 6 5.5 8.75" />
    </svg>
  );
}

function ReflectGlyph() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 6a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M6 4a2 2 0 1 0 2 2" />
      <path d="M6 6h.01" />
    </svg>
  );
}

function TogetherGlyph() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="3" cy="3.75" r="1.25" />
      <circle cx="9" cy="3.75" r="1.25" />
      <circle cx="6" cy="9" r="1.25" />
      <path d="M4.25 3.75h3.5" />
      <path d="M3.7 4.9 5.35 7.85" />
      <path d="M8.3 4.9 6.65 7.85" />
    </svg>
  );
}

function NavItem({
  id,
  href,
  icon,
  label,
  description,
  active,
  collapsed,
  onNavigate,
  badge,
}: {
  id?: string;
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  active?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  badge?: { color: string };
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <Link
        id={id}
        href={href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? label : undefined}
        onMouseEnter={() => {
          setHovered(true);
          if (collapsed) setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
          setShowTooltip(false);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? '0' : '12px',
          padding: collapsed ? '10px' : '8px 12px',
          color: active
            ? 'var(--text-highlight)'
            : hovered
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
          background: active
            ? 'var(--bg-elevated)'
            : hovered
              ? 'var(--bg-card-hover)'
              : 'transparent',
          border: active
            ? '1px solid var(--border-color)'
            : hovered
              ? '1px solid var(--border-color)'
              : '1px solid transparent',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2px',
          fontSize: '13.5px',
          fontWeight: active ? 600 : 400,
          textDecoration: 'none',
          backdropFilter: active || hovered ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: active || hovered ? 'blur(12px)' : 'none',
          boxShadow: active ? '0 1px 0 var(--bg-elevated) inset, var(--liquid-shadow)' : 'none',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <span
          style={{
            color: active ? 'var(--text-highlight)' : 'var(--text-muted)',
            flexShrink: 0,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
          {badge && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '7px',
                height: '7px',
                background: badge.color,
                borderRadius: '50%',
              }}
            />
          )}
        </span>
        {!collapsed && <span>{label}</span>}
      </Link>
      {/* Custom tooltip for collapsed sidebar */}
      {collapsed && showTooltip && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: 8,
            padding: '6px 12px',
            background: 'var(--liquid-tint)',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 80,
            pointerEvents: 'none',
            boxShadow: 'var(--liquid-shadow)',
          }}
        >
          {label}
          {description && (
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
              {description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubNavItem({
  href,
  icon,
  label,
  active,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 10px 6px 28px',
        color: active
          ? 'var(--text-highlight)'
          : hovered
            ? 'var(--text-primary)'
            : 'var(--text-secondary)',
        background: active ? 'var(--bg-card-hover)' : 'transparent',
        borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
        marginLeft: '12px',
        marginBottom: '1px',
        fontSize: '12.5px',
        fontWeight: active ? 600 : 400,
        textDecoration: 'none',
        borderRadius: 0,
        transition: 'all 0.15s',
      }}
    >
      <span
        style={{
          color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function CollapsibleSection({
  label,
  icon,
  collapsed: sidebarCollapsed,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  // When sidebar is collapsed (narrow), just show the children items as icons
  if (sidebarCollapsed) {
    return (
      <>
        <div style={{ height: '20px' }} />
        {children}
      </>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          padding: '20px 10px 8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <ChevronR
          size={10}
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        {icon}
        {label}
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.2s ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
}
