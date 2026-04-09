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
  slate900: '#0F172A',
  slate600: '#475569',
  slate400: '#94A3B8',
  slate100: '#F1F5F9',
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
        <div style={{ ...label, color: S.green }}>MEETING PREP — LIVE CHEAT SHEET</div>
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
        <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
          Program Manager · Corporate Innovation &amp; Venture Building at Ibex · Tokyo
          <br />
          Background: L&apos;Oréal, Estée Lauder, Rakuten · University of Tsukuba · Connected
          via Andrew Goldner
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 14,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(22,163,74,0.15)',
              color: S.green,
            }}
          >
            EARLY-STAGE VC
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(59,130,246,0.15)',
              color: S.blue,
            }}
          >
            RESIDENCY PROGRAMS
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(139,92,246,0.15)',
              color: S.purple,
            }}
          >
            CORPORATE BACKGROUND
          </span>
        </div>
      </div>

      {/* ── WHY SHE MATTERS ───────────────────────────────────── */}
      <div style={sectionCard(S.blue)}>
        <div style={sectionTitle}>Why This Meeting Matters</div>
        <ul style={{ ...body, paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Antler is a global startup generator</strong>{' '}
            — they invest at pre-seed and run residency programs. If she sees product-market fit signal, it
            could mean residency placement, funding, or warm intros to their LP network.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Her corporate background</strong> (L&apos;Oréal,
            Estée Lauder, Rakuten) means she personally understands corporate decision-making pain. She
            doesn&apos;t need to imagine the ICP — she lived it.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Connected via Andrew Goldner</strong> — the
            same advisor who helped shape the pivot to corporate strategy/M&amp;A. Warm intro context.
          </li>
        </ul>
      </div>

      {/* ── 30-SECOND PITCH ───────────────────────────────────── */}
      <div style={sectionCard(S.green)}>
        <div style={{ ...label, color: S.green }}>MEMORIZE THIS</div>
        <div style={sectionTitle}>Your 30-Second Pitch</div>
        <div
          style={{
            ...body,
            background: 'var(--bg-elevated)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            borderLeft: `3px solid ${S.green}`,
            fontStyle: 'italic',
          }}
        >
          &ldquo;M&amp;A teams make billion-dollar decisions based on memos that nobody
          stress-tests. Decision Intel is the first platform that audits a strategic document for
          cognitive bias, decision noise, and missing diligence questions — in under 60 seconds.
          We surface the questions your memo never asks, drawn from comparable historical
          decisions. Think of it as Grammarly for strategic decisions — except the mistakes we
          catch cost $8M on average, not a typo.&rdquo;
        </div>
      </div>

      {/* ── KEY NUMBERS ───────────────────────────────────────── */}
      <div style={sectionCard(S.amber)}>
        <div style={{ ...label, color: S.amber }}>DROP THESE NATURALLY</div>
        <div style={sectionTitle}>Key Numbers</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { num: '~97%', label: 'Gross margins' },
            { num: '<60s', label: 'Time to full audit' },
            { num: '$0.03–0.07', label: 'Cost per analysis' },
            { num: '20+', label: 'Cognitive biases' },
            { num: '146', label: 'Historical case studies' },
            { num: '12', label: 'Pipeline nodes' },
            { num: '7', label: 'Compliance frameworks' },
            { num: '$8.2M', label: 'Avg diligence gap cost' },
          ].map(s => (
            <div key={s.label} style={statBox}>
              <div style={statNum}>{s.num}</div>
              <div style={statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DEMO FLOW ─────────────────────────────────────────── */}
      <div style={sectionCard(S.purple)}>
        <div style={{ ...label, color: S.purple }}>YOUR DECK + LIVE DEMO SCRIPT</div>
        <div style={sectionTitle}>Meeting Flow</div>
        <ol
          style={{
            ...body,
            paddingLeft: 20,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Open with the pain</strong> (2 min)
            — &ldquo;Have you ever seen a deal close that everyone felt great about, only to
            discover 6 months later that the diligence missed something obvious?&rdquo; Let her
            answer. Her L&apos;Oréal/Estée Lauder background means she&apos;s seen this.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Walk the pitch deck</strong> (8–10
            min) — Problem → Solution → Product → Market → Business Model → Traction → Ask. Pause
            on the product slides for the live demo.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Live demo</strong> (5 min) — Upload
            the sample memo → Watch the pipeline run (the live graph is the wow moment) → DQI
            score reveal (pause for effect) → Walk through 2–3 biases with excerpts → Show the{' '}
            <strong>Forgotten Questions</strong> tab — &ldquo;These are the questions the memo
            never asked.&rdquo; → Show the Boardroom Simulation.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Close</strong> (3 min) — &ldquo;We&apos;re
            looking for our first design partner. I&apos;d love your perspective on whether
            Antler sees this kind of decision quality tooling as a category.&rdquo;
          </li>
        </ol>
      </div>

      {/* ── WHAT TO EMPHASIZE FOR ANTLER ──────────────────────── */}
      <div style={sectionCard(S.green)}>
        <div style={{ ...label, color: S.green }}>TAILORED FOR ANTLER</div>
        <div style={sectionTitle}>What to Emphasize</div>
        <ul style={{ ...body, paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Solo founder who built the entire platform.</strong>{' '}
            Antler invests in founders, not just ideas. 199K+ lines of production TypeScript,
            solo. That&apos;s the signal.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Category creation, not feature competition.</strong>{' '}
            No one is doing decision quality auditing. Closest is Cloverpop (acquired 2023, no
            bias detection). The real competition is &ldquo;do nothing.&rdquo;
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>The Knowledge Graph compounds.</strong>{' '}
            Every decision makes the platform smarter. This is the moat — not features, not
            prompts, but org-specific calibration data that can&apos;t transfer to a competitor.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Corporate → enterprise expansion path.</strong>{' '}
            Land with corp dev/M&amp;A teams ($2,499/mo), expand to PE/VC, financial services,
            government. $12.2B → $46.4B decision intelligence market by 2030.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Advised by the person who helped scale Wiz to $32B.</strong>{' '}
            Not just a kid building in a room — connected to enterprise GTM expertise.
          </li>
        </ul>
      </div>

      {/* ── LIKELY QUESTIONS ──────────────────────────────────── */}
      <div style={sectionCard(S.red)}>
        <div style={{ ...label, color: S.red }}>PREPARE FOR THESE</div>
        <div style={sectionTitle}>Likely Questions &amp; Your Answers</div>
        <div>
          {[
            {
              q: '"What traction do you have?"',
              a: 'Pre-revenue — we\'re actively outreaching to corporate strategy and M&A teams for our first design partner. The product is live, fully built, 199K+ lines of TypeScript, 70+ API routes, 200+ components. We\'re offering a free 30-day pilot on a live deal to prove value before asking for budget.',
            },
            {
              q: '"How do you know this is a real problem?"',
              a: 'Kahneman and Sibony proved that decision noise — the random variability in how teams evaluate the same information — costs organizations billions annually. Their insurance underwriter study found 55% variability where executives expected 10%. Nobody audits this. We make it measurable and fixable.',
            },
            {
              q: '"What\'s the go-to-market?"',
              a: 'Free 30-day pilot on a live deal. The Knowledge Graph seeds during the trial — they\'d lose their data by not subscribing. Land with M&A or corp dev VPs who can approve $2,499/mo without procurement. Expand to enterprise ($50K–$200K ACV). Advisor network (Wiz consultant) opens doors.',
            },
            {
              q: '"Why corporate strategy and not PE/VC?"',
              a: 'Andrew Goldner\'s advice — PE/VC has small budgets, relationship-driven buying, and their identity is "our edge is judgment." Bias auditing feels threatening. Corporate M&A teams have defined budgets, use consultants for strategic reviews already, and have accessible VPs who can greenlight pilots.',
            },
            {
              q: '"How is this different from ChatGPT?"',
              a: 'ChatGPT gives one opinion from one model. We use 3 independent judges for noise measurement, a 20×20 bias interaction matrix, 146 historical case studies with outcome correlations, and a Forgotten Questions engine that surfaces diligence gaps from comparable past decisions. Plus compliance mapping, outcome tracking, and an org-specific Knowledge Graph.',
            },
            {
              q: '"What if someone just copies your prompts?"',
              a: 'They can copy prompts but not the 5 proprietary layers above the LLM: compound scoring engine, toxic combination detection, noise decomposition, knowledge graph, and 7 compliance frameworks. And they absolutely cannot copy 18 months of org-specific outcome data. We swap LLM models freely — that\'s by design.',
            },
            {
              q: '"You\'re 16 — can you actually sell to Fortune 500?"',
              a: 'The product sells itself in the demo. We\'re not cold-calling — we lead with a free pilot. The platform does the talking. And I have a senior advisor who helped take Wiz from startup to $32B guiding the enterprise GTM. What I need is a GTM co-founder, and that\'s part of what I\'m looking for.',
            },
            {
              q: '"What are you raising?"',
              a: 'Pre-seed, looking at the $500K–$1.5M range. Milestones: first 10 paying customers, first enterprise contract, first ML hire. The capital goes to sales (GTM co-founder), infrastructure, and getting to $100K ARR.',
            },
            {
              q: '"What do you need from Antler specifically?"',
              a: 'Three things: (1) Perspective on whether Antler sees decision quality tooling as a fundable category, (2) If there\'s a fit with Antler\'s residency or investment model, and (3) Introductions to corporate strategy leaders in Antler\'s portfolio or network who might be design partners.',
            },
          ].map((qa, i) => (
            <div key={i} style={{ ...qaRow, borderBottom: i < 8 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={qText}>{qa.q}</div>
              <div style={aText}>{qa.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DOS AND DON'TS ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={sectionCard(S.green)}>
          <div style={{ ...label, color: S.green }}>DO</div>
          <ul style={{ ...body, paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Let the demo speak — pause after the DQI score reveal</li>
            <li>Reference her corporate background naturally</li>
            <li>Ask her what decision mistakes she&apos;s seen at L&apos;Oréal/Rakuten</li>
            <li>Be honest about being pre-revenue</li>
            <li>Show the Forgotten Questions tab — it&apos;s the killer feature</li>
            <li>Ask for specific intros, not vague &ldquo;help&rdquo;</li>
            <li>Follow up within 24 hours with a thank-you and one specific ask</li>
          </ul>
        </div>
        <div style={sectionCard(S.red)}>
          <div style={{ ...label, color: S.red }}>DON&apos;T</div>
          <ul style={{ ...body, paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Don&apos;t apologize for your age — lead with the product</li>
            <li>Don&apos;t oversell traction you don&apos;t have</li>
            <li>Don&apos;t get lost in technical details (pipeline nodes, etc.)</li>
            <li>Don&apos;t talk for more than 2 minutes without asking a question</li>
            <li>Don&apos;t be defensive about &ldquo;just prompts&rdquo; — redirect to the 5 layers</li>
            <li>Don&apos;t forget to ask what she thinks — her perspective matters</li>
          </ul>
        </div>
      </div>

      {/* ── THE ASK ───────────────────────────────────────────── */}
      <div
        style={{
          ...sectionCard(S.green),
          background: 'linear-gradient(135deg, rgba(22,163,74,0.05) 0%, var(--bg-card) 100%)',
        }}
      >
        <div style={{ ...label, color: S.green }}>END THE MEETING WITH THIS</div>
        <div style={sectionTitle}>Your Close</div>
        <div
          style={{
            ...body,
            background: 'var(--bg-elevated)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            borderLeft: `3px solid ${S.green}`,
            fontStyle: 'italic',
          }}
        >
          &ldquo;Yumiko, I really value your time and perspective. Three things I&apos;d love to
          explore: First, does Antler see decision quality tooling as a fundable category?
          Second, is there a fit with Antler&apos;s residency model for something like this?
          And third, would you be open to introducing me to 1–2 corporate strategy leaders in
          your network who might want to pilot this on a live deal?&rdquo;
        </div>
      </div>
    </div>
  );
}
