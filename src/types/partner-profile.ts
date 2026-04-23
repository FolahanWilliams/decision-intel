/**
 * Structured shape for DesignPartnerApplication.richProfile (JSON column).
 *
 * Rendered by the Design Partners detail view inside the Founder Hub.
 * All fields are optional so the UI can render progressively as fields
 * are filled in over the pilot-preparation arc. Stored as JSON (not as
 * columns) so the shape can evolve freely during the pilot-scoping
 * phase; promote to columns if/when we stabilise.
 */

export interface PartnerWhatTheyDo {
  /** 1-3 sentence elevator of what the partner actually does. */
  summary?: string;
  /** Core service lines, each with a 1-sentence description. */
  services?: Array<{ title: string; description: string }>;
  /** Stated operating philosophy or tagline. */
  philosophy?: string;
  /** Heritage / naming / cultural signal worth invoking in the pitch. */
  heritage?: string;
  /** Scale + regulatory posture. */
  scale?: {
    aum?: string;
    teamSize?: string;
    founded?: string;
    licenses?: string[];
    regulator?: string;
    headquarters?: string;
  };
  /** Named key people (CEO, founding partners, etc.). Separate from
   *  PartnerContact which is the list of people the founder is
   *  personally in touch with. */
  keyPeople?: Array<{ name: string; role: string; note?: string }>;
}

export interface PartnerWedge {
  /** Short wedge title ("Investment committee / deal evaluation"). */
  title: string;
  /** 1-2 sentences on why this workflow matters at the partner. */
  description: string;
  /** Named Decision Intel capability that intersects here. */
  diIntersect: string;
}

export interface PartnerOfferSpec {
  pricing?: {
    rate: string;
    label?: string;
    delta?: string;
    floor?: string;
    fallbackOffer?: string;
    hardNo?: string;
  };
  inclusions?: string[];
  ask?: {
    short?: string;
    long?: string;
  };
}

export interface PartnerPositioning {
  categoryAnchor?: string;
  avoidFraming?: string[];
  openingLine?: string;
  ethosAnchors?: string[];
  pathosCurrents?: Array<{ label: string; moveIn: string }>;
  logosMoves?: Array<{ claim: string; followUp: string }>;
}

export interface PartnerIntroContext {
  source?: string;
  venue?: string;
  depth?: string;
  rule?: string;
}

export interface PartnerRisk {
  title: string;
  detail: string;
}

export interface PartnerStrategicValue {
  arr?: string;
  cohortConversion?: string;
  socialProof?: string;
  narrativeShift?: string;
}

export interface PartnerRichProfile {
  whatTheyDo?: PartnerWhatTheyDo;
  wedges?: PartnerWedge[];
  offerSpec?: PartnerOfferSpec;
  positioning?: PartnerPositioning;
  introContext?: PartnerIntroContext;
  risks?: PartnerRisk[];
  strategic?: PartnerStrategicValue;
}
