/**
 * DPR Page Regulatory Crosswalk — 19-framework grid by region.
 *
 * Locked 2026-05-05 (Phase 3). Per master KB synthesis: regulatory
 * crosswalks are the ultimate procurement trigger for F500 GCs and audit
 * committee chairs. The page renders all frameworks the platform maps
 * (currently 19 across G7 / EU / UK / GCC / African markets) grouped by
 * region, with the per-bias triggers from this audit highlighted.
 *
 * The audit-specific overlay shows: of the framework registry the platform
 * maps (currently sized via `getAllRegisteredFrameworks().length`), which
 * have been triggered by the biases flagged on THIS memo.
 * That answers the procurement reader's first question: "which regulators
 * care about this audit?"
 */

import { DprPageShell } from '../primitives/DprPageShell';
import { DprSection } from '../primitives/DprSection';
import { DprNotice } from '../primitives/DprNotice';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import type { ProvenanceRecordData } from '@/lib/reports/provenance-record-data';

export interface DprPageRegulatoryCrosswalkProps {
  data: ProvenanceRecordData;
  pageNumber: number;
  totalPages: number;
  classification?: 'sample' | 'specimen' | 'confidential' | 'client-safe-export';
  auditTimestamp: string;
  footerTitle?: string;
}

interface FrameworkSlot {
  id: string;
  shortName: string;
  region: 'g7' | 'eu' | 'uk' | 'us' | 'gcc' | 'africa' | 'global' | 'other';
  triggered: boolean;
  triggerCount: number;
}

