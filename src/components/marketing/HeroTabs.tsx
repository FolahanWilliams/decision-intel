'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LossAversionChart } from './LossAversionChart';
import { HeroDecisionGraph } from './HeroDecisionGraph';

/**
 * HeroTabs — Two-tab switcher for the hero right panel.
 *
 * Tab 1: "Hidden Costs" — Loss aversion chart (what you're losing)
 * Tab 2: "Decision Graph" — Interactive bias network (what we detect)
 *
 * This gives enterprise buyers both the emotional hook (loss framing)
 * and the product credibility (real output preview).
 */

const TABS = [
  { id: 'costs', label: 'Hidden Costs' },
  { id: 'graph', label: 'Decision Graph' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const C = {
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate900: '#0F172A',
  green: '#16A34A',
  active: '#0F172A',
  activeBg: '#F1F5F9',
} as const;

export function HeroTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('costs');
  // Graph is expensive (WebGL). Keep it unmounted until the user shows intent
  // (hover/focus on the Graph tab, or a click). Once mounted, it stays mounted
  // so subsequent tab switches are instant and WebGL context isn't re-created.
  const [graphPrimed, setGraphPrimed] = useState(false);
  const primeGraph = () => setGraphPrimed(true);

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 12,
          background: C.white,
          border: `1px solid ${C.slate200}`,
          borderRadius: 10,
          padding: 3,
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'graph') primeGraph();
                setActiveTab(tab.id);
              }}
              onMouseEnter={tab.id === 'graph' ? primeGraph : undefined}
              onFocus={tab.id === 'graph' ? primeGraph : undefined}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? C.active : C.slate400,
                background: isActive ? C.activeBg : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
                letterSpacing: '0.01em',
              }}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="heroTabIndicator"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '25%',
                    right: '25%',
                    height: 2,
                    borderRadius: 1,
                    background: C.green,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content — both stay mounted once primed so switching is instant */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: activeTab === 'costs' ? 'block' : 'none',
          }}
        >
          <LossAversionChart />
        </div>
        {graphPrimed && (
          <div
            style={{
              display: activeTab === 'graph' ? 'block' : 'none',
            }}
          >
            <HeroDecisionGraph />
          </div>
        )}
      </div>
    </div>
  );
}
