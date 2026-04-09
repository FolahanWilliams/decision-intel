'use client';

/**
 * MeetingPrepTab — Live meeting cheat sheet for the Founder Hub.
 * Quick-reference card for investor/partner meetings.
 * Currently configured for: Yumiko Oka (Antler) — April 10, 2026.
 */

const S = {
  green: '#16A34A',
  red: '#EF4444',
  blue: '#3B82F6',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  slate400: '#94A3B8',
} as const;

const sectionCard = (borderColor: string): React.CSSProperties => ({
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderLeft: `4px solid ${borderColor}`,
  borderRadius: 'var(--radius-md)',
  padding: '20px 24px',
  marginBottom: 16,
});

const sectionTitle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 12,
  letterSpacing: '-0.01em',
};

const label: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 8,
};

const body: React.CSSProperties = {
  fontSize: '0.82rem',
  lineHeight: 1.7,
  color: 'var(--text-secondary)',
};

const qaRow: React.CSSProperties = {
  padding: '12px 0',
  borderBottom: '1px solid var(--border-color)',
};

const qText: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 4,
};

const aText: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
};

const statBox: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px 16px',
  textAlign: 'center',
};

const statNum: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
};

const statLabel: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'var(--text-muted)',
  marginTop: 2,
};

const scriptLine: React.CSSProperties = {
  ...body,
  background: 'var(--bg-elevated)',
  padding: '16px 20px',
  borderRadius: 'var(--radius-md)',
  fontStyle: 'italic',
};

