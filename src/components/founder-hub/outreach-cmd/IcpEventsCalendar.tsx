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

const EVENTS: Event[] = [
  {
    name: 'Mergermarket M&A Forum London',
    date: 'May 2026',
    venue: 'London (venue TBC)',
    icpRelevance: 'very_high',
    icpWho: 'M&A directors, corporate development leads, PE deal partners',
    tactic:
      'Sit in deal-origination panels. Ask one pointed question from the floor — your name and Decision Intel land in the room instantly. Follow up with the three most relevant speakers that day.',
    url: 'https://www.mergermarket.com/events',
  },
  {
    name: 'ACG London Chapter: Spring Networking',
    date: 'May 2026',
    venue: 'City of London',
    icpRelevance: 'very_high',
    icpWho: 'Association for Corporate Growth — M&A practitioners, PE, and corp dev',
    tactic:
      'Attend as a young founder in enterprise AI. Every ACG member is in the M&A ICP. Bring the WeWork DPR sample PDF on your phone — it is a physical conversation starter.',
  },
  {
    name: 'London Tech Week',
    date: 'June 9–13, 2026',
    venue: 'Multiple venues, Shoreditch / City / Olympia',
    icpRelevance: 'high',
    icpWho: 'CXOs, enterprise software buyers, AI leads, UK gov / DCMS officials',
    tactic:
      'The main conference is crowded and generic — focus on the side events (breakfasts, dinners, afterparties) which are where the ICP-dense introductions happen. The DSIT AI track is worth attending for regulatory tailwind conversations.',
    url: 'https://londontechweek.com',
  },
  {
    name: 'AI Summit London',
    date: 'June 2026',
    venue: 'ExCeL London, Royal Docks',
    icpRelevance: 'high',
    icpWho: 'Chief AI Officers, CDOs, enterprise strategy leads evaluating AI tools',
    tactic:
      'The Enterprise AI track sessions are where CSOs who are actively evaluating tools congregate. Sponsor or exhibit if budget allows — a Decision Intel demo booth reaches more qualified contacts than 10 cold LinkedIn messages.',
    url: 'https://www.theaisummit.com/london',
  },
  {
    name: 'FT Global Boardroom Breakfast',
    date: 'June 2026',
    venue: 'Financial Times offices, London Bridge',
    icpRelevance: 'very_high',
    icpWho: 'Board members, NEDs, GCs, CFOs, strategy executives — Fortune 500 level',
    tactic:
      'FT events are extremely ICP-dense and hard to get into cold. Angle: pitch as the youngest founder building in decision quality AI; FT events often comp startup founders if there is a relevant story. Your Wiz advisor may have an entry path.',
  },
  {
    name: 'SuperVentures / SuperReturn side events',
    date: 'June 2026',
    venue: 'London (Berlin main, London offshoots)',
    icpRelevance: 'medium',
    icpWho: 'PE/VC fund managers, LP relations, fund strategy leads',
    tactic:
      'The fund buyer ICP (lesson gtm_8) is well-represented here. The London networking events around SuperReturn are smaller and easier to get into than the Berlin main event. Good for practicing the 35-minute fund buyer structure.',
  },
  {
    name: 'Founders Forum',
    date: 'June 2026',
    venue: 'Tobacco Dock, London',
    icpRelevance: 'medium',
    icpWho: 'European founders, Series A–C CEOs, UK and EU investors',
    tactic:
      'Not primary ICP, but excellent for advisor introductions and investor warm paths. Your Wiz advisor likely knows people here. This is where you meet the GTM co-founder or sales advisor you need.',
    url: 'https://www.foundersforum.co',
  },
  {
    name: 'FinTech Connect',
    date: 'June 2026',
    venue: 'ExCeL London',
    icpRelevance: 'high',
    icpWho: 'Regulated sector strategy teams, fintech C-suite, banking innovation leads',
    tactic:
      'The BFSI ICP (banks, insurers, fintech platforms) who sit at the intersection of Basel III compliance + strategic decision quality. Lead with the regulatory tailwind story here, not the bias detection story.',
    url: 'https://www.fintechconnect.com',
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
          Curated for Q2–Q3 2026 London circuit. ICP relevance rated by buyer density, not event size.
          Verify dates before registering — confirm with organisers.
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
