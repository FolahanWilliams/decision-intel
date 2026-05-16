/**
 * SSOT lock for DecisionContainer modes. Mirrors the discipline of
 * NAMED_PATTERNS + INVESTMENT_DOCUMENT_TYPES + scoring/dqi.test.ts —
 * locks the 3-mode contract so adding a 4th mode (or breaking an
 * existing one) is a deliberate, type-system-loud change.
 *
 * The 3 modes (investment / acquisition / strategic) are the unified
 * replacement for the prior Deal + DecisionPackage split. See
 * decision-container-modes.ts header for the architecture lock.
 */

import { describe, it, expect } from 'vitest';
import {
  CONTAINER_KINDS,
  CONTAINER_MODES,
  getContainerMode,
  getContainerStage,
  isRequiredCommitteeDoc,
  isKnownContainerDocType,
  validateStageTransition,
  getNextContainerStage,
  type DecisionContainerKind,
  type ContainerLifecyclePhase,
} from './decision-container-modes';

describe('CONTAINER_KINDS', () => {
  it('has exactly 3 modes — investment / acquisition / strategic', () => {
    expect(CONTAINER_KINDS).toEqual(['investment', 'acquisition', 'strategic']);
  });

  it('every kind has a mode definition in CONTAINER_MODES', () => {
    for (const kind of CONTAINER_KINDS) {
      expect(CONTAINER_MODES[kind]).toBeDefined();
      expect(CONTAINER_MODES[kind].kind).toBe(kind);
    }
  });
});

describe('CONTAINER_MODES — structural invariants', () => {
  it('every mode has at least one stage', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      expect(mode.stages.length).toBeGreaterThan(0);
    }
  });

  it('every mode has exactly one committee_gate stage', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const gateStages = mode.stages.filter(s => s.phase === 'committee_gate');
      expect(gateStages.length).toBe(1);
    }
  });

  it('committeeStageId points at the committee_gate stage', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const gate = mode.stages.find(s => s.id === mode.committeeStageId);
      expect(gate).toBeDefined();
      expect(gate!.phase).toBe('committee_gate');
    }
  });

  it('defaultStageId points at a real stage in the same mode', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const stage = mode.stages.find(s => s.id === mode.defaultStageId);
      expect(stage).toBeDefined();
    }
  });

  it('default stage is always pre_committee phase', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const stage = mode.stages.find(s => s.id === mode.defaultStageId);
      expect(stage!.phase).toBe('pre_committee');
    }
  });

  it('stage IDs are unique within each mode', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const ids = mode.stages.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('stage eyebrows are unique within each mode + zero-padded sequential', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const eyebrows = mode.stages.map(s => s.eyebrow);
      expect(new Set(eyebrows).size).toBe(eyebrows.length);
      // Each eyebrow is 2-digit zero-padded
      for (const eyebrow of eyebrows) {
        expect(eyebrow).toMatch(/^\d{2}$/);
      }
    }
  });

  it('stages flow pre_committee → committee_gate → post_committee in order', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const phases = mode.stages.map(s => s.phase);
      const phaseOrder: Record<ContainerLifecyclePhase, number> = {
        pre_committee: 0,
        committee_gate: 1,
        post_committee: 2,
      };
      const numeric = phases.map(p => phaseOrder[p]);
      // Monotonically non-decreasing
      for (let i = 1; i < numeric.length; i++) {
        expect(numeric[i]).toBeGreaterThanOrEqual(numeric[i - 1]);
      }
    }
  });

  it('outcomeShape primaryMetric field exists in fields list', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const primary = mode.outcomeShape.fields.find(f => f.primary);
      expect(primary).toBeDefined();
    }
  });

  it('requiredDocsForCommittee is a non-empty subset of known doc types', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      expect(mode.requiredDocsForCommittee.length).toBeGreaterThan(0);
      for (const docType of mode.requiredDocsForCommittee) {
        expect(isKnownContainerDocType(docType)).toBe(true);
      }
    }
  });

  it('primaryDocType is in the known doc types set', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      expect(isKnownContainerDocType(mode.primaryDocType)).toBe(true);
    }
  });
});

