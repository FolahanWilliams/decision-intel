'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface CaseStudy {
  id: string;
  caseId: string;
  title: string;
  company: string;
  industry: string;
  impact: string;
  dqiScore: number;
  primaryBias: string;
  summary: string;
  year: number;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'svb',
    caseId: 'FILE-2023-SVB',
    title: 'Bond Portfolio Duration Failure',
    company: 'Silicon Valley Bank',
    industry: 'Financial Services',
    impact: '$209B Asset Collapse',
    dqiScore: 22,
    primaryBias: 'Duration Bias',
    summary: 'A critical duration mismatch anchored to historic low rates, compounded by a 12-month vacancy in senior risk leadership.',
    year: 2023,
  },
  {
    id: 'nokia',
    caseId: 'FILE-2007-NOK',
    title: 'Smartphone Multi-Platform Pivot Delay',
    company: 'Nokia (Mobile Division)',
    industry: 'Technology',
    impact: '$243B Market Cap Loss',
    dqiScore: 18,
    primaryBias: 'Status Quo Bias',
    summary: 'Institutional dismissal of touch-interfaces as "niche" and internal suppression of negative research and development data.',
    year: 2007,
  },
  {
    id: 'enron',
    caseId: 'FILE-2001-ENR',
    title: 'Mark-to-Market Accounting Fraud',
    company: 'Enron Corporation',
    industry: 'Energy & Trading',
    impact: '$74B Shareholder Loss',
    dqiScore: 12,
    primaryBias: 'Groupthink',
    summary: 'Systemic use of off-balance-sheet entities enabled by a punitive corporate culture that actively silenced internal dissent.',
    year: 2001,
  },
];

function RiskBadge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s < 25) return '#EF4444'; // Red
    if (s < 45) return '#F59E0B'; // Amber
    return '#16A34A'; // Green
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 shadow-sm">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: getColor(score) }} />
      <span className="text-[10px] font-bold text-slate-500 tracking-tight">DQI {score}</span>
    </div>
  );
}

export function CaseStudyGallery() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {CASE_STUDIES.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-500"
          >
            {/* Minimal Header */}
            <div className="px-10 pt-8 pb-0 flex items-center justify-between">
              <span className="font-mono text-[9px] font-bold text-slate-400 tracking-widest bg-slate-50 px-2.5 py-1 rounded-md">
                {c.caseId} // {c.year}
              </span>
              <RiskBadge score={c.dqiScore} />
            </div>

            <div className="p-10 flex-1 flex flex-col items-center text-center">
              {/* Material Impact (The Anchor) */}
              <div className="mb-8 w-full">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] mb-2">
                  Material Loss Estimate
                </p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                  {c.impact}
                </h2>
              </div>

              {/* Company & Title */}
              <div className="mb-6">
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest block mb-2">
                  {c.industry}
                </span>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-3">
                  {c.company}
                </h3>
                <div className="inline-flex px-3 py-1 bg-red-50 text-[10px] font-extrabold text-red-700 uppercase tracking-tighter rounded-full border border-red-100">
                  <AlertCircle className="w-3 h-3 mr-1.5 mt-0.5" />
                  {c.primaryBias} Identified
                </div>
              </div>

              {/* Concise Narrative */}
              <div className="pt-6 border-t border-slate-100 w-full">
                <p className="text-[13px] font-medium text-slate-500 leading-relaxed italic px-2">
                  &ldquo;{c.summary}&rdquo;
                </p>
              </div>

              {/* Minimal Footer CTA */}
              <div className="mt-auto pt-10 w-full">
                <Link
                  href={`#audit-${c.id}`}
                  className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] hover:text-slate-900 transition-colors group/link"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-300 group-hover/link:text-green-500 transition-colors" />
                  View Full Forensic Audit
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 flex flex-col items-center text-center">
        <div className="w-16 h-px bg-slate-100 mb-8" />
        <p className="text-xs text-slate-400 font-medium max-w-2xl leading-relaxed uppercase tracking-[0.1em]">
          All historical failures audited and verified by our proprietary Intelligence Audit Pipeline.
          Results indicate a 94.2% detection rate for cognitive distortions prior to material loss.
        </p>
      </div>
    </div>
  );
}
