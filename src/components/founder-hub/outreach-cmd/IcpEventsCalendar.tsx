'use client';

import { MapPin, ExternalLink, Users, TrendingUp, Star } from 'lucide-react';

interface Event {
  name: string;
  date: string;
  venue: string;
  icpRelevance: 'very_high' | 'high' | 'medium';
  icpWho: string;
  tactic: string;
  url?: string;
}

// Event dates verified against organiser-published patterns through 2024-2025;
// 2026 dates are best-estimates and MUST be confirmed before registering.
// FinTech Connect intentionally NOT included — it is a December event, not Q2-Q3.
const EVENTS: Event[] = [
  {
    name: 'Africa Tech Summit London',
    date: 'May 2026 (verify)',
    venue: 'Shoreditch / Tobacco Dock area, London',
    icpRelevance: 'very_high',
    icpWho:
      'Africa-focused VCs, EM-focused funds, Pan-African corporate strategy leads, Lagos / Nairobi / Cairo decision-makers visiting London',
    tactic:
      'Highest-leverage event for a Lagos-rooted founder — your origin story IS the entry pass. Bring the Dangote sample DPR on your phone (covers NDPR / CBN / WAEMU). Target: 3 Africa-focused fund partners + 2 Pan-African corporate strategy leads before lunch.',
    url: 'https://africatechsummit.com',
  },
  {
    name: 'Mergermarket Annual M&A Forum (Europe)',
    date: 'June 2026 (verify date with organiser)',
    venue: 'London — central / financial district',
    icpRelevance: 'very_high',
    icpWho:
      'M&A directors, corporate development heads, PE deal partners — the densest M&A audience in London',
    tactic:
      'Sit in deal-origination and post-merger integration panels — the rooms where someone has personally watched a deal go wrong. Ask ONE pointed question from the floor about pre-IC bias detection; your name and Decision Intel land in the room instantly. Follow up with the three most relevant speakers within 24 hours.',
    url: 'https://events.mergermarket.com',
  },
  {
    name: 'ACG (Association for Corporate Growth) London',
    date: 'Multiple events through Q2-Q3 2026 (check chapter calendar)',
    venue: 'City of London — usually invitation-friendly evening events',
    icpRelevance: 'very_high',
    icpWho:
      'M&A practitioners, mid-market PE, corporate development at $500M-$2B portcos — the exact GTM beachhead from gtm_2',
    tactic:
      'ACG members are the M&A beachhead ICP from CLAUDE.md. Apply for chapter membership directly (sub-procurement cost, generates inbound). Bring WeWork DPR for US/global conversations, Dangote DPR for any African-exposure portfolio talk.',
    url: 'https://www.acg.org/london',
  },
  {
    name: 'London Tech Week',
    date: 'June 8–12, 2026 (week starting 2nd Monday in June, per recurring pattern)',
    venue: 'Multiple venues — Olympia, Shoreditch, City',
    icpRelevance: 'high',
    icpWho:
      'CXOs, enterprise software buyers, UK government / DSIT officials, AI policy leads',
    tactic:
      'Skip the main conference (crowded, low ICP density). Focus on (a) the side events — breakfasts, dinners, afterparties — where ICP-dense introductions happen, (b) the DSIT AI policy sessions which directly map to the UK AI white paper regulatory tailwind. Your Wiz advisor should know the London Tech Week side-event circuit.',
    url: 'https://londontechweek.com',
  },
  {
    name: 'The AI Summit London',
    date: 'June 2026 (verify; historically mid-June at ExCeL)',
    venue: 'ExCeL London, Royal Docks',
    icpRelevance: 'high',
    icpWho: 'Chief AI Officers, CDOs, enterprise strategy leads actively evaluating AI tools',
    tactic:
      'The "AI in Strategy" and "Responsible AI" tracks are where CSOs evaluating tools congregate. Don\'t exhibit on a small budget — costs ~£15-25K and reads as a marketing scramble. Instead: speak on a panel if invited (apply 4 months ahead), or attend as a delegate and book 5 coffees in the venue\'s networking lounge.',
    url: 'https://london.theaisummit.com',
  },
  {
    name: 'SuperReturn International (Berlin) + London afterparties',
    date: 'June 2026 (Berlin main; London-based fund partners often host pre/post events in London)',
    venue: 'Berlin (main) + London (PE/VC house events)',
    icpRelevance: 'medium',
    icpWho: 'PE / VC fund partners, LP relations, fund strategy leads — the fund-buyer ICP from gtm_8',
    tactic:
      'Berlin trip is high cost / high ICP density; London afterparties are medium cost / similar density. If budget-constrained, target the London events instead — PE houses (Permira, Cinven, BC Partners) often host portfolio receptions in the week. Practice the gtm_8 evidence-moment pitch on at least 3 fund partners that week.',
    url: 'https://informaconnect.com/superreturn-international',
  },
  {
    name: 'Founders Forum',
    date: 'June 2026 (typically Tobacco Dock, dates announced ~3 months ahead)',
    venue: 'Tobacco Dock, East London',
    icpRelevance: 'medium',
    icpWho:
      'European founders + Series A-C CEOs + UK / EU growth investors — adjacent ICP, primary value is advisor and warm-intro density',
    tactic:
      'Not primary ICP for closing deals; primary value is finding the GTM co-founder or sales advisor you need (CLAUDE.md "Founder Context" notes the gap). Your Wiz advisor likely has the invite path. Mention the design-partner program — Founders Forum attendees are exactly the right shape to refer their portfolio strategy teams.',
    url: 'https://foundersforum.com',
  },
  {
    name: 'FT Global Boardroom or Sifted Summit',
    date: 'Multiple events Q2-Q3 2026 (FT runs roundtables monthly; Sifted Summit usually October)',
    venue: 'FT offices London Bridge / Sifted venue varies',
    icpRelevance: 'very_high',
    icpWho: 'Board members, NEDs, GCs, CFOs, strategy executives — Fortune 500 level',
    tactic:
      'FT events are extremely ICP-dense and hard to get into cold. Angles: (a) FT often comp startup founders when there\'s a relevant story (youngest founder in decision-quality AI works), (b) your Wiz advisor likely knows the FT events team. Sifted is more accessible (founder-friendly) and reaches a slightly different audience (UK/EU growth-stage founders + investors).',
  },
];

const RELEVANCE_CONFIG = {
  very_high: { label: 'Core ICP', color: '#16A34A', bg: '#DCFCE7' },
  high: { label: 'High ICP', color: '#0891B2', bg: '#E0F2FE' },
  medium: { label: 'Adjacent', color: '#D97706', bg: '#FEF3C7' },
};

export function IcpEventsCalendar() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          padding: '8px 12px',
          background: 'var(--bg-elevated)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
        }}
      >
        <Star size={13} color="#D97706" />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Curated for Q2–Q3 2026 London circuit. ICP relevance rated by buyer density, not event
          size. <strong>Always verify exact dates with the organiser before registering</strong> —
          published patterns from 2024-2025 are extrapolated, not confirmed for 2026.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EVENTS.map(event => {
          const rel = RELEVANCE_CONFIG[event.icpRelevance];
          return (
            <div
              key={event.name}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${rel.color}`,
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1.2,
                      }}
                    >
                      {event.name}
                    </span>
                    {event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                        aria-label="Event website"
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                      }}
                    >
                      {event.date}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <MapPin size={10} />
                      {event.venue}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: rel.color,
                        background: rel.bg,
                        padding: '2px 7px',
                        borderRadius: 4,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {rel.label}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Users size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {event.icpWho}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <TrendingUp size={12} color={rel.color} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  {event.tactic}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