describe('CONTAINER_MODES — investment shape', () => {
  it('uses VC-canonical stage ids', () => {
    const mode = CONTAINER_MODES.investment;
    const ids = mode.stages.map(s => s.id);
    expect(ids).toEqual([
      'sourcing',
      'diligence',
      'ic_review',
      'term_sheet',
      'closed',
      'portfolio',
      'exited',
    ]);
  });

  it('committee gate is IC Review', () => {
    expect(CONTAINER_MODES.investment.committeeStageId).toBe('ic_review');
    expect(CONTAINER_MODES.investment.committeeLabel).toBe('IC Review');
  });

  it('outcome shape is irr_moic with MOIC primary', () => {
    expect(CONTAINER_MODES.investment.outcomeShape.shape).toBe('irr_moic');
    const primary = CONTAINER_MODES.investment.outcomeShape.fields.find(f => f.primary);
    expect(primary!.key).toBe('moic');
  });

  it('IC Review stage names canonical investment toxic patterns', () => {
    const stage = getContainerStage('investment', 'ic_review')!;
    expect(stage.likelyPatternLabels).toContain('The Yes Committee');
    expect(stage.likelyPatternLabels).toContain('The Echo Chamber');
  });
});

describe('CONTAINER_MODES — acquisition shape', () => {
  it('uses M&A-canonical stage ids', () => {
    const mode = CONTAINER_MODES.acquisition;
    const ids = mode.stages.map(s => s.id);
    expect(ids).toEqual([
      'target_id',
      'diligence',
      'committee_review',
      'closing',
      'integration',
      'exited',
    ]);
  });

  it('committee gate is Board / IC Review', () => {
    expect(CONTAINER_MODES.acquisition.committeeStageId).toBe('committee_review');
    expect(CONTAINER_MODES.acquisition.committeeLabel).toBe('Board / IC Review');
  });

  it('outcome shape is synergy_realisation with synergy% primary', () => {
    expect(CONTAINER_MODES.acquisition.outcomeShape.shape).toBe('synergy_realisation');
    const primary = CONTAINER_MODES.acquisition.outcomeShape.fields.find(f => f.primary);
    expect(primary!.key).toBe('synergy_realisation_pct');
  });

  it('Diligence stage names the 3 M&A toxic patterns', () => {
    const stage = getContainerStage('acquisition', 'diligence')!;
    expect(stage.likelyPatternLabels).toContain('The Synergy Mirage');
    expect(stage.likelyPatternLabels).toContain('The Conglomerate Fallacy');
    expect(stage.likelyPatternLabels).toContain("The Winner's Curse");
  });

  it('expected docs at Diligence include qofe + synergy_model + integration_plan', () => {
    const stage = getContainerStage('acquisition', 'diligence')!;
    expect(stage.expectedDocTypes).toContain('qofe');
    expect(stage.expectedDocTypes).toContain('synergy_model');
    expect(stage.expectedDocTypes).toContain('integration_plan');
  });
});

describe('CONTAINER_MODES — strategic shape', () => {
  it('uses generic-decision stage ids', () => {
    const mode = CONTAINER_MODES.strategic;
    const ids = mode.stages.map(s => s.id);
    expect(ids).toEqual(['drafting', 'under_review', 'decided', 'executing', 'outcome_logged']);
  });

  it('committee gate is generic Decision Committee', () => {
    expect(CONTAINER_MODES.strategic.committeeStageId).toBe('under_review');
    expect(CONTAINER_MODES.strategic.committeeLabel).toBe('Decision Committee');
  });

  it('outcome shape is forecast_hit_rate', () => {
    expect(CONTAINER_MODES.strategic.outcomeShape.shape).toBe('forecast_hit_rate');
  });
});

