'use client';

/**
 * EtaCostCalculator — the cost-of-inaction tool for live ETA sales calls.
 *
 * The motion (from the ETA sales-playbook research pack): you do NOT pitch the
 * price. You screen-share this, punch in THEIR real deal, and let the risk
 * numbers dwarf the £249. Self-persuasion creates urgency; being told creates
 * resistance — so the prospect says the number out loud, not you.
 *
 * Lock discipline baked in: the PG exposure caps at the real SBA 7(a)
 * acquisition reality ($5M), the verdict is value-at-stake from the user's OWN
 * inputs (never a fabricated "pays for itself 50×" multiple), and it is
 * labelled an illustration, not financial advice. USD throughout — the deal
 * economics (SBA / multiples) are US-shaped; the price line is the $249/£249
 * Individual tier.
 */

import { useState } from 'react';

const SBA_ACQUISITION_CAP = 5_000_000; // real SBA 7(a) acquisition cap (NOT $10M)

const fmt = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

const fmtPct = (n: number) => (n < 1 ? n.toFixed(2) : n.toFixed(1)) + '%';

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
  const [ebitda, setEbitda] = useState(1_500_000);
  const [mult, setMult] = useState(4);
  const [overstate, setOverstate] = useState(25);
  const [inj, setInj] = useState(10);
  const [cash, setCash] = useState(50);
  const [months, setMonths] = useState(8);
  const [salary, setSalary] = useState(200_000);
  const [dead, setDead] = useState(2);
  const [broken, setBroken] = useState(20_000);
  const [price, setPrice] = useState(249);

  const ev = ebitda * mult;
  const overpay = mult * (ebitda * (overstate / 100));
  const injection = ev * (inj / 100);
  const personalCash = injection * (cash / 100);
  const pg = Math.min(Math.max(ev - injection, 0), SBA_ACQUISITION_CAP);
  const brokenTotal = dead * broken;
  const timeCost = (salary / 12) * months;
  const annual = price * 12;
  const pctOfOverpay = overpay > 0 ? (annual / overpay) * 100 : 0;

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
        Cost-of-inaction calculator · screen-share on the call
      </div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          margin: '8px 0 0',
        }}
      >
        Punch in <em>their</em> real deal and let them say the number out loud. The whole move:{' '}
        <strong style={{ color: 'var(--text-primary)' }}>
          they calculate what the problem already costs them
        </strong>{' '}
        — then £249 is a rounding error. You pay $10–15k for a QoE to audit the{' '}
        <em>seller&rsquo;s</em> numbers; this audits the part that signs the personal guarantee —
        your reasoning about them.
      </p>

      {/* inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px 20px',
          marginTop: 16,
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
        <NumField label="Months searching so far" value={months} onChange={setMonths} />
        <NumField
          label="Prior annual salary / opp. cost ($)"
          value={salary}
          onChange={setSalary}
          step={10_000}
        />
        <NumField label="Dead deals reaching diligence" value={dead} onChange={setDead} />
        <NumField
          label="Cost per broken deal ($)"
          value={broken}
          onChange={setBroken}
          step={2_500}
        />
        <NumField label="Decision Intel price ($/mo)" value={price} onChange={setPrice} step={10} />
      </div>

      {/* results */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <ResultCard
          label="Enterprise value (what they'd pay)"
          value={fmt(ev)}
          sub="EBITDA × multiple"
          tone="neutral"
        />
        <ResultCard
          label="Overpayment if EBITDA is overstated"
          value={fmt(overpay)}
          sub="multiple × phantom earnings"
          tone="bad"
        />
        <ResultCard
          label="Your personal cash wiped if it fails"
          value={fmt(personalCash)}
          sub="the part that's literally your savings"
          tone="bad"
        />
        <ResultCard
          label="Personal-guarantee exposure"
          value={'up to ' + fmt(pg)}
          sub="unlimited — home, savings, wages"
          tone="bad"
        />
        <ResultCard
          label="Already sunk on dead-deal diligence"
          value={fmt(brokenTotal)}
          sub="dead deals × cost each"
          tone="warn"
        />
        <ResultCard
          label="Forgone salary while searching"
          value={fmt(timeCost)}
          sub="opportunity cost so far"
          tone="warn"
        />
      </div>

      {/* verdict — value-at-stake from THEIR inputs, never a fabricated multiple */}
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
        <strong style={{ color: 'var(--accent-primary)' }}>{fmt(annual)}</strong> — about{' '}
        <strong>{fmtPct(pctOfOverpay)}</strong> of what you&rsquo;d overpay if the EBITDA is off{' '}
        <strong>{overstate}%</strong>, and less than one <strong>{fmt(broken)}</strong> broken-deal
        QoE. If it stops one bad LOI before you anchor on the price, the exposure it just flagged on{' '}
        <em>this</em> deal already dwarfs the subscription.
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
        Transparent illustration, not financial advice. Overpayment = multiple × (EBITDA ×
        overstatement). PG exposure caps the display at the real SBA 7(a) acquisition reality (up to
        $5M), not the cumulative $10M stacking limit. The point is the prospect inputs their own
        deal and says the number — never lead with the price.
      </p>
    </div>
  );
}
