import { describe, it, expect } from 'vitest';
import { treeRenderSignature } from './RealityTree';
import { CHECKINS_TO_BLOOM } from './content';

/**
 * The founder invariant (2026-06-14): the tree must visibly change and grow on
 * EVERY single check-in — every morning AND every night — across the whole
 * 66-day protocol. The graduality is the point. These tests lock it against the
 * pure growth schedule (treeRenderSignature), so a future edit that quietly
 * makes some taps render identically (the old Math.round leaf-count bug) fails
 * loudly here.
 */
describe('66-Day Protocol tree — grows on every check-in', () => {
  it('every consecutive check-in (0 → bloom) produces a visibly different tree', () => {
    for (let c = 0; c < CHECKINS_TO_BLOOM; c++) {
      const a = treeRenderSignature(c);
      const b = treeRenderSignature(c + 1);
      // The perceptible signal: the phase, or the count of discrete growth
      // elements (a new leaf / blossom appears). Not the sub-pixel size drift.
      const aKey = `${a.phase}:${a.growthCount}`;
      const bKey = `${b.phase}:${b.growthCount}`;
      expect(aKey, `check-in ${c} → ${c + 1} must change the tree`).not.toBe(bKey);
    }
  });

  it('adds exactly one growth element per check-in through the canopy', () => {
    // From the second canopy tap to full bloom, the discrete element count rises
    // by exactly one each check-in — one new leaf, then inner cluster, then blossom.
    for (let c = 10; c <= CHECKINS_TO_BLOOM; c++) {
      const sig = treeRenderSignature(c);
      expect(sig.phase).toBe('canopy');
      expect(sig.growthCount).toBe(sig.outer + sig.inner + sig.blossom);
      expect(treeRenderSignature(c).growthCount - treeRenderSignature(c - 1).growthCount).toBe(1);
    }
  });

  it('the sprout gains a leaf AND grows taller on every one of its check-ins', () => {
    for (let c = 1; c <= 8; c++) {
      const prev = treeRenderSignature(c - 1);
      const sig = treeRenderSignature(c);
      expect(sig.phase).toBe('sprout');
      expect(sig.sproutLeaves).toBe(c);
      expect(sig.sproutHeight).toBeGreaterThan(prev.sproutHeight);
    }
  });

  it('the three element bands tile the canopy exactly (no gaps, no overlap-loss)', () => {
    // Every canopy check-in lands in exactly one growing band so the count is
    // always c - 8 (one element per tap since the first canopy tap).
    for (let c = 9; c <= CHECKINS_TO_BLOOM; c++) {
      expect(treeRenderSignature(c).growthCount).toBe(c - 8);
    }
  });

  it('reaches full bloom exactly at the last check-in', () => {
    const bloom = treeRenderSignature(CHECKINS_TO_BLOOM);
    const justBefore = treeRenderSignature(CHECKINS_TO_BLOOM - 1);
    expect(bloom.blossom).toBeGreaterThan(justBefore.blossom);
    expect(bloom.growthCount).toBeGreaterThan(justBefore.growthCount);
  });

  it('past bloom it stays bloomed — an extra/slip check-in never shrinks it', () => {
    const atBloom = treeRenderSignature(CHECKINS_TO_BLOOM);
    const beyond = treeRenderSignature(CHECKINS_TO_BLOOM + 9);
    expect(beyond.growthCount).toBe(atBloom.growthCount); // capped, never reduced
    expect(beyond.blossom).toBe(atBloom.blossom);
  });

  it('never renders negative or NaN counts for odd inputs', () => {
    for (const c of [-5, -1, 0.4, 7.6, NaN]) {
      const sig = treeRenderSignature(c);
      expect(Number.isFinite(sig.growthCount)).toBe(true);
      expect(sig.growthCount).toBeGreaterThanOrEqual(0);
    }
  });
});
