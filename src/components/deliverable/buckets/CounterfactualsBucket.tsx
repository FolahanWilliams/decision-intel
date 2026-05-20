/**
 * CounterfactualsBucket — Bucket 4 of the MECE structure.
 * "What to fix" — interactive what-if scenarios + Munger inversion.
 *
 * The ScenarioSlider is the hero; toggling scenarios recomputes the
 * projected DQI in real time. Below it, the Munger inversion list
 * surfaces the failure-mode actions to AVOID — same content as the
 * existing inversion field on AnalysisResult.preMortem.inversion.
 */

'use client';

import { TriangleAlert } from 'lucide-react';
import type { CounterfactualsBucket as CounterfactualsBucketType } from '@/lib/deliverable/types';
import { ActionTitle } from '../ActionTitle';
import { ScenarioSlider } from '../ScenarioSlider';

interface CounterfactualsBucketProps {
  bucket: CounterfactualsBucketType;
}

export function CounterfactualsBucket({ bucket }: CounterfactualsBucketProps) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ActionTitle
        eyebrow="What to fix"
        accessory={
          bucket.scenarios.length > 0 ? (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--accent-primary, #16A34A)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {bucket.scenarios.length} mitigation paths
            </span>
          ) : null
        }
      >
        {bucket.actionTitle}
      </ActionTitle>

      <ScenarioSlider currentDqi={bucket.currentDqi} scenarios={bucket.scenarios} />

      {bucket.inversionFailureModes.length > 0 ? (
        <div
          style={{
            background: 'var(--bg-card, #FFFFFF)',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderLeft: '3px solid var(--severity-high, #ef4444)',
            borderRadius: 10,
            padding: '14px 18px 16px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--severity-high, #ef4444)',
              marginBottom: 10,
            }}
          >
            <TriangleAlert size={12} />
            Munger inversion · actions that guarantee failure
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {bucket.inversionFailureModes.map((mode, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  fontSize: 13.5,
                  color: 'var(--text-primary, #0F172A)',
                  lineHeight: 1.55,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background: 'rgba(239,68,68,0.10)',
                    color: 'var(--severity-high, #ef4444)',
                    fontSize: 10.5,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 2,
                  }}
                >
                  {idx + 1}
                </span>
                <span>{mode}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
