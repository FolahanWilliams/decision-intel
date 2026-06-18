import { describe, it, expect } from 'vitest';
import { ROLE_ROUTES } from './RoleRouter';
import { getUseCaseBySlug } from '@/lib/data/use-cases';

describe('RoleRouter — homepage wedge mapping', () => {
  it('routes exactly the four Phase-1 wedge personas (cold-context narrowing)', () => {
    expect(ROLE_ROUTES).toHaveLength(4);
    const personas = new Set(ROLE_ROUTES.map(r => r.persona));
    expect(personas.size).toBe(4);
  });

  it('every slug resolves to a real /use workflow (no slug drift)', () => {
    for (const r of ROLE_ROUTES) {
      const u = getUseCaseBySlug(r.slug);
      expect(u, `slug "${r.slug}" must exist in USE_CASES`).toBeTruthy();
      expect(u!.ctaLabel.trim().length).toBeGreaterThan(0);
    }
  });

  it('gives each persona its own distinct workflow', () => {
    const slugs = ROLE_ROUTES.map(r => r.slug);
    expect(new Set(slugs).size).toBe(4);
  });
});
