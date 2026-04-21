'use client';

import { AlertTriangle, TrendingUp, Users, Zap, Target } from 'lucide-react';
import { FourMomentsHero } from './overview/FourMomentsHero';
import { MetricsDashboard } from './overview/MetricsDashboard';
import { ProblemConstellation } from './overview/ProblemConstellation';
import { PersonaValueMatrix } from './overview/PersonaValueMatrix';
import { ShippedFeatureRibbon } from './overview/ShippedFeatureRibbon';
import { ROI_NARRATIVE, SHIPPED_FEATURES } from '@/lib/data/product-overview';

function SectionHeading({
  icon,
  title,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${accent}18`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function Section({
  children,
  icon,
  title,
  subtitle,
  accent,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 16,
      }}
    >
      <SectionHeading icon={icon} title={title} subtitle={subtitle} accent={accent} />
      {children}
    </section>
  );
}

export function ProductOverviewTab() {
  // Render the ROI narrative body with inline emphasis on **bold** spans.
  const renderROI = () => {
    const parts = ROI_NARRATIVE.body.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: '#16A34A' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div>
      {/* Hero — always at top, no wrapping section */}
      <div style={{ marginBottom: 16 }}>
        <FourMomentsHero />
      </div>

      <Section
        icon={<Target size={16} />}
        title="Product at a Glance"
        subtitle="Six numbers that frame what the platform actually ships today."
        accent="#0EA5E9"
      >
        <MetricsDashboard />
      </Section>

      <Section
        icon={<AlertTriangle size={16} />}
        title="The Problem"
        subtitle="Six pains that show up in every CSO conversation. Click any card for the detail + citation."
        accent="#EF4444"
      >
        <ProblemConstellation />
      </Section>

      <Section
        icon={<Users size={16} />}
        title="Value by Persona"
        subtitle="Pick a buyer on the left. See their pain, then what we deliver — expressed the way they would."
        accent="#8B5CF6"
      >
        <PersonaValueMatrix />
      </Section>

      {/* ROI — a tight narrative card, not a full viz */}
      <section
        style={{
          padding: 18,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(16,185,129,0.04))',
          border: '1px solid var(--border-color)',
          borderLeft: '3px solid #16A34A',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <TrendingUp size={16} style={{ color: '#16A34A' }} />
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#16A34A',
            }}
          >
            {ROI_NARRATIVE.headline}
          </div>
        </div>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-primary)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {renderROI()}
        </p>
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--border-color)',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          {ROI_NARRATIVE.pricingAnchor}
        </div>
      </section>

      <Section
        icon={<Zap size={16} />}
        title={`Recently Shipped · ${SHIPPED_FEATURES.length} features`}
        subtitle="Filter by category. Click any tile to see what it actually does."
        accent="#F59E0B"
      >
        <ShippedFeatureRibbon />
      </Section>
    </div>
  );
}
