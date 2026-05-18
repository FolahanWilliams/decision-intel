/**
 * Evidentiary Standard fingerprint — Defensibility Vector #4
 * ("Methodology-as-standard", the FICO/GAAP-of-decision-quality
 * switching-cost moat).
 *
 * The DPR already carries the individual cryptographic pieces
 * (METHODOLOGY_VERSION + SHA-256 input hash + prompt fingerprint + DQI
 * weights-resolution hash + record schema). Per the CLAUDE.md
 * Defensibility lock Vector #4: "the hashing is immediately-buildable
 * (the DPR already carries SHA-256 + methodology version); ... Bind the
 * hashes into the legal-evidence framing, not just the PDF footer."
 *
 * This module does the BINDING half: it COMPOSES those scattered pieces
 * into ONE short, deterministic, regulator-citable token. A GC builds
 * their EU AI Act Art 14 / Basel III ICAAP audit trail on THIS token;
 * the contractual continuity framing (the actual switching cost) lives
 * in `EVIDENTIARY_STANDARD_*` in src/lib/constants/trust-copy.ts and is
 * surfaced verbatim on the DPR cover strap, Terms §10I, the DPA
 * template, /security, /trust, and the chat coach (founder-context.ts).
 *
 * Pure + deterministic — no I/O, no LLM, no recompute of any score.
 * Same audit → same token across every re-render. NOTHING here changes
 * the DQI; it only surfaces values that already exist.
 *
 * Honesty discipline (procurement-grade): an unavailable input hash
 * composes to the literal `na` segment — never a fabricated digest. A
 * missing weights hash (legacy / pre-T2.1 audits) omits the `w:`
 * segment rather than inventing a canonical one.
 */

export const EVIDENTIARY_STANDARD_TOKEN_PREFIX = 'ES';

/** Sentinel the DPR assembler uses when contentHash is unreadable. */
const UNAVAILABLE = 'UNAVAILABLE';

export interface EvidentiaryStandardInput {
  /** DQI methodology version (canonical: METHODOLOGY_VERSION in dqi.ts). */
  methodologyVersion: string;
  /** SHA-256 of the source memo, or 'UNAVAILABLE' (legacy / schema drift). */
  inputHash: string;
  /** SHA-256 of the prompt version active at audit time. */
  promptFingerprint: string;
  /** DQI weights-resolution hash (12-char). Absent on pre-T2.1 audits. */
  weightsHash?: string | null;
  /** DPR record schema version (e.g. 2). */
  schemaVersion: number;
}

export interface EvidentiaryStandard {
  /** The single citable fingerprint a GC pins their audit trail to. */
  token: string;
  /** Echoed for the cover row + the chat coach. */
  methodologyVersion: string;
}

/** First 8 hex chars of a hash, or `na` for an unreadable/empty input. */
function short8(hash: string | null | undefined): string {
  const h = (hash ?? '').trim();
  if (!h || h === UNAVAILABLE) return 'na';
  // Hashes are hex; defensively strip non-hex so a stray prefix can't
  // leak into the citable token. Lowercased for stable comparison.
  const hex = h.toLowerCase().replace(/[^0-9a-f]/g, '');
  return hex.length >= 8 ? hex.slice(0, 8) : (hex || 'na');
}

/**
 * Compose the regulator-citable evidentiary-standard fingerprint.
 *
 * Format: `ES·m<methodology>·in:<inputHash8>·pf:<promptFp8>[·w:<weightsHash>]·s<schema>`
 * e.g.    `ES·m2.4.0·in:1a2b3c4d·pf:5e6f7a8b·w:4e51b0850db4·s2`
 *
 * Stable across re-renders of the same audit (every segment is derived
 * from immutable persisted values). The `w:` segment is omitted, not
 * faked, when no weights hash exists.
 */
export function composeEvidentiaryStandardFingerprint(
  input: EvidentiaryStandardInput
): EvidentiaryStandard {
  const methodologyVersion = (input.methodologyVersion ?? '').trim() || 'unknown';
  const segments = [
    EVIDENTIARY_STANDARD_TOKEN_PREFIX,
    `m${methodologyVersion}`,
    `in:${short8(input.inputHash)}`,
    `pf:${short8(input.promptFingerprint)}`,
  ];
  const w = (input.weightsHash ?? '').trim();
  if (w) {
    // The weights hash is already a short 12-char token (hashWeights in
    // dqi.ts) — surface it whole; it IS the citable weights identity.
    segments.push(`w:${w.toLowerCase().replace(/[^0-9a-f]/g, '') || w.toLowerCase()}`);
  }
  segments.push(`s${Number.isFinite(input.schemaVersion) ? input.schemaVersion : 0}`);

  return {
    token: segments.join('·'),
    methodologyVersion,
  };
}
