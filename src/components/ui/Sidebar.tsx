'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, Activity, ShieldAlert, BarChart3, Menu, X, ClipboardList, Search, Globe, ChevronLeft, LogOut as LogOutIcon, MessageSquare, GitCompareArrows } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useIntelligenceStatus } from '@/hooks/useIntelligence';

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { status: intelStatus } = useIntelligenceStatus();
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
                    background: 'var(--liquid-bg)',
                    border: '1px solid var(--liquid-border)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-primary)',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    backdropFilter: 'blur(20px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
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
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 69,
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
                    background: 'var(--liquid-bg-strong)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    height: 'calc(100vh - 44px)',
                    position: 'sticky',
                    top: '44px',
                    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                }}
            >
                {/* Brand */}
                <div style={{
                    padding: collapsed ? '16px 12px' : '24px 20px',
                    borderBottom: '1px solid var(--liquid-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '72px',
                }}>
                    {!collapsed && (
                        <div>
                            <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                                <span style={{ color: 'var(--text-highlight)' }}>Decision</span>
                                <span style={{ color: 'var(--accent-primary)', marginLeft: '4px' }}>Intel</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Intelligence Platform
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            if (mobileOpen) setMobileOpen(false);
                            else setCollapsed(!collapsed);
                        }}
                        aria-label={mobileOpen ? 'Close navigation' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="hidden md:flex"
                        style={{
                            background: 'var(--liquid-bg)',
                            border: '1px solid var(--liquid-border)',
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
                        {mobileOpen ? <X size={16} /> : collapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
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
                            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
                        }}
                        title={collapsed ? 'Search (⌘K)' : undefined}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'space-between',
                            gap: '8px',
                            width: '100%',
                            padding: collapsed ? '8px' : '8px 12px',
                            marginBottom: '12px',
                            background: 'var(--liquid-bg)',
                            border: '1px solid var(--liquid-border)',
                            borderRadius: 'var(--radius-full)',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Search size={14} />
                            {!collapsed && <span>Search...</span>}
                        </span>
                        {!collapsed && (
                            <kbd style={{
                                fontSize: '10px',
                                padding: '1px 5px',
                                background: 'var(--liquid-bg)',
                                border: '1px solid var(--liquid-border)',
                                borderRadius: '6px',
                            }}>
                                ⌘K
                            </kbd>
                        )}
                    </button>

                    {!collapsed && (
                        <div style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            padding: '0 10px 8px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>
                            Platform
                        </div>
                    )}
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active={pathname === '/dashboard'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/" icon={<FileText size={18} />} label="Documents" active={(pathname === '/' || pathname.startsWith('/documents')) && !pathname.includes('trends')} collapsed={collapsed} onNavigate={closeMobile} />

                    {!collapsed && (
                        <div style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            padding: '20px 10px 8px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>
                            Analysis
                        </div>
                    )}
                    {collapsed && <div style={{ height: '20px' }} />}
                    <NavItem href="/dashboard/trends" icon={<Activity size={18} />} label="Historical Trends" description="Score trends over time" active={pathname === '/dashboard/trends'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/dashboard/insights" icon={<BarChart3 size={18} />} label="Visual Insights" description="Charts and bias breakdowns" active={pathname === '/dashboard/insights'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/dashboard/risk-audits" icon={<ShieldAlert size={18} />} label="Risk Audits" description="Compliance and risk reports" active={pathname === '/dashboard/risk-audits'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem
                        href="/dashboard/intelligence"
                        icon={<Globe size={18} />}
                        label="Intelligence"
                        description="External news and market signals"
                        active={pathname === '/dashboard/intelligence'}
                        collapsed={collapsed}
                        onNavigate={closeMobile}
                        badge={intelStatus ? {
                            color: intelStatus.freshness === 'fresh' ? 'var(--success)' : intelStatus.freshness === 'stale' ? 'var(--warning)' : 'var(--error)',
                        } : undefined}
                    />
                    <NavItem href="/dashboard/search" icon={<Search size={18} />} label="Search" description="Semantic search across documents" active={pathname === '/dashboard/search'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/dashboard/compare" icon={<GitCompareArrows size={18} />} label="Compare" description="Side-by-side document comparison" active={pathname === '/dashboard/compare'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/dashboard/chat" icon={<MessageSquare size={18} />} label="Chat" description="Ask questions about your documents" active={pathname === '/dashboard/chat'} collapsed={collapsed} onNavigate={closeMobile} />

                    {!collapsed && (
                        <div style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            padding: '20px 10px 8px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>
                            System
                        </div>
                    )}
                    {collapsed && <div style={{ height: '20px' }} />}
                    <NavItem href="/dashboard/audit-log" icon={<ClipboardList size={18} />} label="Audit Log" active={pathname === '/dashboard/audit-log'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" active={pathname === '/dashboard/settings'} collapsed={collapsed} onNavigate={closeMobile} />
                </nav>

                <div style={{
                    padding: collapsed ? '12px' : '12px 20px',
                    borderTop: '1px solid var(--liquid-border)',
                }}>
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
                            width: '100%',
                            color: 'var(--text-muted)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13.5px',
                            transition: 'color 0.15s',
                        }}
                    >
                        <LogOutIcon size={18} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
                <div style={{
                    padding: collapsed ? '12px' : '16px 20px',
                    borderTop: '1px solid var(--liquid-border)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                    }}>
                        <span style={{
                            width: '7px',
                            height: '7px',
                            background: 'var(--success)',
                            borderRadius: '50%',
                            flexShrink: 0,
                        }} />
                        {!collapsed && <span>Online</span>}
                    </div>
                </div>
            </aside>

            <style jsx>{`
                @media (max-width: 767px) {
                    aside[role="navigation"] {
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
                    aside[role="navigation"].sidebar-mobile-open {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
}

function NavItem({ href, icon, label, description, active, collapsed, onNavigate, badge }: { href: string, icon: React.ReactNode, label: string, description?: string, active?: boolean, collapsed?: boolean, onNavigate?: () => void, badge?: { color: string } }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [hovered, setHovered] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                aria-label={collapsed ? label : undefined}
                onMouseEnter={() => { setHovered(true); if (collapsed) setShowTooltip(true); }}
                onMouseLeave={() => { setHovered(false); setShowTooltip(false); }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? '0' : '12px',
                    padding: collapsed ? '10px' : '8px 12px',
                    color: active ? 'var(--text-highlight)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: active
                        ? 'rgba(99, 102, 241, 0.14)'
                        : hovered
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'transparent',
                    border: active
                        ? '1px solid rgba(99, 102, 241, 0.3)'
                        : hovered
                        ? '1px solid var(--liquid-border)'
                        : '1px solid transparent',
                    borderRadius: 'var(--radius-full)',
                    marginBottom: '2px',
                    fontSize: '13.5px',
                    fontWeight: active ? 600 : 400,
                    textDecoration: 'none',
                    backdropFilter: active || hovered ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: active || hovered ? 'blur(12px)' : 'none',
                    boxShadow: active ? '0 1px 0 rgba(255,255,255,0.08) inset' : 'none',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                <span style={{
                    color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                    flexShrink: 0,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    {icon}
                    {badge && (
                        <span style={{
                            position: 'absolute', top: '-3px', right: '-3px',
                            width: '7px', height: '7px',
                            background: badge.color,
                            borderRadius: '50%',
                        }} />
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
                        padding: '6px 10px',
                        background: 'var(--liquid-bg-strong)',
                        border: '1px solid var(--liquid-border)',
                        backdropFilter: 'blur(20px) saturate(160%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                        borderRadius: 'var(--radius-full)',
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
