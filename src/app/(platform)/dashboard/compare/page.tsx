'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ComparePage() {
  const [selectedAnalyses] = useState<string[]>([]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Compare Analyses</h1>
        <p className="text-gray-400">
          Compare multiple cognitive audits side by side to identify patterns and trends.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Selection Area */}
        <div className={cn(
          'p-6 rounded-xl',
          'liquid-glass-premium',
          'border border-white/10'
        )}>
          <h2 className="text-xl font-semibold text-white mb-4">Select Analyses to Compare</h2>
          <p className="text-gray-400">
            Choose up to 3 analyses to compare their results side by side.
          </p>

          {selectedAnalyses.length === 0 && (
            <div className="mt-6 p-12 text-center border-2 border-dashed border-white/20 rounded-lg">
              <p className="text-gray-500">No analyses selected for comparison</p>
            </div>
          )}
        </div>

        {/* Comparison Results */}
        {selectedAnalyses.length > 0 && (
          <div className={cn(
            'p-6 rounded-xl',
            'liquid-glass',
            'border border-white/10'
          )}>
            <h2 className="text-xl font-semibold text-white mb-4">Comparison Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Comparison cards would go here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}