describe('helpers', () => {
  it('getContainerMode returns mode for valid kind', () => {
    expect(getContainerMode('investment').label).toBe('Investment');
    expect(getContainerMode('acquisition').label).toBe('Acquisition');
    expect(getContainerMode('strategic').label).toBe('Strategic Decision');
  });

  it('getContainerMode throws on unknown kind', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => getContainerMode('nonexistent')).toThrow();
  });

  it('getContainerStage returns stage for valid kind+stageId', () => {
    expect(getContainerStage('investment', 'ic_review')?.label).toBe('IC Review');
    expect(getContainerStage('acquisition', 'diligence')?.label).toBe('Diligence');
  });

  it('getContainerStage returns undefined for unknown stageId', () => {
    expect(getContainerStage('investment', 'no-such-stage')).toBeUndefined();
  });

  it('isRequiredCommitteeDoc is mode-aware', () => {
    expect(isRequiredCommitteeDoc('investment', 'ic_memo')).toBe(true);
    expect(isRequiredCommitteeDoc('investment', 'pitch_deck')).toBe(true);
    expect(isRequiredCommitteeDoc('investment', 'qofe')).toBe(false);
    expect(isRequiredCommitteeDoc('acquisition', 'cim')).toBe(true);
    expect(isRequiredCommitteeDoc('acquisition', 'pitch_deck')).toBe(false);
    expect(isRequiredCommitteeDoc('strategic', 'memo')).toBe(true);
    expect(isRequiredCommitteeDoc('strategic', 'cim')).toBe(false);
  });

  it('isRequiredCommitteeDoc handles null/undefined gracefully', () => {
    expect(isRequiredCommitteeDoc('investment', null)).toBe(false);
    expect(isRequiredCommitteeDoc('acquisition', undefined)).toBe(false);
  });

  it('isKnownContainerDocType accepts INVESTMENT_DOCUMENT_TYPES + memo/deck/model/other', () => {
    expect(isKnownContainerDocType('ic_memo')).toBe(true);
    expect(isKnownContainerDocType('cim')).toBe(true);
    expect(isKnownContainerDocType('qofe')).toBe(true);
    expect(isKnownContainerDocType('synergy_model')).toBe(true);
    expect(isKnownContainerDocType('memo')).toBe(true);
    expect(isKnownContainerDocType('deck')).toBe(true);
    expect(isKnownContainerDocType('other')).toBe(true);
    expect(isKnownContainerDocType('made_up_type')).toBe(false);
  });
});

