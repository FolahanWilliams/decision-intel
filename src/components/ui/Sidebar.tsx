'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  Menu,
  X,
  ClipboardList,
  Search,
  ChevronLeft,
  LogOut as LogOutIcon,
  MessageSquare,
  GitCompareArrows,
  BrainCircuit,
  Bell,
  Video,
  BookOpen,
  Users,
  Zap,
  Network,
  Sparkles,
  Dna,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ThemeToggle, ThemeToggleCompact } from '@/components/ThemeToggle';
import { DensityToggle } from '@/components/DensityProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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
            background: 'rgba(0,0,0,0.7)',
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
          boxShadow: '1px 0 0 rgba(255, 255, 255, 0.06) inset, 4px 0 24px rgba(0, 0, 0, 0.4)',
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
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-lg)',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(255, 255, 255, 0.1)',
                }}
              >
                <Zap size={16} color="#080808" strokeWidth={2.5} />
              </div>
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
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-lg)',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: '0 2px 12px rgba(255, 255, 255, 0.1)',
              }}
            >
              <Zap size={16} color="#080808" strokeWidth={2.5} />
            </div>
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
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
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
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
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
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                }}
              >
                ⌘K
              </kbd>
            )}
          </button>

          <SectionLabel collapsed={collapsed}>Platform</SectionLabel>
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={pathname === '/dashboard'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/"
            icon={<FileText size={18} />}
            label="Documents"
            active={
              (pathname === '/' || pathname.startsWith('/documents')) &&
              !pathname.includes('trends')
            }
            collapsed={collapsed}
            onNavigate={closeMobile}
          />

          <SectionLabel collapsed={collapsed}>Analysis</SectionLabel>
          <NavItem
            href="/dashboard/insights"
            icon={<BarChart3 size={18} />}
            label="Insights & Trends"
            description="Charts, trends, and bias breakdowns"
            active={pathname === '/dashboard/insights'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/search"
            icon={<Search size={18} />}
            label="Search"
            description="Semantic search across documents"
            active={pathname === '/dashboard/search'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/compare"
            icon={<GitCompareArrows size={18} />}
            label="Compare"
            description="Side-by-side document comparison"
            active={pathname === '/dashboard/compare'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/decision-graph"
            icon={<Network size={18} />}
            label="Decision Graph"
            description="Map relationships between decisions"
            active={pathname === '/dashboard/decision-graph'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/copilot"
            icon={<Sparkles size={18} />}
            label="Copilot"
            description="AI agents that help you build better decisions"
            active={pathname === '/dashboard/copilot'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/decision-dna"
            icon={<Dna size={18} />}
            label="Decision DNA"
            description="Your unique decision profile and learning history"
            active={pathname === '/dashboard/decision-dna'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/chat"
            icon={<MessageSquare size={18} />}
            label="Chat"
            description="Ask questions about your documents"
            active={pathname === '/dashboard/chat'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/bias-library"
            icon={<BookOpen size={18} />}
            label="Bias Library"
            description="Learn about cognitive biases"
            active={pathname === '/dashboard/bias-library'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />

          <SectionLabel collapsed={collapsed}>Human Intelligence</SectionLabel>
          <NavItem
            href="/dashboard/cognitive-audits"
            icon={<BrainCircuit size={18} />}
            label="Cognitive Audits"
            description="Audit human decisions"
            active={pathname === '/dashboard/cognitive-audits'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/meetings"
            icon={<Video size={18} />}
            label="Meetings"
            description="Meeting recordings & transcripts"
            active={pathname.startsWith('/dashboard/meetings')}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/nudges"
            icon={<Bell size={18} />}
            label="Nudges"
            description="Decision coaching alerts"
            active={pathname === '/dashboard/nudges'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />

          <SectionLabel collapsed={collapsed}>Collaboration</SectionLabel>
          <NavItem
            href="/dashboard/team"
            icon={<Users size={18} />}
            label="Team"
            description="Manage your team and invites"
            active={pathname === '/dashboard/team'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />

          <SectionLabel collapsed={collapsed}>System</SectionLabel>
          <NavItem
            href="/dashboard/audit-log"
            icon={<ClipboardList size={18} />}
            label="Audit Log"
            active={pathname === '/dashboard/audit-log'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/dashboard/settings"
            icon={<Settings size={18} />}
            label="Settings"
            active={pathname === '/dashboard/settings'}
            collapsed={collapsed}
            onNavigate={closeMobile}
          />
        </nav>

        <div
          style={{
            padding: collapsed ? '12px' : '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.18)',
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
            borderTop: '1px solid rgba(255, 255, 255, 0.18)',
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
            ? 'rgba(255, 255, 255, 0.15)'
            : hovered
              ? 'rgba(255, 255, 255, 0.08)'
              : 'transparent',
          border: active
            ? '1px solid rgba(255, 255, 255, 0.28)'
            : hovered
              ? '1px solid rgba(255, 255, 255, 0.14)'
              : '1px solid transparent',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2px',
          fontSize: '13.5px',
          fontWeight: active ? 600 : 400,
          textDecoration: 'none',
          backdropFilter: active || hovered ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: active || hovered ? 'blur(12px)' : 'none',
          boxShadow: active
            ? '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(0,0,0,0.4)'
            : 'none',
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
            background: 'rgba(14, 14, 14, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
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
