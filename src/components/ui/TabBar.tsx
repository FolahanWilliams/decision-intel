'use client';

import React from 'react';

export interface Tab {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const manyTabs = tabs.length > 5;

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--spacing-xs)',
        padding: '4px',
        background: 'var(--liquid-tint, rgba(255,255,255,0.04))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--liquid-border, rgba(255,255,255,0.08))',
        borderRadius: '12px',
        flexShrink: 0,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map(tab => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            title={tab.label}
            style={{
              flex: manyTabs ? 'none' : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: manyTabs ? '10px 12px' : '10px 16px',
              fontSize: '13px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon}
            {manyTabs ? (
              <span className="hidden sm:inline">{tab.label}</span>
            ) : (
              tab.label
            )}
          </button>
        );
      })}
    </div>
  );
}
