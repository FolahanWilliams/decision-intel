/**
 * PipelineNodeGlyph — bespoke 12-icon SVG set for the pipeline nodes on
 * /how-it-works. Replaces the generic Lucide set so the pipeline diagram
 * reads as a brand asset, not a Notion sidebar.
 *
 * Design rules:
 *   - 24×24 viewBox; render target typically 22px
 *   - Stroke-only, currentColor (or overridden via `color`), strokeWidth 1.75
 *   - Each glyph signals the node's *role*, not just its label
 *   - Works under a dark chip fill (zoneActive) AND a light chip fill
 *
 * Keep this file co-located with the other /how-it-works viz components.
 */

import type { PipelineNode } from '@/lib/data/pipeline-nodes';

type GlyphProps = {
  size?: number;
  color?: string;
};

const BASE = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.75,
};

function Svg({ size = 22, color, children }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ color }}
    >
      <g stroke="currentColor" {...BASE}>
        {children}
      </g>
    </svg>
  );
}

// 1. gdprAnonymizer — shield with a redaction bar across the center
function GdprAnonymizerGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 L4 6 v5 c0 4.6 3.2 8.4 8 10 4.8-1.6 8-5.4 8-10 V6 z" />
      <line x1="8" y1="12" x2="16" y2="12" strokeWidth={3} />
    </Svg>
  );
}

// 2. structurer — cascading outline blocks (input → structure)
function StructurerGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="3" rx="0.8" />
      <rect x="5" y="10.5" width="14" height="3" rx="0.8" />
      <rect x="7" y="16.5" width="10" height="3" rx="0.8" />
    </Svg>
  );
}

// 3. intelligenceGatherer — radar sweep with a hit marker
function IntelligenceGathererGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="12" x2="18.5" y2="5.5" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </Svg>
  );
}

// 4. biasDetective — magnifier over an eye-iris (inspecting perception)
function BiasDetectiveGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="10" r="5.5" />
      <line x1="14" y1="14" x2="20" y2="20" strokeWidth={2} />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none" />
      <path d="M6.8 10 c1-1.8 5.2-1.8 6.4 0" />
    </Svg>
  );
}

// 5. noiseJudge — twin-pan balance scales
function NoiseJudgeGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <line x1="12" y1="5" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="4" y1="8" x2="20" y2="8" />
      <path d="M4 8 l-1.8 4.2 h3.6 z" />
      <path d="M20 8 l-1.8 4.2 h3.6 z" />
    </Svg>
  );
}

// 6. verificationNode — shield-stamp with a compliance check
function VerificationGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 L20 7 v5 c0 4-3.2 7.5-8 9 -4.8-1.5-8-5-8-9 V7 z" />
      <path d="M8.3 12 l2.6 2.6 l4.8-4.8" strokeWidth={2} />
    </Svg>
  );
}

// 7. deepAnalysisNode — microscope (arm, lens, base)
function DeepAnalysisGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <line x1="9" y1="3.5" x2="15" y2="3.5" />
      <line x1="12" y1="3.5" x2="12" y2="10" />
      <circle cx="12" cy="13" r="3.2" />
      <path d="M6 20 L9 16 h6 L18 20" />
      <line x1="5.5" y1="20" x2="18.5" y2="20" />
    </Svg>
  );
}

// 8. simulationNode — boardroom (5 seats around a table)
function SimulationGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="10" width="14" height="5" rx="1.2" />
      <circle cx="6" cy="7.5" r="1.3" />
      <circle cx="12" cy="5.5" r="1.3" />
      <circle cx="18" cy="7.5" r="1.3" />
      <circle cx="8.5" cy="19" r="1.3" />
      <circle cx="15.5" cy="19" r="1.3" />
    </Svg>
  );
}

// 9. rpdRecognitionNode — eye with an inner pattern iris
function RpdRecognitionGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12 C5 7.5 8.8 5.5 12 5.5 C15.2 5.5 19 7.5 21.5 12 C19 16.5 15.2 18.5 12 18.5 C8.8 18.5 5 16.5 2.5 12 z" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

// 10. forgottenQuestionsNode — question inside a dotted unknown-ring
function ForgottenQuestionsGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" strokeDasharray="2.5 2.5" />
      <path d="M9.5 9 c0-2 1.3-3.2 2.6-3.2 c1.6 0 2.9 1.1 2.9 2.8 c0 2-2.8 2.6-2.8 4.6" />
      <circle cx="12.2" cy="17" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

// 11. metaJudgeNode — six lines converging to a single arbitrated point
function MetaJudgeGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <line x1="3.5" y1="5" x2="10.5" y2="10.5" />
      <line x1="20.5" y1="5" x2="13.5" y2="10.5" />
      <line x1="3.5" y1="12" x2="9.5" y2="12" />
      <line x1="20.5" y1="12" x2="14.5" y2="12" />
      <line x1="3.5" y1="19" x2="10.5" y2="13.5" />
      <line x1="20.5" y1="19" x2="13.5" y2="13.5" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </Svg>
  );
}

// 12. riskScorer — semicircular gauge with a scoring needle
function RiskScorerGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M4 17 A8 8 0 0 1 20 17" />
      <line x1="12" y1="17" x2="16.5" y2="9" />
      <circle cx="12" cy="17" r="1.4" fill="currentColor" stroke="none" />
      <line x1="4" y1="17.5" x2="5.3" y2="17.5" strokeWidth={1} />
      <line x1="18.7" y1="17.5" x2="20" y2="17.5" strokeWidth={1} />
    </Svg>
  );
}

const GLYPH_MAP: Record<string, (props: GlyphProps) => React.ReactElement> = {
  gdprAnonymizer: GdprAnonymizerGlyph,
  structurer: StructurerGlyph,
  intelligenceGatherer: IntelligenceGathererGlyph,
  biasDetective: BiasDetectiveGlyph,
  noiseJudge: NoiseJudgeGlyph,
  verificationNode: VerificationGlyph,
  deepAnalysisNode: DeepAnalysisGlyph,
  simulationNode: SimulationGlyph,
  rpdRecognitionNode: RpdRecognitionGlyph,
  forgottenQuestionsNode: ForgottenQuestionsGlyph,
  metaJudgeNode: MetaJudgeGlyph,
  riskScorer: RiskScorerGlyph,
};

export function PipelineNodeGlyph({
  nodeId,
  size = 22,
  color,
}: {
  nodeId: PipelineNode['id'] | string;
  size?: number;
  color?: string;
}) {
  const Glyph = GLYPH_MAP[nodeId];
  if (!Glyph) return null;
  return <Glyph size={size} color={color} />;
}
