/**
 * Role-aware empty-state copy (4.2 deep).
 *
 * Centralised per-role copy for the empty states on /dashboard,
 * /dashboard/deals, /dashboard/decisions?view=log (Phase G fold 2026-05-10
 * — surface ID 'decision-log' is the stable SSOT key; the URL moved when
 * the standalone /dashboard/decision-log page folded into the parent),
 * and /dashboard/analytics so each surface lands with vocabulary the
 * buyer recognizes.
 *
 * Server-side helper for RSC usage; the client equivalent reads the
 * onboarding role via /api/onboarding and indexes into the same map.
 */

import { BIAS_EDUCATION } from '@/lib/constants/bias-education';

const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

export type EmptyStateRole = 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other';
export type EmptyStateSurface = 'dashboard' | 'deals' | 'decision-log' | 'analytics';

interface SurfaceCopy {
  title: string;
  description: string;
}

const COPY: Record<EmptyStateSurface, Record<EmptyStateRole, SurfaceCopy>> = {
  dashboard: {
    cso: {
      title: 'Audit your first strategic memo',
      description: `Upload a board recommendation, market-entry memo, or quarterly review. The 60-second audit surfaces the ${BIAS_COUNT}-bias R²F taxonomy with traceable excerpts plus the questions a CEO or audit committee will surface — and produces a hashed, tamper-evident Decision Provenance Record on the way out.`,
    },
    ma: {
      title: 'Audit your first IC memo or CIM',
      description:
        'Drop an IC memo, CIM, QofE, synergy model, integration plan, term sheet, or counsel review. The audit recognises nine M&A document types and fires the named patterns that sink committee votes — Synergy Mirage (synergies without mechanism, owner, or 90-day milestone), Conglomerate Fallacy (far-adjacency with no parenting thesis), Winner&rsquo;s Curse (auction-dynamic anchoring), Sunk Ship (deal-fever escalation), Yes Committee (rubber-stamp justification of a sponsor&rsquo;s pet acquisition).',
    },
    bizops: {
      title: 'Audit your first forecast or planning memo',
      description:
        'Upload a quarterly forecast, planning memo, or buy-vs-build recommendation. The audit flags the anchoring + overconfidence patterns that ship miss-the-quarter forecasts before they reach the steering committee.',
    },
    pe_vc: {
      title: 'Audit your first IC memo',
      description:
        'Upload a pre-IC memo, source memo, growth-round CIM, or pre-commitment review. The audit catches the patterns that kill fund returns — anchoring on a single comparable transaction, overconfidence on growth-curve extrapolation, narrative-fallacy on regulatory tailwinds — and produces a hashed, tamper-evident Decision Provenance Record your LPs (including NDPR / WAEMU / CMA Kenya-regulated LPs) can read.',
    },
    other: {
      title: 'Audit something you actually wrote',
      description: `Paste or upload anything strategic you have in front of you — a fundraise deck, a board update, a strategy memo, a market-entry recommendation, an investor email. Sixty seconds later you'll see the ${BIAS_COUNT}-bias R²F audit on YOUR text, the questions a committee would ask, and a hashed, tamper-evident Decision Provenance Record. The wow lands harder on your own content than on a canned sample.`,
    },
  },
  deals: {
    cso: {
      title: 'No deals yet',
      description:
        'Deals bundle strategic-acquisition or market-entry memos under one umbrella. Composite DQI + cross-document conflict detection runs across the bundle. For non-deal decisions, see Decision Packages under Reflect.',
    },
    ma: {
      title: 'No deals yet',
      description:
        'Each deal is the atomic decision unit — CIM + QofE + synergy model + integration plan + counsel review + IC deck. Cross-doc cross-reference auto-fires when ≥2 docs are analyzed (CIM says 40% growth, model assumes 15%). Composite Deal DQI + the IC Readiness Gate (required docs, all analyzed, DQI ≥ 55, cross-ref clean, IC date set) live on the deal page so you walk into committee knowing what&rsquo;s shaky.',
    },
    bizops: {
      title: 'No deals yet',
      description:
        'Deals are the M&A-shape decision unit. For BizOps decisions (forecasts, buy-vs-build, regional rationalisation), use Decision Packages instead — same composite DQI + cross-doc audit, scoped to non-deal decisions.',
    },
    pe_vc: {
      title: 'No deals yet',
      description:
        'Each deal is the IC-shape decision unit — source memo + financial model + management presentation + counsel review. Cross-doc cross-reference flags inconsistencies (CIM says 40% growth, model assumes 15%) and a composite Deal DQI lives on the deal page. Pre-IC blind-prior voting in Decision Rooms surfaces disagreement before the meeting.',
    },
    other: {
      title: 'No deals yet',
      description:
        'Bundle the documents that compose a single deal — CIM, model, IC memo, counsel review. Composite DQI + cross-document conflict detection runs across the bundle.',
    },
  },
  'decision-log': {
    cso: {
      title: 'Your decision log is empty',
      description:
        'Capture the strategic decisions you commit to — board recommendations, market-entry calls, executive reviews. Each entry feeds the audit pipeline so the calibration loop closes when you log the outcome.',
    },
    ma: {
      title: 'Your decision log is empty',
      description:
        'Track every IC vote, deal pass, and pre-commitment review here. The log surfaces M&A failure patterns across deals — which named combinations recur at IC (Synergy Mirage on cross-sell theses, Winner&rsquo;s Curse on competitive processes, Conglomerate Fallacy on platform plays) — and feeds the calibration loop when you log realised IRR / MOIC outcomes 12-24 months after close.',
    },
    bizops: {
      title: 'Your decision log is empty',
      description:
        'Capture the forecasts, planning calls, and operational decisions you commit to. The log + outcome flywheel turns anecdotes into patterns — the same memo + outcome pair, repeated quarterly, becomes calibration.',
    },
    pe_vc: {
      title: 'Your decision log is empty',
      description:
        'Capture every IC vote, pass decision, follow-on call, and pre-commit review. The log surfaces fund-level patterns — which biases recur at IC, which calls were over-confident, which structural assumptions held — and feeds your Brier calibration quarter over quarter.',
    },
    other: {
      title: 'Your decision log is empty',
      description:
        'Capture committed decisions — manual entries, meeting transcripts, Slack threads. Each one feeds the audit pipeline; the calibration loop closes when you log the outcome.',
    },
  },
  analytics: {
    cso: {
      title: 'No analytics yet',
      description:
        'Analytics surface DQI quarter over quarter, recurring biases by theme, and the Decision Knowledge Graph. The Outcome Flywheel + per-org Brier calibration become visible once you log realised outcomes on three or more decisions.',
    },
    ma: {
      title: 'No analytics yet',
      description:
        'Analytics aggregate DQI across deals, the named M&A toxic combinations recurring at IC (Synergy Mirage / Winner&rsquo;s Curse / Conglomerate Fallacy / Sunk Ship / Yes Committee), and counterfactual ROI scenarios per deal. The Outcome Flywheel surfaces calibration once realised IRR / MOIC outcomes accumulate — were the high-confidence committee votes actually the better deals?',
    },
    bizops: {
      title: 'No analytics yet',
      description:
        'Analytics surface DQI trends across forecasts, recurring biases by theme, and the Outcome Flywheel where realised outcomes recalibrate prior DQIs. Patterns become visible once you have 3+ outcomes logged.',
    },
    pe_vc: {
      title: 'No analytics yet',
      description:
        'Analytics aggregate DQI across deals, recurring biases at IC, counterfactual ROI scenarios, and the Outcome Flywheel where realised exits recalibrate prior IC convictions. Brier-calibrated DQI compounds quarter over quarter — the calibration data your LPs increasingly want to see in the annual report.',
    },
    other: {
      title: 'No analytics yet',
      description:
        'Analytics surface DQI trends, recurring biases by theme, the Decision Knowledge Graph, and the Outcome Flywheel. They populate as you audit decisions and log outcomes.',
    },
  },
};

export function emptyStateCopy(
  surface: EmptyStateSurface,
  role: EmptyStateRole | null | undefined
): SurfaceCopy {
  if (!role || !(role in COPY[surface])) {
    return COPY[surface].other;
  }
  return COPY[surface][role];
}
