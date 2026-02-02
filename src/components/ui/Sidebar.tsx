'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, Activity, ShieldAlert } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside style={{
            width: '240px',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary)',
            height: 'calc(100vh - 32px)', // Subtract ticker height
            position: 'sticky',
            top: '32px'
        }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#fff' }}>DECISION</span>
                    <span style={{ color: 'var(--accent-primary)' }}>INTEL</span>
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', letterSpacing: '1px' }}>
                    TERMINAL v1.2
                </div>
            </div>

            <nav style={{ padding: '16px', flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#666', padding: '0 12px 8px', textTransform: 'uppercase' }}>
                    Platform
                </div>
                <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active={pathname === '/dashboard'} />
                <NavItem href="/" icon={<FileText size={18} />} label="Documents" active={(pathname === '/' || pathname.startsWith('/documents')) && !pathname.includes('trends')} />

                <div style={{ fontSize: '11px', color: '#666', padding: '16px 12px 8px', textTransform: 'uppercase' }}>
                    Analysis
                </div>
                <NavItem href="/dashboard/trends" icon={<Activity size={18} />} label="Historical Trends" active={pathname === '/dashboard/trends'} />
                <NavItem href="#" icon={<ShieldAlert size={18} />} label="Risk Audits" />

                <div style={{ fontSize: '11px', color: '#666', padding: '16px 12px 8px', textTransform: 'uppercase' }}>
                    System
                </div>
                <NavItem href="#" icon={<Settings size={18} />} label="Settings" />
            </nav>

            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: '#666' }}>
                    Status: <span style={{ color: 'var(--success)' }}>ONLINE</span>
                </div>
            </div>
        </aside>
    );
}

function NavItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <Link href={href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            color: active ? 'var(--text-highlight)' : 'var(--text-secondary)',
            background: active ? 'rgba(255, 159, 10, 0.1)' : 'transparent',
            borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
            marginBottom: '4px',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.1s'
        }}>
            <span style={{ color: active ? 'var(--accent-primary)' : 'inherit' }}>{icon}</span>
            {label}
        </Link>
    );
}
