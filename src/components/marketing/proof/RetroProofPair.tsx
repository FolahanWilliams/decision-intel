'use client';

/**
 * RetroProofPair — the paired good/bad retrospective proof on /demo.
 *
 * Locked 2026-06-05 (SF-advisor retro motion, icp.ts RETRO_POSTMORTEM_COLD_OPEN).
 * The founder's cold-open is "let me run it over two deals you've already closed,
 * one you feel good about and one that went sideways." This makes the highest-
 * leverage acquisition surface (/demo) literally embody that pitch: two famous,
 * PUBLIC, closed decisions audited in hindsight — Apple's iPhone bet (held up)
 * + WeWork's S-1 (went sideways), same engine. The held-up half is the ego-safe
 * move: it proves the audit is not a hit-piece — when the reasoning is sound,
 * it says so.
 *
 * Self-contained palette; safe to render anywhere. Renders the held-up panel
 * FIRST (ego-safe → value-detonating, mirroring the cold-open order).
 */

import { DecisionProofPanel, APPLE_HELD_UP, WEWORK_FLAGGED } from './DecisionProofPanel';

const C = {
  slate500: '#64748B',
  slate900: '#0F172A',
};

export function RetroProofPair() {
  return (
    <div
      className="retro-proof-pair"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
    >
      <style>{`
        .retro-proof-pair-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          align-items: stretch;
          width: 100%;
          max-width: 1160px;
        }
        @media (max-width: 880px) {
          .retro-proof-pair-grid { grid-template-columns: 1fr; max-width: 560px; }
        }
      `}</style>

      <div style={{ textAlign: 'center', maxWidth: 720 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.slate500,
            margin: '0 0 6px',
          }}
        >
          Or see two we already ran
        </p>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: C.slate900, margin: 0 }}>
          Two public decisions, audited in hindsight: one that held up, one that went sideways, same
          engine. It does not just find problems; when the reasoning is sound, the audit says so.
        </p>
      </div>

      <div className="retro-proof-pair-grid">
        <DecisionProofPanel {...APPLE_HELD_UP} eventName="demo_apple_heldup_proof_clicked" />
        <DecisionProofPanel {...WEWORK_FLAGGED} eventName="demo_wework_proof_panel_clicked" />
      </div>
    </div>
  );
}
