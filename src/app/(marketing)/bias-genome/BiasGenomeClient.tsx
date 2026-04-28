'use client';

import { useMemo, useState } from 'react';
import { BiasGenomeTable } from '@/components/marketing/genome/BiasGenomeTable';
import { IndustryFilter, type IndustryOption } from '@/components/marketing/genome/IndustryFilter';
import {
  filterGenomeByIndustry,
  type BiasGenomeEntry,
  type BiasGenomeResult,
} from '@/lib/data/bias-genome-seed';
import type { Industry } from '@/lib/data/case-studies';

const INDUSTRY_LABEL: Record<string, string> = {
  financial_services: 'Financial Services',
  technology: 'Technology',
  healthcare: 'Healthcare',
  energy: 'Energy',
  automotive: 'Automotive',
  retail: 'Retail',
  aerospace: 'Aerospace',
  government: 'Government',
  entertainment: 'Entertainment',
  media: 'Media',
  real_estate: 'Real Estate',
  telecommunications: 'Telecommunications',
  manufacturing: 'Manufacturing',
};

interface Props {
  genome: BiasGenomeResult;
}

export function BiasGenomeClient({ genome }: Props) {
  const [industry, setIndustry] = useState<string>('all');

  const options = useMemo<IndustryOption[]>(() => {
    const counts = new Map<string, number>();
    for (const ind of genome.meta.industriesCovered) counts.set(ind, 0);
    // Simple: derive from entries with topIndustry, but we need case counts;
    // use industriesCovered from meta plus the original length via the "all" row.
    return [
      { key: 'all', label: 'All industries', count: genome.meta.totalCases },
      ...genome.meta.industriesCovered.map(ind => ({
        key: ind,
        label: INDUSTRY_LABEL[ind] ?? ind,
        count: genome.entries.filter(e => e.topIndustry === ind).length,
      })),
    ];
  }, [genome]);

  const { entries, scopeLabel } = useMemo<{
    entries: BiasGenomeEntry[];
    scopeLabel: string;
  }>(() => {
    if (industry === 'all') {
      return {
        entries: genome.entries,
        scopeLabel: `Scored across all ${genome.meta.totalCases} seed cases. n = sample size; ⚠ marks biases with n<3 (directional only).`,
      };
    }
    const filtered = filterGenomeByIndustry(industry as Industry);
    return {
      entries: filtered,
      scopeLabel: `Filtered to ${INDUSTRY_LABEL[industry] ?? industry}. Sample sizes are small; use as a directional signal.`,
    };
  }, [industry, genome]);

  const maxLift = useMemo(
    () => entries.reduce((m, e) => Math.max(m, e.failureLift ?? 0), 0),
    [entries]
  );

  return (
    <>
      <IndustryFilter options={options} value={industry} onChange={setIndustry} />
      <BiasGenomeTable entries={entries} maxLift={maxLift} scopeLabel={scopeLabel} />
    </>
  );
}
