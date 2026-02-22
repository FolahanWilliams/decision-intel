'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--spacing-md)' }}>
            <ol
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    fontSize: '12px',
                }}
            >
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <li
                            key={index}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            {index > 0 && (
                                <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                            )}
                            {isLast || !item.href ? (
                                <span
                                    aria-current={isLast ? 'page' : undefined}
                                    style={{ color: isLast ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href}
                                    style={{
                                        color: 'var(--text-muted)',
                                        textDecoration: 'none',
                                        borderBottom: 'none',
                                    }}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
