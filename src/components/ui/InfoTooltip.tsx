'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
    text: string;
    size?: number;
}

export function InfoTooltip({ text, size = 14 }: InfoTooltipProps) {
    const [show, setShow] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!show) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setShow(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [show]);

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                onClick={() => setShow(s => !s)}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                aria-label="What is this?"
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.6,
                    transition: 'opacity 0.15s',
                }}
                onFocus={() => setShow(true)}
                onBlur={() => setShow(false)}
            >
                <HelpCircle size={size} />
            </button>
            {show && (
                <div
                    role="tooltip"
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: 6,
                        padding: '8px 12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        width: 240,
                        zIndex: 30,
                        pointerEvents: 'none',
                    }}
                >
                    {text}
                </div>
            )}
        </div>
    );
}
