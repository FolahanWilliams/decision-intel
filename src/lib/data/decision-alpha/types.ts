/**
 * Decision Alpha Type System
 *
 * Extends the CaseStudy type with public-company-specific fields
 * for CEO communication analysis and stock performance correlation.
 */

import type { CaseStudy } from '../case-studies/types';

export type FilingType =
  | 'annual_letter'
  | 'earnings_call'
  | '10k_filing'
  | '10q_filing'
  | 'proxy_statement';

export type DqiGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface DqiComponents {
  biasLoad: number;
  noiseLevel: number;
  evidenceQuality: number;
  processMaturity: number;
  complianceRisk: number;
  historicalAlignment: number;
}

export interface BiasExcerpt {
  biasType: string;
  excerpt: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface StockPerformance {
  priceAtFiling: number;
  price6mo?: number;
  price12mo?: number;
  price24mo?: number;
  return6mo?: number;
  return12mo?: number;
  return24mo?: number;
  sp500Return6mo?: number;
  sp500Return12mo?: number;
  sp500Return24mo?: number;
}

export interface PublicCompanyAnalysis extends CaseStudy {
  // CEO identity
  ceoName: string;
  ceoTenureStart: number;

  // Filing metadata
  filingType: FilingType;
  filingDate: string; // ISO date
  filingYear: number;
  ticker: string;

  // DQI score (pre-computed)
  dqiScore: number;
  dqiGrade: DqiGrade;
  dqiComponents: DqiComponents;

  // Bias analysis with specific excerpts
  biasExcerpts: BiasExcerpt[];

  // Stock performance correlation (populated in Phase 3)
  stockPerformance?: StockPerformance;

  // Content generation metadata
  contentAngles: string[];
  headlineHook: string;
}
