'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/** Floating button that appears after scrolling down, scrolls back to top on click. */
export function BackToTop({ threshold = 400 }: { threshold?: number }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY > threshold);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [threshold]);

    if (!visible) return null;

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="animate-fade-in"
            style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 40,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--liquid-bg-strong)',
                border: '1px solid var(--liquid-border)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'var(--liquid-shadow)',
                transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--liquid-border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <ArrowUp size={18} />
        </button>
    );
}
