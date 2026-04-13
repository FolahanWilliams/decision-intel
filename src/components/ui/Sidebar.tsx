'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  Sparkles,
  Plus,
  ChevronRight as ChevronR,
  PenLine,
  Briefcase,
  BookTemplate,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ThemeToggle, ThemeToggleCompact } from '@/components/ThemeToggle';
import { DensityToggle } from '@/components/DensityProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plan, setPlan] = useState<string>('free');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    Intelligence: true,
    'Team & Settings': true,
  });

  // Fetch plan for feature-gating team-only nav items
  useEffect(() => {
    fetch('/api/billing')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.plan) setPlan(data.plan);
      })
      .catch(() => {});
  }, []);

  const isTeamPlan = plan === 'team' || plan === 'enterprise';

  // Persist collapsed sections to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('di-sidebar-collapsed');
      if (saved) setCollapsedSections(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [section]: !prev[section] };
      try {
        localStorage.setItem('di-sidebar-collapsed', JSON.stringify(next));
      } catch {
        /* ignore */
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

  const sidebarWidth = collapsed ? '72px' : '260px';

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
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '1px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Intelligence Platform
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

          {/* New Decision button */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-new-decision-modal'))}
            title={collapsed ? 'New Decision' : undefined}
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
            {!collapsed && <span>New Decision</span>}
          </button>

          <SectionLabel collapsed={collapsed}>Core</SectionLabel>
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
            active={pathname.startsWith('/documents')}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />

          <CollapsibleSection
            label="Intelligence"
            collapsed={collapsed}
            isOpen={!collapsedSections.Intelligence}
            onToggle={() => toggleSection('Intelligence')}
          >
            <NavItem
              href="/dashboard/ask"
              icon={<Sparkles size={18} />}
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
              href="/dashboard/analytics"
              icon={<BarChart3 size={18} />}
              label="Analytics"
              description="Trends, quality, outcomes & decision graph"
              active={
                pathname.startsWith('/dashboard/analytics') ||
                pathname.startsWith('/dashboard/outcome-flywheel') ||
                pathname.startsWith('/dashboard/decision-graph') ||
                pathname.startsWith('/dashboard/decision-quality') ||
                pathname.startsWith('/dashboard/cognitive-audits') ||
                pathname.startsWith('/calibration') ||
                pathname.startsWith('/dashboard/experiments')
              }
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
            {isTeamPlan && (
              <NavItem
                href="/dashboard/meetings"
                icon={<Video size={18} />}
                label="Meetings & Rooms"
                description="Recordings, transcripts & decision rooms"
                active={
                  pathname.startsWith('/dashboard/meetings') ||
                  pathname.startsWith('/dashboard/decision-rooms')
                }
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            )}
            <NavItem
              href="/dashboard/journal"
              icon={<PenLine size={18} />}
              label="Decision Journal"
              description="Record and reflect on decisions"
              active={pathname === '/dashboard/journal'}
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
          </CollapsibleSection>

          <CollapsibleSection
            label="Team & Settings"
            collapsed={collapsed}
            isOpen={!collapsedSections['Team & Settings']}
            onToggle={() => toggleSection('Team & Settings')}
          >
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

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  if (collapsed) return <div style={{ height: '20px' }} />;
  return (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        padding: '20px 10px 8px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  description,
  active,
  collapsed,
  onNavigate,
  badge,
}: {
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

function CollapsibleSection({
  label,
  collapsed: sidebarCollapsed,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
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
