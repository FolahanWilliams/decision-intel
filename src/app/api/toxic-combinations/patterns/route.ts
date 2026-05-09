/**
 * Toxic Combinations · Named Patterns API
 *
 * GET /api/toxic-combinations/patterns
 *
 * Returns the canonical NAMED_PATTERNS catalogue — the 13 named toxic
 * combinations (10 cross-domain + 3 M&A-specific) with their bias pairs,
 * context requirements, and procurement-grade descriptions. Public/auth-
 * gated read; no per-org filtering — the catalogue itself is shared
 * across orgs (per-org incidence lives in the existing
 * /api/toxic-combinations endpoint that returns ToxicCombination rows).
 *
 * Consumers: BiasDetailModal participates-in chips, InsightsPageContent
 * trending viz, /api/simulate-ceo M&A pattern context, future analytics
 * dashboards. Single source of truth per CLAUDE.md "M&A Workflow Native"
 * cascade discipline.
 *
 * Locked 2026-05-09 evening — cascade-depth audit ship #3.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { NAMED_PATTERNS } from '@/lib/learning/toxic-combinations';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ToxicCombinationsPatternsAPI');

// M&A-specific patterns are tagged so the InsightsPageContent trending
// viz + the simulate-ceo context can filter to M&A-only signals when
// the audited document type is an M&A artefact (ic_memo / cim / qofe /
// synergy_model / integration_plan). The tag is derived from the
// canonical CLAUDE.md M&A pattern list — keep in sync when a new
// M&A pattern lands.
const MNA_PATTERN_LABELS = new Set([
  'The Synergy Mirage',
  'The Conglomerate Fallacy',
  "The Winner's Curse",
  // 'The Sunk Ship' + 'The Yes Committee' carry M&A-enhanced framing
  // but were locked as cross-domain patterns first; surface them as
  // cross-domain so the M&A-only filter doesn't hide them.
]);

export async function GET(req: NextRequest) {
  try {
    // Auth-gated. Patterns are not org-specific but we still require an
    // authenticated session — the catalogue is product IP, not a public
    // marketing surface.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');

    let patterns = NAMED_PATTERNS;
    if (filter === 'mna') {
      patterns = NAMED_PATTERNS.filter(p => MNA_PATTERN_LABELS.has(p.label));
    } else if (filter === 'cross_domain') {
      patterns = NAMED_PATTERNS.filter(p => !MNA_PATTERN_LABELS.has(p.label));
    }

    return NextResponse.json(
      {
        patterns: patterns.map(p => ({
          label: p.label,
          description: p.description,
          biasTypes: p.biasTypes,
          contextRequired: p.contextRequired,
          baseScore: p.baseScore,
          isMna: MNA_PATTERN_LABELS.has(p.label),
        })),
        total: patterns.length,
      },
      {
        headers: {
          // The catalogue is module-static; safe to cache for an hour
          // per session. Bumps when NAMED_PATTERNS changes require a
          // deploy, which invalidates the cache.
          'Cache-Control': 'private, max-age=3600',
        },
      }
    );
  } catch (error) {
    log.error('Patterns catalogue fetch failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
