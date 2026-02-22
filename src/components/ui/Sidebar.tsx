'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, Activity, ShieldAlert, BarChart3, Menu, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close on navigation — wrap in callback to pass to NavItem
    const closeMobile = useCallback(() => setMobileOpen(false), []);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [mobileOpen]);

    const sidebarWidth = collapsed ? '64px' : '240px';

    return (
        <>
            {/* Mobile hamburger trigger */}
            <button
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                style={{
                    position: 'fixed',
                    top: '36px',
                    left: '8px',
                    zIndex: 60,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <Menu size={20} />
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
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-secondary)',
                    height: 'calc(100vh - 32px)',
                    position: 'sticky',
                    top: '32px',
                    transition: 'width 0.2s ease, min-width 0.2s ease',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: collapsed ? '16px 8px' : '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {!collapsed && (
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                                <span style={{ color: 'var(--text-highlight)' }}>DECISION</span>
                                <span style={{ color: 'var(--accent-primary)' }}>INTEL</span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '1px' }}>
                                TERMINAL v1.2
                            </div>
                        </div>
                    )}
                    {/* Collapse toggle (desktop) + close (mobile) */}
                    <button
                        onClick={() => {
                            if (mobileOpen) setMobileOpen(false);
                            else setCollapsed(!collapsed);
                        }}
                        aria-label={mobileOpen ? 'Close navigation' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="hidden md:flex"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {mobileOpen ? <X size={18} /> : <Menu size={16} />}
                    </button>
                    {/* Mobile close button */}
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

                <nav style={{ padding: collapsed ? '8px' : '16px', flex: 1 }}>
                    {!collapsed && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '0 12px 8px', textTransform: 'uppercase' }}>
                            Platform
                        </div>
                    )}
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active={pathname === '/dashboard'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/" icon={<FileText size={18} />} label="Documents" active={(pathname === '/' || pathname.startsWith('/documents')) && !pathname.includes('trends')} collapsed={collapsed} onNavigate={closeMobile} />

                    {!collapsed && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '16px 12px 8px', textTransform: 'uppercase' }}>
                            Analysis
                        </div>
                    )}
                    {collapsed && <div style={{ height: '16px' }} />}
                    <NavItem href="/dashboard/trends" icon={<Activity size={18} />} label="Historical Trends" active={pathname === '/dashboard/trends'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/dashboard/insights" icon={<BarChart3 size={18} />} label="Visual Insights" active={pathname === '/dashboard/insights'} collapsed={collapsed} onNavigate={closeMobile} />
                    <NavItem href="/dashboard/risk-audits" icon={<ShieldAlert size={18} />} label="Risk Audits" active={pathname === '/dashboard/risk-audits'} collapsed={collapsed} onNavigate={closeMobile} />

                    {!collapsed && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '16px 12px 8px', textTransform: 'uppercase' }}>
                            System
                        </div>
                    )}
                    {collapsed && <div style={{ height: '16px' }} />}
                    <NavItem href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" active={pathname === '/dashboard/settings'} collapsed={collapsed} onNavigate={closeMobile} />
                </nav>

                <div style={{ padding: collapsed ? '8px' : '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: collapsed ? 'center' : 'left' }}>
                        {collapsed ? '' : 'Status: '}<span style={{ color: 'var(--success)' }}>{collapsed ? '●' : 'ONLINE'}</span>
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
                        transition: transform 0.2s ease;
                        width: 240px !important;
                        min-width: 240px !important;
                    }
                    aside[role="navigation"].sidebar-mobile-open {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
}

function NavItem({ href, icon, label, active, collapsed, onNavigate }: { href: string, icon: React.ReactNode, label: string, active?: boolean, collapsed?: boolean, onNavigate?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? label : undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? '0' : '12px',
                padding: collapsed ? '10px' : '10px 12px',
                color: active ? 'var(--text-highlight)' : 'var(--text-secondary)',
                background: active ? 'rgba(255, 159, 10, 0.1)' : 'transparent',
                borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
                marginBottom: '4px',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.1s'
            }}
        >
            <span style={{ color: active ? 'var(--accent-primary)' : 'inherit', flexShrink: 0 }}>{icon}</span>
            {!collapsed && label}
        </Link>
    );
}
