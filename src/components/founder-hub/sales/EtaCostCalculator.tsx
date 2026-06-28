'use client';

/**
 * EtaCostCalculator — the DECISION COST tool for live ETA sales calls.
 *
 * The reframe (founder's job-to-be-done crystallization, 2026-06-28): the cost
 * that hurts isn't the deal you close — it's the months, fees, and optionality
 * poured into the deals that DIED. That is "decision cost", and it's denominated
 * in the searcher's own currency (QoE, legal, advisor time, forgone salary),
 * not in "bias". You screen-share this, punch in THEIR funnel, and let them
 * total it out loud — self-persuasion creates urgency; being told creates
 * resistance.
 *
 * Guardrail discipline (load-bearing): the frame-back is CONDITIONAL on the
 * user's OWN numbers ("IF catching one dead deal before the QoE spend"), NEVER
 * a fabricated efficacy rate ("DI cuts your dead-deal cost 50%"). Decision Intel
 * surfaces risk indicators correlated with bad outcomes — it cannot promise to
 * catch a specific miss, and the copy says so (same epistemic-honesty discipline
 * as the retired failure-rate stat). The PG exposure on the deal you DO sign
 * stays as a secondary block (the winner's-curse half of decision cost), capped
 * at the real SBA 7(a) acquisition reality ($5M). USD throughout; labelled an
 * illustration, not financial advice.
 */

import { useState, type ReactNode } from 'react';

const SBA_ACQUISITION_CAP = 5_000_000; // real SBA 7(a) acquisition cap (NOT $10M)

const fmt = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

interface NumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}
function NumField({ label, value, onChange, step = 1 }: NumFieldProps) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(Number(e.target.value) || 0)}
        style={{
          width: '100%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 10px',
          fontSize: 14,
          fontVariantNumeric: 'tabular-nums',
        }}
      />
    </label>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
}
function RangeField({ label, value, onChange, min, max, suffix = '%' }: RangeFieldProps) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
        />
        <span
          style={{
            fontWeight: 700,
            color: 'var(--text-primary)',
            minWidth: 44,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
          {suffix}
        </span>
      </span>
    </label>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        margin: '18px 0 8px',
      }}
    >
      {children}
    </div>
  );
}

function ResultCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'bad' | 'warn' | 'neutral';
}) {
  const color =
    tone === 'bad' ? 'var(--error)' : tone === 'warn' ? 'var(--warning)' : 'var(--text-primary)';
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      <div
        style={{
          fontSize: 23,
          fontWeight: 800,
          color,
          marginTop: 3,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>
    </div>
  );
}

export function EtaCostCalculator() {
  // the deals that die — the decision-cost drain (the lead frame)
  const [dead, setDead] = useState(3);
  const [broken, setBroken] = useState(12_000);
  const [months, setMonths] = useState(8);
  const [salary, setSalary] = useState(200_000);
  // the one you sign — the winner's-curse half (secondary)
  const [ebitda, setEbitda] = useState(1_500_000);
  const [mult, setMult] = useState(4);
  const [overstate, setOverstate] = useState(25);
  const [inj, setInj] = useState(10);
  const [cash, setCash] = useState(50);
  const [price, setPrice] = useState(249);

  // decision cost of the deals that died
  const deadDrain = dead * broken;
  const timeCost = (salary / 12) * months;
  const decisionCostSoFar = deadDrain + timeCost;

  // exposure on the one you close
  const ev = ebitda * mult;
  const overpay = mult * (ebitda * (overstate / 100));
  const injection = ev * (inj / 100);
  const personalCash = injection * (cash / 100);
  const pg = Math.min(Math.max(ev - injection, 0), SBA_ACQUISITION_CAP);

  // the price + the CONDITIONAL frame-back (one avoided dead deal vs a year of DI)
  const annual = price * 12;
  const oneAvoidedPayback = annual > 0 ? broken / annual : 0;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: '2px solid var(--accent-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
        }}
      >
        Decision Cost calculator · screen-share on the call
      </div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          margin: '8px 0 0',
        }}
      >
        The cost that hurts isn&rsquo;t the deal you close — it&rsquo;s the months and fees you pour
        into the deals that <strong style={{ color: 'var(--text-primary)' }}>die</strong>. Punch in{' '}
        <em>their</em> funnel and let them total it out loud. A $10&ndash;15k QoE audits the{' '}
        <em>seller&rsquo;s</em> numbers; this is about the part that decides whether you ever wire a
        dollar &mdash; your read on the deal.
      </p>

      {/* inputs — the deals that die (lead) */}
      <SectionLabel>The deals that die</SectionLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px 20px',
        }}
      >
        <NumField label="Deals that died after diligence" value={dead} onChange={setDead} />
        <NumField
          label="Out-of-pocket per dead deal ($)"
          value={broken}
          onChange={setBroken}
          step={2_500}
        />
        <NumField label="Months searching so far" value={months} onChange={setMonths} />
        <NumField
          label="Prior annual salary / opp. cost ($)"
          value={salary}
          onChange={setSalary}
          step={10_000}
        />
      </div>

      {/* inputs — the one you sign (secondary) */}
      <SectionLabel>The one you sign</SectionLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px 20px',
        }}
      >
        <NumField
          label="Claimed EBITDA / SDE ($)"
          value={ebitda}
          onChange={setEbitda}
          step={50_000}
        />
        <NumField label="Purchase multiple (×)" value={mult} onChange={setMult} step={0.5} />
        <RangeField
          label="EBITDA overstatement to test"
          value={overstate}
          onChange={setOverstate}
          min={0}
          max={40}
        />
        <RangeField
          label="Equity injection (% of price)"
          value={inj}
          onChange={setInj}
          min={5}
          max={30}
        />
        <RangeField
          label="Of that, your own cash"
          value={cash}
          onChange={setCash}
          min={0}
          max={100}
        />
        <NumField label="Decision Intel price ($/mo)" value={price} onChange={setPrice} step={10} />
      </div>

      {/* headline — the decision cost already behind them */}
      <div
        style={{
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <ResultCard
          label="Decision cost already behind you"
          value={fmt(decisionCostSoFar)}
          sub="dead-deal spend + forgone salary while searching"
          tone="bad"
        />
      </div>

      {/* results — the two halves */}
      <SectionLabel>Where it went</SectionLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        <ResultCard
          label="Dead-deal diligence drain"
          value={fmt(deadDrain)}
          sub="dead deals × out-of-pocket each"
          tone="bad"
        />
        <ResultCard
          label="Forgone salary while searching"
          value={fmt(timeCost)}
          sub="opportunity cost of the months"
          tone="warn"
        />
        <ResultCard
          label="Overpayment if EBITDA is off"
          value={fmt(overpay)}
          sub="on the one you DO close"
          tone="warn"
        />
        <ResultCard
          label="Personal-guarantee exposure"
          value={'up to ' + fmt(pg)}
          sub={'your cash at risk: ' + fmt(personalCash)}
          tone="bad"
        />
      </div>

      {/* verdict — CONDITIONAL frame-back on THEIR numbers, never a fabricated rate */}
      <div
        style={{
          marginTop: 16,
          background: 'color-mix(in srgb, var(--accent-primary) 7%, var(--bg-card))',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 28%, var(--border-color))',
          borderRadius: 'var(--radius-md)',
          padding: '15px 18px',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--text-primary)',
        }}
      >
        A year of Decision Intel is{' '}
        <strong style={{ color: 'var(--accent-primary)' }}>{fmt(annual)}</strong>. Catch{' '}
        <strong>one</strong> dead deal before the <strong>{fmt(broken)}</strong> diligence spend, or
        walk a week earlier on the months you&rsquo;d have burned, and you&rsquo;ve covered{' '}
        <strong>{oneAvoidedPayback.toFixed(1)}×</strong> the subscription. The{' '}
        <strong>{fmt(decisionCostSoFar)}</strong> already behind you is the price of searching
        without a second set of eyes.
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
        A what-if on your own numbers, not financial advice and not a promise: Decision Intel
        surfaces the risk indicators a committee would pressure-test before committing capital; it
        can&rsquo;t guarantee it catches a specific miss. Decision cost = dead-deal spend + forgone
        salary; PG exposure caps the display at the real SBA 7(a) acquisition reality (up to $5M).
        Let the prospect input their own funnel and say the number &mdash; never lead with the
        price.
      </p>
    </div>
  );
}
