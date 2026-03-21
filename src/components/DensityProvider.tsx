'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DensityContextType {
  isDense: boolean;
  toggleDensity: () => void;
  density: 'comfortable' | 'compact' | 'dense';
  setDensity: (density: 'comfortable' | 'compact' | 'dense') => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export function useDensity() {
  const context = useContext(DensityContext);
  if (!context) {
    throw new Error('useDensity must be used within a DensityProvider');
  }
  return context;
}

interface DensityProviderProps {
  children: React.ReactNode;
}

export function DensityProvider({ children }: DensityProviderProps) {
  const [density, setDensityState] = useState<'comfortable' | 'compact' | 'dense'>('comfortable');

  // Load saved preference
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const saved = localStorage.getItem('ui-density');
      if (saved === 'compact' || saved === 'dense' || saved === 'comfortable') {
        setDensityState(saved);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const setDensity = (newDensity: 'comfortable' | 'compact' | 'dense') => {
    setDensityState(newDensity);
    localStorage.setItem('ui-density', newDensity);

    // Apply density class to root element
    document.documentElement.classList.remove(
      'density-comfortable',
      'density-compact',
      'density-dense'
    );
    document.documentElement.classList.add(`density-${newDensity}`);
  };

  const toggleDensity = () => {
    const next = {
      comfortable: 'compact',
      compact: 'dense',
      dense: 'comfortable',
    } as const;
    setDensity(next[density]);
  };

  // Apply density class on mount and changes
  useEffect(() => {
    document.documentElement.classList.remove(
      'density-comfortable',
      'density-compact',
      'density-dense'
    );
    document.documentElement.classList.add(`density-${density}`);
  }, [density]);

  return (
    <DensityContext.Provider
      value={{ isDense: density !== 'comfortable', toggleDensity, density, setDensity }}
    >
      {children}
    </DensityContext.Provider>
  );
}

// Density toggle button component
export function DensityToggle({ className }: { className?: string }) {
  const { density, toggleDensity } = useDensity();

  const icons = {
    comfortable: <Maximize2 className="h-4 w-4" />,
    compact: <Minimize2 className="h-3.5 w-3.5" />,
    dense: <Minimize2 className="h-3 w-3" />,
  };

  const labels = {
    comfortable: 'Comfortable View',
    compact: 'Compact View',
    dense: 'Dense View',
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDensity}
      className={cn('w-9 h-9', className)}
      title={`Switch to ${labels[density]}`}
      aria-label={`Current: ${labels[density]}. Click to toggle density.`}
    >
      {icons[density]}
    </Button>
  );
}

// Helper hook for responsive density-aware sizing
export function useDensityClasses(base: string, compact?: string, dense?: string) {
  const { density } = useDensity();

  if (density === 'dense' && dense) return dense;
  if (density === 'compact' && compact) return compact;
  return base;
}
