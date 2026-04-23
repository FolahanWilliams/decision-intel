'use client';

import { useState } from 'react';
import { User, Users } from 'lucide-react';
import { DecisionDNAPageContent } from '@/components/dna/DecisionDNAPageContent';
import { FingerprintContent } from '@/components/fingerprint/FingerprintContent';
import { BiasGenomeBenchmark } from './BiasGenomeBenchmark';
import { TopCounterfactualsCard } from './TopCounterfactualsCard';

type View = 'personal' | 'team';

export function DecisionIntelligenceContent() {
  const [activeView, setActiveView] = useState<View>('personal');

  return (
    <div>
      {/* Toggle */}
      <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
        <div
          className="inline-flex items-center rounded-lg p-0.5"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <ToggleButton
            active={activeView === 'personal'}
            onClick={() => setActiveView('personal')}
            icon={<User size={13} />}
            label="My Profile"
          />
          <ToggleButton
            active={activeView === 'team'}
            onClick={() => setActiveView('team')}
            icon={<Users size={13} />}
            label="Team Patterns"
          />
        </div>
      </div>

      {/* Top counterfactuals — the board-ready digest beat. Renders null
          when the recent window has no positive scenarios, so it never
          leads with a "0" surface. */}
      <TopCounterfactualsCard />

      {/* Content */}
      {activeView === 'personal' ? <DecisionDNAPageContent /> : <FingerprintContent />}

      {/* Bias Genome Benchmark (always visible) */}
      <BiasGenomeBenchmark />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-none"
      style={{
        background: active ? 'var(--bg-secondary)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