describe('cross-mode invariants', () => {
  it('all 3 modes have distinct labels', () => {
    const labels = Object.values(CONTAINER_MODES).map(m => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('all 3 modes have distinct outcome shapes', () => {
    const shapes = Object.values(CONTAINER_MODES).map(m => m.outcomeShape.shape);
    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it('all 3 outcome shapes have at least one primary field marked', () => {
    for (const mode of Object.values(CONTAINER_MODES)) {
      const primaryCount = mode.outcomeShape.fields.filter(f => f.primary).length;
      // Allow exactly one primary field per outcome shape
      expect(primaryCount).toBe(1);
    }
  });

  it('every kind appears in CONTAINER_KINDS exactly once', () => {
    const allKinds: DecisionContainerKind[] = ['investment', 'acquisition', 'strategic'];
    expect(CONTAINER_KINDS).toEqual(allKinds);
    expect(new Set(CONTAINER_KINDS).size).toBe(CONTAINER_KINDS.length);
  });
});

// V5 — rigid stage-gated schema. Locks the pure transition validator
// shared verbatim by the PATCH route (server enforcement) and any
// client guidance — never two implementations that can drift.
describe('validateStageTransition — rigid lifecycle', () => {
  it('allows a no-op move (same stage) regardless of docs', () => {
    expect(
      validateStageTransition({
        kind: 'investment',
        fromStageId: 'sourcing',
        toStageId: 'sourcing',
        attachedDocTypes: [],
      }).allowed
    ).toBe(true);
  });

  it('allows pre-committee forward moves without docs (no gate yet)', () => {
    expect(
      validateStageTransition({
        kind: 'investment',
        fromStageId: 'sourcing',
        toStageId: 'diligence',
        attachedDocTypes: [],
      }).allowed
    ).toBe(true);
  });

  it('BLOCKS entering the committee stage without the required docs', () => {
    const v = validateStageTransition({
      kind: 'investment',
      fromStageId: 'diligence',
      toStageId: 'ic_review',
      attachedDocTypes: ['ic_memo'], // missing pitch_deck
    });
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/pitch_deck/);
  });

  it('ALLOWS committee entry once every required doc is attached', () => {
    expect(
      validateStageTransition({
        kind: 'investment',
        fromStageId: 'diligence',
        toStageId: 'ic_review',
        attachedDocTypes: ['ic_memo', 'pitch_deck'],
      }).allowed
    ).toBe(true);
  });

  it('BLOCKS skipping the committee gate even with all docs present', () => {
    const v = validateStageTransition({
      kind: 'investment',
      fromStageId: 'sourcing',
      toStageId: 'closed',
      attachedDocTypes: ['ic_memo', 'pitch_deck'],
    });
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/skip|committee/i);
  });

  it('ALLOWS backward revision kickback (committee → diligence)', () => {
    expect(
      validateStageTransition({
        kind: 'investment',
        fromStageId: 'ic_review',
        toStageId: 'diligence',
        attachedDocTypes: [],
      }).allowed
    ).toBe(true);
  });

  it('BLOCKS an unknown target stage', () => {
    const v = validateStageTransition({
      kind: 'investment',
      fromStageId: 'sourcing',
      toStageId: 'not_a_stage',
      attachedDocTypes: [],
    });
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/not a valid stage/i);
  });

  it('enforces the per-mode required-doc set (acquisition needs ic_memo + cim + due_diligence)', () => {
    const missing = validateStageTransition({
      kind: 'acquisition',
      fromStageId: 'diligence',
      toStageId: 'committee_review',
      attachedDocTypes: ['ic_memo', 'cim'], // missing due_diligence
    });
    expect(missing.allowed).toBe(false);
    expect(missing.reason).toMatch(/due_diligence/);

    expect(
      validateStageTransition({
        kind: 'acquisition',
        fromStageId: 'diligence',
        toStageId: 'committee_review',
        attachedDocTypes: ['ic_memo', 'cim', 'due_diligence'],
      }).allowed
    ).toBe(true);
  });

  it('strategic mode gates under_review on the memo doc', () => {
    expect(
      validateStageTransition({
        kind: 'strategic',
        fromStageId: 'drafting',
        toStageId: 'under_review',
        attachedDocTypes: [],
      }).allowed
    ).toBe(false);
    expect(
      validateStageTransition({
        kind: 'strategic',
        fromStageId: 'drafting',
        toStageId: 'under_review',
        attachedDocTypes: ['memo'],
      }).allowed
    ).toBe(true);
  });

  it('the doc-gate also guards post-committee stages (not just the gate stage)', () => {
    // Entering a post-committee stage from the committee stage still
    // requires the docs (you cannot reach committee without them, but
    // this locks the invariant directly).
    const v = validateStageTransition({
      kind: 'investment',
      fromStageId: 'ic_review',
      toStageId: 'term_sheet',
      attachedDocTypes: [],
    });
    expect(v.allowed).toBe(false);
  });
});

describe('getNextContainerStage', () => {
  it('returns the next ordered stage', () => {
    expect(getNextContainerStage('investment', 'sourcing')?.id).toBe('diligence');
  });
  it('returns undefined at the terminal stage', () => {
    const last = CONTAINER_MODES.investment.stages.at(-1)!.id;
    expect(getNextContainerStage('investment', last)).toBeUndefined();
  });
  it('returns undefined for an unknown stage', () => {
    expect(getNextContainerStage('strategic', 'nope')).toBeUndefined();
  });
});