export function MeetingPrepTab() {
  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: 20,
          color: '#FFFFFF',
        }}
      >
        <div style={{ ...label, color: S.green }}>CALL PREP — LIVE CHEAT SHEET</div>
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}
        >
          Yumiko Oka — Antler
        </h2>
        <p style={{ fontSize: '0.8rem', color: S.slate400, margin: 0, lineHeight: 1.5 }}>
          Program Manager · Residency Programs, Portfolio Management &amp; Investor Relations
          <br />
          Background: L&apos;Oréal, Estée Lauder, Rakuten · University of Tsukuba
          <br />
          <span style={{ color: S.green }}>How you got here: Cold LinkedIn outreach → she replied. That&apos;s already a signal.</span>
        </p>
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 14,
            flexWrap: 'wrap',
          }}
        >
          {[
            { text: 'INTRO PITCH', color: S.green },
            { text: 'EARLY-STAGE VC', color: S.blue },
            { text: 'RESIDENCY PROGRAMS', color: S.purple },
            { text: 'PORTFOLIO MGMT & IR', color: S.amber },
          ].map(t => (
            <span
              key={t.text}
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 999,
                background: `${t.color}22`,
                color: t.color,
              }}
            >
              {t.text}
            </span>
          ))}
        </div>
      </div>

      {/* ── WHO YOU'RE MEETING ────────────────────────────────── */}
      <div style={{
        ...sectionCard(S.blue),
        background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, var(--bg-card) 100%)',
      }}>
        <div style={{ ...label, color: S.blue }}>UNDERSTAND HER ROLE</div>
        <div style={sectionTitle}>Who You&apos;re Meeting</div>
        <ul style={{ ...body, paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>
            Yumiko runs Residency programs and co-oversees portfolio management &amp; investor
            relations. <strong style={{ color: 'var(--text-primary)' }}>She is not a GP — she
            does not write the cheques.</strong> Her job is to find and develop great founders, then
            connect the best ones to the investment team.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>The goal isn&apos;t to close investment.</strong>{' '}
            The goal is to make Yumiko want to champion you internally. She replied to a cold
            message — she&apos;s already curious. Your job is to make her feel like she discovered
            someone special.
          </li>
          <li>
            Her corporate background (L&apos;Oréal, Estée Lauder, Rakuten) means she&apos;s worked
            inside large multinational corporations with exactly the kind of corp dev and strategy
            apparatus you&apos;re targeting.{' '}
            <strong style={{ color: 'var(--text-primary)' }}>She&apos;ll immediately understand
            the buyer persona — she&apos;s lived inside one.</strong>
          </li>
        </ul>
      </div>

      {/* ── ANTLER CONTEXT ────────────────────────────────────── */}
      <div style={sectionCard(S.purple)}>
        <div style={{ ...label, color: S.purple }}>KNOW THIS GOING IN</div>
        <div style={sectionTitle}>Antler Context</div>
        <ul style={{ ...body, paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>$510M in new global funds</strong>{' '}
            (January 2026), half earmarked for US founders. New San Francisco residency actively
            expanding — directly aligns with your US-first strategy.
          </li>
          <li>
            Spring 2025 London residency invested{' '}
            <strong style={{ color: 'var(--text-primary)' }}>£1.7M across 14 AI startups</strong>.
            UK cohort is active.
          </li>
          <li>
            Antler invests at pre-seed (idea → MVP). You&apos;re at the{' '}
            <strong style={{ color: 'var(--text-primary)' }}>strong end</strong> of their range — you have a
            functioning 190K LOC platform, not just a pitch.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>20–45% of residency founders</strong>{' '}
            receive investment. Residency is free, no equity upfront — Antler invests after the
            cohort if they believe in you.
          </li>
          <li>
            Their 2025 AI portfolio leans enterprise: compliance, legal, financial, reliability
            infrastructure.{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Decision Intel fits that pattern cleanly.</strong>
          </li>
        </ul>
      </div>

      {/* ── 90-SECOND VERBAL HOOK ─────────────────────────────── */}
      <div style={{
        ...sectionCard(S.green),
        background: 'linear-gradient(135deg, rgba(22,163,74,0.08) 0%, var(--bg-card) 100%)',
      }}>
        <div style={{ ...label, color: S.green }}>PRACTISE THIS OUT LOUD TONIGHT</div>
        <div style={sectionTitle}>Your 90-Second Verbal Hook</div>
        <p style={{ ...body, marginBottom: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          This is for when she says &ldquo;tell me about it, just talk me through it.&rdquo;
          Don&apos;t read slides. Go: problem → why now → why you → ask.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ ...label, color: S.amber, marginBottom: 4 }}>THE PROBLEM (20s)</div>
            <div style={{ ...scriptLine, borderLeft: `3px solid ${S.amber}` }}>
              &ldquo;70 to 90 percent of M&amp;A deals destroy shareholder value. Not because of bad
              data — the data is usually fine. Because of bad reasoning. Anchoring bias, confirmation
              bias, groupthink — these are predictable, well-documented cognitive errors. And nobody
              audits for them. Every memo gets a financial review, a legal review, a compliance
              review. Nobody reviews the quality of the thinking itself.&rdquo;
            </div>
          </div>
          <div>
            <div style={{ ...label, color: S.blue, marginBottom: 4 }}>WHY NOW (20s)</div>
            <div style={{ ...scriptLine, borderLeft: `3px solid ${S.blue}` }}>
              &ldquo;LLMs made this possible for the first time. You couldn&apos;t automate bias
              detection before because it requires reading a 40-page memo, understanding the
              argument structure, and stress-testing the reasoning against 20 different cognitive
              biases simultaneously. That used to take a team of psychologists and a week. We do it
              in under 60 seconds.&rdquo;
            </div>
          </div>
          <div>
            <div style={{ ...label, color: S.green, marginBottom: 4 }}>WHY ME (25s)</div>
            <div style={{ ...scriptLine, borderLeft: `3px solid ${S.green}` }}>
              &ldquo;I published a research paper connecting cognitive bias to the 2008 financial
              crisis — that proved the problem exists at a systemic level. Then I built Decision
              Intel to fix it. 190,000 lines of production TypeScript, solo, at 16. A 12-node AI
              pipeline that detects 20-plus biases, measures decision noise with a three-judge
              statistical jury, maps to 7 compliance frameworks, and — the feature I&apos;m most
              proud of — surfaces the diligence questions your memo never asks, drawn from
              comparable historical decisions. My advisor is Josh Rainer, a senior consultant who
              helped take Wiz from startup to 32 billion. He&apos;s committed 10 to 15 warm Fortune
              500 intros for Q2.&rdquo;
            </div>
          </div>
          <div>
            <div style={{ ...label, color: S.purple, marginBottom: 4 }}>THE ASK (15s)</div>
            <div style={{ ...scriptLine, borderLeft: `3px solid ${S.purple}` }}>
              &ldquo;I&apos;m looking at Antler&apos;s UK and SF residency cohorts this summer.
              I&apos;d love your honest read on whether this is a fit — and if it is, who on the
              investment team I should be speaking with.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* ── KEY NUMBERS ───────────────────────────────────────── */}
      <div style={sectionCard(S.amber)}>
        <div style={{ ...label, color: S.amber }}>DROP THESE NATURALLY</div>
        <div style={sectionTitle}>Key Numbers</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { num: '190K', label: 'Lines of TypeScript' },
            { num: '<60s', label: 'Time to full audit' },
            { num: '~97%', label: 'Gross margins' },
            { num: '$0.03', label: 'Cost per analysis' },
            { num: '20+', label: 'Cognitive biases' },
            { num: '12', label: 'Pipeline nodes' },
            { num: '$8.2M', label: 'Avg diligence gap cost' },
            { num: '$510M', label: 'Antler new funds (Jan 2026)' },
          ].map(s => (
            <div key={s.label} style={statBox}>
              <div style={statNum}>{s.num}</div>
              <div style={statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MEETING AGENDA ────────────────────────────────────── */}
      <div style={sectionCard(S.purple)}>
        <div style={{ ...label, color: S.purple }}>SUGGESTED FLOW — ~20 MIN TOTAL</div>
        <div style={sectionTitle}>Meeting Agenda</div>
        <ol
          style={{
            ...body,
            paddingLeft: 20,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Open — Make it personal</strong> (2 min)
            <br />
            Thank her genuinely for replying. Ask one question about her before pitching:{' '}
            <em>&ldquo;You work across Japan and global programs — how do you think about where
            the most interesting founders are coming from right now?&rdquo;</em>{' '}
            Shows you&apos;re curious about her perspective, not just there to pitch.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>The problem — Lead with this, not the product</strong> (2–3 min)
            <br />
            &ldquo;70–90% of M&amp;A deals destroy value. Not because of bad data. Because of bad
            reasoning — and nobody audits for it.&rdquo; She&apos;ll get it immediately given her
            corporate background.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Your founder story — This is your edge</strong> (1–2 min)
            <br />
            16 years old, solo built 190K lines of production TypeScript, published academic
            research paper connecting cognitive bias to the 2008 financial crisis — the paper proved
            the problem, Decision Intel is the product.{' '}
            <strong style={{ color: S.amber }}>Don&apos;t rush this. Antler invests in founders
            first, products second.</strong>
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Walk the deck</strong> (5–7 min)
            <br />
            Problem → Product → Market → Traction/Validation → Team (you + Josh Rainer) → Ask.
            Don&apos;t read the slides — talk through them. Pause on the product slides for the
            live demo: upload sample memo → pipeline graph (wow moment) → DQI score reveal →
            2–3 biases with excerpts → <strong>Forgotten Questions</strong> tab →
            Boardroom Simulation.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>The ask — Be specific</strong> (1 min)
            <br />
            Don&apos;t end with &ldquo;so yeah, that&apos;s Decision Intel.&rdquo; End with the
            direct ask (see close section below).
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Her questions — Listen hard</strong> (5–10 min)
            <br />
            What she probes on tells you exactly what Antler looks for and where your story has
            gaps. Take mental notes.
          </li>
        </ol>
      </div>

      {/* ── QUESTIONS TO ASK HER ──────────────────────────────── */}
      <div style={sectionCard(S.blue)}>
        <div style={{ ...label, color: S.blue }}>HAVE THESE READY</div>
        <div style={sectionTitle}>Questions to Ask Her</div>
        <div>
          {[
            {
              q: '"What separates the founders Antler backs from the ones who don\'t get investment?"',
              why: 'Gets you inside her evaluation lens. Makes her articulate what she values — then you can map your story to it.',
            },
            {
              q: '"Decision Intel already has an MVP and early validation from a senior consultant who worked on the Wiz deal. Does that change how you\'d think about residency fit, or is earlier always better for Antler?"',
              why: 'Proactively addresses "are you too late for Antler?" before it becomes an objection.',
            },
            {
              q: '"What does the next UK and SF cohort timeline look like?"',
              why: 'Practical, shows you\'re serious and ready to commit.',
            },
            {
              q: '"What\'s the most common mistake you see founders make in their first meeting with you?"',
              why: 'Slightly disarming, builds rapport, and gives you live coaching you can act on immediately.',
            },
          ].map((item, i) => (
            <div key={i} style={{ ...qaRow, borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={qText}>{item.q}</div>
              <div style={{ ...aText, fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Why: {item.why}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LIKELY OBJECTIONS ─────────────────────────────────── */}
      <div style={sectionCard(S.red)}>
        <div style={{ ...label, color: S.red }}>HANDLE THESE CALMLY</div>
        <div style={sectionTitle}>Likely Objections &amp; Your Responses</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            {
              obj: '"You\'re very young — can you execute enterprise sales?"',
              resp: '"That\'s exactly why Josh Rainer is on the team — he helped take Wiz to $32B and has committed 10–15 warm Fortune 500 intros for Q2. I build the product, he opens the doors."',
            },
            {
              obj: '"Corp dev at Fortune 500 is a long sales cycle"',
              resp: '"The free pilot bypasses procurement entirely — a VP runs their next live deal memo through the platform, no credit card, no commitment. First 5 pilots close Q2."',
            },
            {
              obj: '"Is this the right stage for Antler?"',
              resp: '"I have the product. I need the network and GTM support to land the first pilots. That\'s exactly what the residency provides."',
            },
            {
              obj: '"You\'re in the UK — are you open to SF?"',
              resp: '"Absolutely. My US-first strategy means SF is actually ideal."',
            },
          ].map((item, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ ...qText, color: S.red }}>{item.obj}</div>
              <div style={aText}>{item.resp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DOS AND DON'TS ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={sectionCard(S.green)}>
          <div style={{ ...label, color: S.green }}>DO</div>
          <ul style={{ ...body, paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Thank her for replying — acknowledge the cold outreach honestly</li>
            <li>Ask about her before pitching — show curiosity</li>
            <li>Lead with the problem, not the product</li>
            <li>Tell your founder story — Antler invests in founders first</li>
            <li>Let the demo speak — pause after the DQI score reveal</li>
            <li>Be honest about being pre-revenue</li>
            <li>End with a specific ask (residency fit + investment team intro)</li>
            <li>Follow up within 24 hours</li>
          </ul>
        </div>
        <div style={sectionCard(S.red)}>
          <div style={{ ...label, color: S.red }}>DON&apos;T</div>
          <ul style={{ ...body, paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Don&apos;t apologize for your age — lead with the product</li>
            <li>Don&apos;t read your slides — talk through them</li>
            <li>Don&apos;t oversell traction you don&apos;t have</li>
            <li>Don&apos;t get lost in technical details (pipeline nodes, etc.)</li>
            <li>Don&apos;t talk for more than 2 minutes without asking a question</li>
            <li>Don&apos;t end with &ldquo;so yeah, that&apos;s Decision Intel&rdquo;</li>
            <li>Don&apos;t forget: she&apos;s not the GP — make her want to champion you</li>
          </ul>
        </div>
      </div>

      {/* ── THE ASK ───────────────────────────────────────────── */}
      <div
        style={{
          ...sectionCard(S.green),
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08) 0%, var(--bg-card) 100%)',
        }}
      >
        <div style={{ ...label, color: S.green }}>BE DIRECT — END WITH THIS</div>
        <div style={sectionTitle}>Your Close</div>
        <div
          style={{
            ...body,
            background: 'var(--bg-elevated)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            borderLeft: `3px solid ${S.green}`,
            fontStyle: 'italic',
            fontSize: '0.85rem',
          }}
        >
          &ldquo;I&apos;m actively looking at Antler&apos;s UK and SF residency cohorts for this
          summer. Given what you&apos;ve seen today, do you think Decision Intel is a fit — and if
          so, is there someone on the investment team I should be speaking with?&rdquo;
        </div>
        <p style={{ ...body, marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          That&apos;s two questions in one: get her read on fit, and request the warm intro in
          the same breath.
        </p>
      </div>

      {/* ── ONE THING TO FIX ──────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: `2px solid ${S.amber}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        textAlign: 'center',
      }}>
        <div style={{ ...label, color: S.amber, marginBottom: 6 }}>TONIGHT</div>
        <p style={{ ...body, margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
          Practise the 90-second verbal hook once, out loud.
        </p>
        <p style={{ ...body, margin: '4px 0 0', fontSize: '0.78rem' }}>
          Problem → Why now → Why you → Ask. No slides, no screen — just you talking.
        </p>
      </div>
    </div>
  );
}
