import { describe, it, expect } from 'vitest';
import { LPOA_FRAMEWORK } from './lpoa';
import { SEC_REG_D_FRAMEWORK } from './sec-reg-d';
import { getAllRegisteredFrameworks } from './index';
import type { RegulatoryFramework } from '../regulatory-graph';

// ─── Helper ────────────────────────────────────────────────────────────────

/** Run the shared structural checks that apply to every framework. */
function describeFrameworkStructure(framework: RegulatoryFramework) {
  describe('provisions', () => {
    it('should have all provisions with required fields', () => {
      for (const provision of framework.provisions) {
        expect(provision.id).toBeDefined();
        expect(typeof provision.id).toBe('string');
        expect(provision.id.length).toBeGreaterThan(0);

        expect(provision.framework).toBe(framework.id);

        expect(provision.section).toBeDefined();
        expect(typeof provision.section).toBe('string');
        expect(provision.section.length).toBeGreaterThan(0);

        expect(provision.title).toBeDefined();
        expect(typeof provision.title).toBe('string');
        expect(provision.title.length).toBeGreaterThan(0);

        expect(provision.description).toBeDefined();
        expect(typeof provision.description).toBe('string');
        expect(provision.description.length).toBeGreaterThan(0);

        expect(['low', 'medium', 'high', 'critical']).toContain(provision.riskLevel);

        expect(Array.isArray(provision.keywords)).toBe(true);
        expect(provision.keywords.length).toBeGreaterThan(0);
      }
    });

    it('should have no duplicate provision IDs', () => {
      const ids = framework.provisions.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('bias mappings', () => {
    it('should reference only valid provision IDs that exist in the framework', () => {
      const provisionIds = new Set(framework.provisions.map(p => p.id));
      for (const mapping of framework.biasMappings) {
        expect(provisionIds.has(mapping.provisionId)).toBe(true);
      }
    });

    it('should have risk weights in valid range (0-1)', () => {
      for (const mapping of framework.biasMappings) {
        expect(mapping.riskWeight).toBeGreaterThanOrEqual(0);
        expect(mapping.riskWeight).toBeLessThanOrEqual(1);
      }
    });

    it('should have no duplicate bias mapping entries (same biasType + provisionId)', () => {
      const keys = framework.biasMappings.map(m => `${m.biasType}::${m.provisionId}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
}

// ─── LPOA Framework ────────────────────────────────────────────────────────

describe('LPOA_FRAMEWORK', () => {
  describe('metadata', () => {
    it('should have correct id', () => {
      expect(LPOA_FRAMEWORK.id).toBe('lpoa');
    });

    it('should have correct name', () => {
      expect(LPOA_FRAMEWORK.name).toBe('Limited Partnership Operating Agreement');
    });

    it('should have correct jurisdiction', () => {
      expect(LPOA_FRAMEWORK.jurisdiction).toBe('International');
    });

    it('should have correct category', () => {
      expect(LPOA_FRAMEWORK.category).toBe('corporate_governance');
    });
  });

  describe('provisions', () => {
    it('should have exactly 6 provisions', () => {
      expect(LPOA_FRAMEWORK.provisions).toHaveLength(6);
    });

    it('should contain all expected provision IDs', () => {
      const ids = LPOA_FRAMEWORK.provisions.map(p => p.id);
      expect(ids).toContain('lpoa_capital_calls');
      expect(ids).toContain('lpoa_distribution_waterfall');
      expect(ids).toContain('lpoa_key_person');
      expect(ids).toContain('lpoa_investment_restrictions');
      expect(ids).toContain('lpoa_reporting');
      expect(ids).toContain('lpoa_gp_removal');
    });
  });

  describe('bias mappings', () => {
    it('should have exactly 16 bias mappings', () => {
      expect(LPOA_FRAMEWORK.biasMappings).toHaveLength(16);
    });

    it('should cover all expected bias types', () => {
      const biasTypes = new Set(LPOA_FRAMEWORK.biasMappings.map(m => m.biasType));
      for (const bias of [
        'anchoring_bias',
        'confirmation_bias',
        'authority_bias',
        'groupthink',
        'sunk_cost_fallacy',
        'overconfidence_bias',
        'framing_effect',
        'status_quo_bias',
        'loss_aversion',
        'recency_bias',
      ]) {
        expect(biasTypes.has(bias)).toBe(true);
      }
    });
  });

  describeFrameworkStructure(LPOA_FRAMEWORK);
});

// ─── SEC Regulation D Framework ────────────────────────────────────────────

describe('SEC_REG_D_FRAMEWORK', () => {
  describe('metadata', () => {
    it('should have correct id', () => {
      expect(SEC_REG_D_FRAMEWORK.id).toBe('sec_reg_d');
    });

    it('should have correct name', () => {
      expect(SEC_REG_D_FRAMEWORK.name).toBe('SEC Regulation D');
    });

    it('should have correct jurisdiction', () => {
      expect(SEC_REG_D_FRAMEWORK.jurisdiction).toBe('United States');
    });

    it('should have correct category', () => {
      expect(SEC_REG_D_FRAMEWORK.category).toBe('financial');
    });
  });

  describe('provisions', () => {
    it('should have exactly 5 provisions', () => {
      expect(SEC_REG_D_FRAMEWORK.provisions).toHaveLength(5);
    });

    it('should contain all expected provision IDs', () => {
      const ids = SEC_REG_D_FRAMEWORK.provisions.map(p => p.id);
      expect(ids).toContain('sec_rd_rule_501');
      expect(ids).toContain('sec_rd_rule_502');
      expect(ids).toContain('sec_rd_rule_503');
      expect(ids).toContain('sec_rd_rule_506b');
      expect(ids).toContain('sec_rd_rule_506c');
    });
  });

  describe('bias mappings', () => {
    it('should have exactly 16 bias mappings', () => {
      expect(SEC_REG_D_FRAMEWORK.biasMappings).toHaveLength(16);
    });

    it('should cover all expected bias types', () => {
      const biasTypes = new Set(SEC_REG_D_FRAMEWORK.biasMappings.map(m => m.biasType));
      for (const bias of [
        'authority_bias',
        'confirmation_bias',
        'overconfidence_bias',
        'anchoring_bias',
        'availability_heuristic',
        'groupthink',
        'framing_effect',
        'halo_effect',
        'status_quo_bias',
      ]) {
        expect(biasTypes.has(bias)).toBe(true);
      }
    });
  });

  describeFrameworkStructure(SEC_REG_D_FRAMEWORK);
});

// ─── Registry ──────────────────────────────────────────────────────────────

describe('getAllRegisteredFrameworks', () => {
  it('should return all 18 frameworks (7 international anchors + 11 African-market regimes)', () => {
    const frameworks = getAllRegisteredFrameworks();
    expect(frameworks).toHaveLength(18);
  });

  it('should return frameworks with unique IDs', () => {
    const frameworks = getAllRegisteredFrameworks();
    const ids = frameworks.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should include the LPOA framework', () => {
    const frameworks = getAllRegisteredFrameworks();
    const ids = frameworks.map(f => f.id);
    expect(ids).toContain('lpoa');
  });

  it('should include the SEC Reg D framework', () => {
    const frameworks = getAllRegisteredFrameworks();
    const ids = frameworks.map(f => f.id);
    expect(ids).toContain('sec_reg_d');
  });

  it('should include the CBK framework (Central Bank of Kenya, added 2026-04-26)', () => {
    const frameworks = getAllRegisteredFrameworks();
    const ids = frameworks.map(f => f.id);
    expect(ids).toContain('cbk_kenya');
  });

  it('should map anchoring_bias, survivorship_bias, and planning_fallacy to ≥1 African framework each (locked 2026-04-26)', () => {
    const frameworks = getAllRegisteredFrameworks();
    const africaIds = new Set([
      'ndpr_nigeria',
      'cbn_ai_guidelines',
      'waemu',
      'cma_kenya',
      'cbk_kenya',
      'bog_ghana',
      'frc_nigeria',
      'cbe_egypt',
      'popia_south_africa',
      'sarb_model_risk',
      'bot_tanzania',
    ]);
    const africaFrameworks = frameworks.filter(f => africaIds.has(f.id));
    const dominantPeVcBiases = ['anchoring_bias', 'survivorship_bias', 'planning_fallacy'];
    for (const bias of dominantPeVcBiases) {
      const matches = africaFrameworks.flatMap(f =>
        f.biasMappings.filter(m => m.biasType === bias)
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
  });
});
