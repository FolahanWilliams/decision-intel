/**
 * DQI weight-override resolver regression suite.
 *
 * weight-overrides.ts resolves which DQI weight vector an audit is
 * scored against (the Dietvorst 2016 user-adjustable-weights fix). The
 * org > user > canonical precedence + schema-drift tolerance is exactly
 * the silently-breaking branching CLAUDE.md warns about. Until now it
 * had zero tests despite being on every audit-rendering path.
 *
 * Locks: precedence (org beats user beats canonical), orgIdHint
 * short-circuit, schema-drift fall-through (never throws), override
 * metadata passthrough.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: { findFirst: vi.fn() },
    dqiWeightOverride: { findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { prisma } from '@/lib/prisma';
import { resolveActiveWeightsForUser } from './weight-overrides';
import { WEIGHTS_CANONICAL } from '@/lib/scoring/dqi';

const findTeam = prisma.teamMember.findFirst as unknown as ReturnType<typeof vi.fn>;
const findOverride = prisma.dqiWeightOverride.findUnique as unknown as ReturnType<typeof vi.fn>;

function overrideRow(scope: 'user' | 'org', id: string) {
  return {
    id,
    scope,
    weights: { ...WEIGHTS_CANONICAL, biasLoad: 0.5 },
    weightsHash: `hash-${id}`,
    methodologyVersion: '2.3.0',
    setAt: new Date('2026-05-10T00:00:00Z'),
  };
}

beforeEach(() => {
  findTeam.mockReset();
  findOverride.mockReset();
});

describe('resolveActiveWeightsForUser — canonical fallback', () => {
  it('returns canonical weights when no override exists', async () => {
    findTeam.mockResolvedValue(null);
    findOverride.mockResolvedValue(null);
    const r = await resolveActiveWeightsForUser('u1');
    expect(r.source).toBe('canonical');
    expect(r.override).toBeNull();
    expect(r.effective).toEqual(WEIGHTS_CANONICAL);
    // Returns a copy, not the canonical reference.
    expect(r.effective).not.toBe(WEIGHTS_CANONICAL);
  });
});

describe('resolveActiveWeightsForUser — precedence', () => {
  it('org override beats user override', async () => {
    findOverride.mockImplementation(({ where }: { where: { orgId?: string; userId?: string } }) =>
      where.orgId ? overrideRow('org', 'org-ovr') : overrideRow('user', 'user-ovr')
    );
    const r = await resolveActiveWeightsForUser('u1', 'org-1');
    expect(r.source).toBe('org');
    expect(r.override?.id).toBe('org-ovr');
    expect(r.override?.weightsHash).toBe('hash-org-ovr');
  });

  it('falls to the user override when no org override exists', async () => {
    findOverride.mockImplementation(({ where }: { where: { orgId?: string; userId?: string } }) =>
      where.orgId ? null : overrideRow('user', 'user-ovr')
    );
    const r = await resolveActiveWeightsForUser('u1', 'org-1');
    expect(r.source).toBe('user');
    expect(r.override?.id).toBe('user-ovr');
  });
});

describe('resolveActiveWeightsForUser — orgIdHint short-circuit', () => {
  it('skips the TeamMember lookup when an orgIdHint is supplied', async () => {
    findOverride.mockResolvedValue(null);
    await resolveActiveWeightsForUser('u1', 'org-1');
    expect(findTeam).not.toHaveBeenCalled();
  });

  it('queries TeamMember only when orgIdHint is omitted (undefined)', async () => {
    findTeam.mockResolvedValue({ orgId: 'org-9' });
    findOverride.mockResolvedValue(null);
    await resolveActiveWeightsForUser('u1');
    expect(findTeam).toHaveBeenCalledTimes(1);
  });
});

describe('resolveActiveWeightsForUser — schema-drift tolerance', () => {
  it('never throws when the override table is missing — falls through to canonical', async () => {
    findOverride.mockRejectedValue(new Error('relation "DqiWeightOverride" does not exist'));
    const r = await resolveActiveWeightsForUser('u1', 'org-1');
    expect(r.source).toBe('canonical');
    expect(r.effective).toEqual(WEIGHTS_CANONICAL);
  });

  it('tolerates a TeamMember lookup failure and still resolves', async () => {
    findTeam.mockRejectedValue(new Error('db blip'));
    findOverride.mockResolvedValue(null);
    const r = await resolveActiveWeightsForUser('u1');
    expect(r.source).toBe('canonical');
  });
});