export function DprPageRegulatoryCrosswalk(props: DprPageRegulatoryCrosswalkProps) {
  const {
    data,
    pageNumber,
    totalPages,
    classification = 'confidential',
    auditTimestamp,
    footerTitle = 'Decision Provenance Record',
  } = props;

  const slots = buildFrameworkSlots(data);
  const groups = groupByRegion(slots);
  const triggeredCount = slots.filter(s => s.triggered).length;

  return (
    <DprPageShell
      pageNumber={pageNumber}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      <DprSection
        marker="§7"
        eyebrow="Regulatory crosswalk"
        title={`${triggeredCount} of ${slots.length} mapped frameworks triggered by this audit`}
        strap="The platform maps strategic-decision biases against the regulatory frameworks that name them as material. Below: the full registry, grouped by region, with the frameworks this audit triggered highlighted in the locked severity-led palette. A reviewer can copy this section row-for-row into a vendor-risk register."
      >
        <div className="dpr-crosswalk-grid">
          {(['eu', 'us', 'uk', 'g7', 'gcc', 'africa', 'global', 'other'] as const).map(region => {
            const items = groups[region];
            if (!items || items.length === 0) return null;
            return (
              <section key={region} className="dpr-crosswalk-region">
                <h3 className="dpr-crosswalk-region-title">{REGION_LABEL[region]}</h3>
                <div className="dpr-crosswalk-region-items">
                  {items.map(slot => (
                    <span
                      key={slot.id}
                      className={
                        slot.triggered
                          ? 'dpr-crosswalk-chip dpr-crosswalk-chip--triggered'
                          : 'dpr-crosswalk-chip'
                      }
                      title={
                        slot.triggered
                          ? `Triggered by ${slot.triggerCount} flagged bias${slot.triggerCount === 1 ? '' : 'es'} on this audit`
                          : 'Mapped on the platform but not triggered by this audit'
                      }
                    >
                      {slot.shortName}
                      {slot.triggered && (
                        <span className="dpr-crosswalk-chip-count">{slot.triggerCount}</span>
                      )}
                    </span>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <DprNotice mark="On registry coverage">
          Frameworks not triggered by this audit are still on file — the platform monitors the full{' '}
          {slots.length}-framework registry and flags new triggers as they fire. A reviewer who
          needs a specific cross-border deal-shape covered (e.g. NDPR + WAEMU + EU AI Act on a
          Pan-African M&A) can request a per-framework deep-dive under the DPA.
        </DprNotice>
      </DprSection>
    </DprPageShell>
  );
}

const REGION_LABEL: Record<FrameworkSlot['region'], string> = {
  eu: 'European Union',
  us: 'United States',
  uk: 'United Kingdom',
  g7: 'G7 cross-jurisdictional',
  gcc: 'GCC + Middle East',
  africa: 'African markets',
  global: 'Global · cross-border',
  other: 'Other',
};

function buildFrameworkSlots(data: ProvenanceRecordData): FrameworkSlot[] {
  const all = getAllRegisteredFrameworks();
  const triggerCounts = new Map<string, number>();
  const triggeredIds = new Set<string>();
  for (const reg of data.regulatoryMapping) {
    for (const fw of reg.frameworks) {
      triggeredIds.add(fw.id);
      triggerCounts.set(fw.id, (triggerCounts.get(fw.id) ?? 0) + 1);
    }
  }

  return all.map(fw => ({
    id: fw.id,
    shortName: shortenFrameworkName(fw.name),
    region: classifyRegion(fw.id, fw.name),
    triggered: triggeredIds.has(fw.id),
    triggerCount: triggerCounts.get(fw.id) ?? 0,
  }));
}

function groupByRegion(slots: FrameworkSlot[]): Record<FrameworkSlot['region'], FrameworkSlot[]> {
  const out: Record<FrameworkSlot['region'], FrameworkSlot[]> = {
    eu: [],
    us: [],
    uk: [],
    g7: [],
    gcc: [],
    africa: [],
    global: [],
    other: [],
  };
  for (const s of slots) {
    out[s.region].push(s);
  }
  return out;
}

function shortenFrameworkName(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s+—.*$/, '')
    .replace(/\s+·.*$/, '')
    .trim();
}

function classifyRegion(id: string, name: string): FrameworkSlot['region'] {
  const lower = `${id} ${name}`.toLowerCase();
  // Order matters: Africa is tested FIRST so a phrase like "Nigerian
  // Investment & Securities Act 2007" doesn't accidentally fall into US
  // because "securities" or "sec" appears in the name.
  if (
    lower.includes('ndpr') ||
    lower.includes('cbn') ||
    lower.includes('frc_nigeria') ||
    lower.includes('frc nigeria') ||
    lower.includes('isa_nigeria') ||
    lower.includes('isa nigeria') ||
    lower.includes('waemu') ||
    lower.includes('cma_kenya') ||
    lower.includes('cma kenya') ||
    lower.includes('cbk') ||
    lower.includes(' bog') ||
    lower.includes('bog_') ||
    lower.includes('bank of ghana') ||
    lower.includes('cbe ') ||
    lower.includes('cbe_') ||
    lower.includes('bank of egypt') ||
    lower.includes('popia') ||
    lower.includes('sarb_') ||
    lower.includes('south african reserve') ||
    lower.includes('bot fintech') ||
    lower.includes('bot_fintech') ||
    lower.includes('bank of tanzania') ||
    lower.includes('south africa') ||
    lower.includes('nigeria') ||
    lower.includes('ghana') ||
    lower.includes('kenya') ||
    lower.includes('tanzania') ||
    lower.includes('egypt') ||
    lower.includes('rwanda') ||
    lower.includes('west african')
  )
    return 'africa';
  if (
    lower.includes('eu_ai') ||
    lower.includes('eu ai') ||
    lower.includes('gdpr') ||
    lower.includes('european') ||
    lower.includes('eu act')
  )
    return 'eu';
  if (
    lower.includes('sec ') ||
    lower.includes('sec_') ||
    lower.includes('sec disclosure') ||
    lower.includes('sec regulation') ||
    lower.includes('finra') ||
    lower.includes('sarbanes') ||
    lower.includes(' sox') ||
    lower.includes('united states') ||
    lower.includes('colorado sb') ||
    lower.includes('california sb')
  )
    return 'us';
  if (
    lower.includes(' uk ') ||
    lower.includes('uk_') ||
    lower.includes('uk ai') ||
    lower.includes('fca ') ||
    lower.includes('fca_') ||
    lower.includes('united kingdom')
  )
    return 'uk';
  if (lower.includes('basel') || lower.includes('iso ') || lower.includes('oecd')) return 'g7';
  if (lower.includes('gcc') || lower.includes('uae') || lower.includes('saudi')) return 'gcc';
  if (lower.includes('ai verify') || lower.includes('iso_42001') || lower.includes('iso 42001'))
    return 'global';
  return 'other';
}
