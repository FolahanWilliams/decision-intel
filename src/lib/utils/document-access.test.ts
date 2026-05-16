/**
 * Document-access resolver regression suite.
 *
 * document-access.ts is the access-control filter for every Document /
 * Analysis read. CLAUDE.md records a prior CRITICAL auth bypass from a
 * buggy access duplicate; this is exactly the class of code that must be
 * locked. The 2026-05-01 visibility:null incident also lived here.
 *
 * Locks: owner-always OR clauses (private/team/specific) + deletedAt
 * filter, org-team clause only with membership, specific clause only
 * with grants, schema-drift tolerance (no throw → degrades to owner-only),
 * single-doc/analysis gating, and the filterDocumentIdsByAccess
 * order-preserving subset + fail-soft fallback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: { findFirst: vi.fn() },
    documentAccess: { findMany: vi.fn() },
    analysis: { findFirst: vi.fn() },
    document: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  buildDocumentAccessFilter,
  buildDocumentAccessWhere,
  resolveAnalysisAccess,
  filterDocumentIdsByAccess,
} from './document-access';

const teamFind = prisma.teamMember.findFirst as unknown as ReturnType<typeof vi.fn>;
const grantsFind = prisma.documentAccess.findMany as unknown as ReturnType<typeof vi.fn>;
const analysisFind = prisma.analysis.findFirst as unknown as ReturnType<typeof vi.fn>;
const docFind = prisma.document.findMany as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  teamFind.mockReset();
  grantsFind.mockReset();
  analysisFind.mockReset();
  docFind.mockReset();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orClauses(where: any) {
  return where.OR as Array<Record<string, unknown>>;
}

describe('buildDocumentAccessFilter — owner clauses', () => {
  it('always grants the owner all three visibility modes and excludes soft-deleted rows', async () => {
    teamFind.mockResolvedValue(null);
    grantsFind.mockResolvedValue([]);
    const f = await buildDocumentAccessFilter('u1');
    expect(f.where.deletedAt).toBeNull();
    const or = orClauses(f.where);
    expect(or).toEqual(
      expect.arrayContaining([
        { userId: 'u1', visibility: 'private' },
        { userId: 'u1', visibility: 'team' },
        { userId: 'u1', visibility: 'specific' },
      ])
    );
    expect(f.membershipOrgId).toBeNull();
    expect(f.grantedDocumentIds).toEqual([]);
  });
});

describe('buildDocumentAccessFilter — team + specific extension', () => {
  it('adds an org-team clause only when the user belongs to an org', async () => {
    teamFind.mockResolvedValue({ orgId: 'org-7' });
    grantsFind.mockResolvedValue([]);
    const f = await buildDocumentAccessFilter('u1');
    expect(f.membershipOrgId).toBe('org-7');
    expect(orClauses(f.where)).toEqual(
      expect.arrayContaining([{ orgId: 'org-7', visibility: 'team' }])
    );
  });

  it('adds a specific-grant clause only when the user has grants', async () => {
    teamFind.mockResolvedValue(null);
    grantsFind.mockResolvedValue([{ documentId: 'd1' }, { documentId: 'd2' }]);
    const f = await buildDocumentAccessFilter('u1');
    expect(f.grantedDocumentIds).toEqual(['d1', 'd2']);
    expect(orClauses(f.where)).toEqual(
      expect.arrayContaining([{ id: { in: ['d1', 'd2'] }, visibility: 'specific' }])
    );
  });
});

describe('buildDocumentAccessFilter — schema-drift tolerance', () => {
  it('degrades to owner-only access without throwing when lookups fail', async () => {
    teamFind.mockRejectedValue(new Error('TeamMember missing'));
    grantsFind.mockRejectedValue(new Error('DocumentAccess missing'));
    const f = await buildDocumentAccessFilter('u1');
    expect(f.membershipOrgId).toBeNull();
    expect(f.grantedDocumentIds).toEqual([]);
    // Owner clauses must still be present — the user never loses access
    // to their own documents on a transient migration mismatch.
    expect(orClauses(f.where).length).toBe(3);
  });
});

describe('buildDocumentAccessWhere', () => {
  it('pins the document id alongside the access filter', async () => {
    teamFind.mockResolvedValue(null);
    grantsFind.mockResolvedValue([]);
    const r = await buildDocumentAccessWhere('doc-42', 'u1');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((r.where as any).id).toBe('doc-42');
    expect(r.where.deletedAt).toBeNull();
    expect(orClauses(r.where).length).toBe(3);
  });
});

describe('resolveAnalysisAccess', () => {
  it('returns the analysis/document pair when the user can see the parent doc', async () => {
    teamFind.mockResolvedValue(null);
    grantsFind.mockResolvedValue([]);
    analysisFind.mockResolvedValue({ id: 'an-1', documentId: 'doc-1' });
    const r = await resolveAnalysisAccess('an-1', 'u1');
    expect(r).toEqual({ analysisId: 'an-1', documentId: 'doc-1' });
  });

  it('returns null when the analysis is not visible to the user', async () => {
    teamFind.mockResolvedValue(null);
    grantsFind.mockResolvedValue([]);
    analysisFind.mockResolvedValue(null);
    expect(await resolveAnalysisAccess('an-x', 'u1')).toBeNull();
  });

  it('returns null (not throw) on a query error', async () => {
    teamFind.mockResolvedValue(null);
    grantsFind.mockResolvedValue([]);
    analysisFind.mockRejectedValue(new Error('db blip'));
    expect(await resolveAnalysisAccess('an-1', 'u1')).toBeNull();
  });
});

describe('filterDocumentIdsByAccess', () => {
  it('short-circuits to [] for an empty id list', async () => {
    expect(await filterDocumentIdsByAccess([], 'u1')).toEqual([]);
    expect(docFind).not.toHaveBeenCalled();
  });

  it('returns only the allowed subset, preserving input order', async () => {
    teamFind.mockResolvedValue(null);
    grantsFind.mockResolvedValue([]);
    docFind.mockResolvedValue([{ id: 'b' }, { id: 'd' }]);
    const r = await filterDocumentIdsByAccess(['a', 'b', 'c', 'd'], 'u1');
    expect(r).toEqual(['b', 'd']);
  });

  it('fails soft — returns the full input list on a schema-drift error rather than dropping everything', async () => {
    teamFind.mockResolvedValue(null);
    grantsFind.mockResolvedValue([]);
    docFind.mockRejectedValue(new Error('drift'));
    const ids = ['a', 'b'];
    expect(await filterDocumentIdsByAccess(ids, 'u1')).toEqual(ids);
  });
});
