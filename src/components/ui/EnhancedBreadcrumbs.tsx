'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, FileText, Brain, BarChart3, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

// Path to title mapping for static routes
const staticTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  documents: 'Documents',
  insights: 'Insights & Trends',
  search: 'Search',
  compare: 'Compare',
  chat: 'AI Chat',
  'cognitive-audits': 'Cognitive Audits',
  'audit-log': 'Audit Log',
  meetings: 'Meetings',
  nudges: 'Nudges',
  settings: 'Settings',
  team: 'Team',
  'bias-library': 'Bias Library',
  'decision-quality': 'Decision Quality',
  'ai-assistant': 'AI Assistant',
  analytics: 'Analytics',
  'decision-dna': 'Decision DNA',
  submit: 'New Analysis',
  effectiveness: 'Effectiveness',
};

// Icons for different sections
const sectionIcons: Record<string, React.ReactNode> = {
  dashboard: <Home size={14} />,
  documents: <FileText size={14} />,
  'cognitive-audits': <Brain size={14} />,
  insights: <BarChart3 size={14} />,
  team: <Users size={14} />,
};

export function EnhancedBreadcrumbs() {
  const pathname = usePathname();
  const [dynamicTitles, setDynamicTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Fetch dynamic titles for IDs in the path
  useEffect(() => {
    const fetchDynamicTitle = async (segment: string, type: string) => {
      // Check if it's a UUID-like ID
      if (!/^[0-9a-f-]{36}$/i.test(segment) && !/^\d+$/.test(segment)) {
        return;
      }

      const loadingKey = `${type}:${segment}`;
      setLoading(prev => new Set(prev).add(loadingKey));

      try {
        // Fetch based on the type
        let title = segment;

        if (type === 'documents') {
          const res = await fetch(`/api/documents/${segment}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            title = data.filename || data.title || segment;
          }
        } else if (type === 'cognitive-audits') {
          // For cognitive audits, try to get the associated document name
          const res = await fetch(`/api/documents?analysisId=${segment}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.documents && data.documents[0]) {
              title = `Audit: ${data.documents[0].filename}`;
            }
          }
        } else if (type === 'meetings') {
          const res = await fetch(`/api/meetings/${segment}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            title = data.title || data.subject || segment;
          }
        }

        setDynamicTitles(prev => ({ ...prev, [loadingKey]: title }));
      } catch (error) {
        console.error('Failed to fetch dynamic title:', error);
      } finally {
        setLoading(prev => {
          const next = new Set(prev);
          next.delete(loadingKey);
          return next;
        });
      }
    };

    // Parse the pathname to identify dynamic segments
    const segments = pathname.split('/').filter(Boolean);

    segments.forEach((segment, index) => {
      if (index > 0) {
        const prevSegment = segments[index - 1];
        // Check if this looks like an ID and the previous segment indicates the type
        if (/^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment)) {
          fetchDynamicTitle(segment, prevSegment);
        }
      }
    });
  }, [pathname]);

  // Build breadcrumb items from pathname
  const items: BreadcrumbItem[] = [];
  const segments = pathname.split('/').filter(Boolean);

  // Always add home
  items.push({
    label: 'Home',
    href: '/dashboard',
    icon: <Home size={14} />,
  });

  // Build the rest of the breadcrumb trail
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Check for dynamic title
    let label = staticTitles[segment] || segment;
    const icon = sectionIcons[segment];

    // Check if this is an ID with a fetched title
    if (index > 0) {
      const prevSegment = segments[index - 1];
      const dynamicKey = `${prevSegment}:${segment}`;
      if (dynamicTitles[dynamicKey]) {
        label = dynamicTitles[dynamicKey];
      } else if (loading.has(dynamicKey)) {
        label = 'Loading...';
      }
    }

    // Format the label
    if (!staticTitles[segment] && !dynamicTitles[`${segments[index - 1]}:${segment}`]) {
      // Capitalize and format segment
      label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    items.push({
      label,
      href: isLast ? undefined : currentPath,
      icon: icon,
      isLoading: index > 0 && loading.has(`${segments[index - 1]}:${segment}`),
    });
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('mb-4 px-1', 'density-compact:mb-2', 'density-dense:mb-1')}
    >
      <ol className="flex items-center gap-1 list-none p-0 m-0 text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight size={12} className="text-muted" aria-hidden="true" />}
              <div className="flex items-center gap-1.5">
                {item.icon && !item.isLoading && <span className="text-muted">{item.icon}</span>}
                {item.isLoading ? (
                  <span className="text-muted animate-pulse">Loading...</span>
                ) : isLast || !item.href ? (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={cn(
                      isLast ? 'text-primary font-medium' : 'text-muted',
                      'max-w-[200px] truncate'
                    )}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'text-muted hover:text-primary transition-colors',
                      'max-w-[200px] truncate inline-block'
                    )}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
