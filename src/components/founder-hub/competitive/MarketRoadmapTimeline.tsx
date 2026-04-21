'use client';

import { motion } from 'framer-motion';
import { Rocket, TrendingUp, DollarSign } from 'lucide-react';
import {
  EXPANSION_ROADMAP,
  MARKET_SIZE,
  PRICING_RATIONALE,
} from '@/lib/data/competitive-positioning';

export function MarketRoadmapTimeline() {
  return (
    <div>
      {/* Market size + Pricing stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #16A34A',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrendingUp size={14} style={{ color: '#16A34A' }} />
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
              }}
            >
              Market Size
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 10,
              lineHeight: 1,
            }}
          >
            {MARKET_SIZE.headline}
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            {MARKET_SIZE.stats.map(s => (
              <li
                key={s}
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  paddingLeft: 14,
                  position: 'relative',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#16A34A',
                    opacity: 0.7,
                  }}
                />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            padding: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '3px solid #8B5CF6',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <DollarSign size={14} style={{ color: '#8B5CF6' }} />
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#8B5CF6',
              }}
            >
              Pricing Rationale
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 10,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
            }}
          >
            {PRICING_RATIONALE.headline}
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-muted)',
              }}
            >
              {PRICING_RATIONALE.unit}
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            {PRICING_RATIONALE.points.map(p => (
              <li
                key={p}
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  paddingLeft: 14,
                  position: 'relative',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#8B5CF6',
                    opacity: 0.7,
                  }}
                />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Roadmap timeline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Rocket size={14} style={{ color: '#16A34A' }} />
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          Expansion Roadmap
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
        }}
      >
        {EXPANSION_ROADMAP.map((item, i) => (
          <motion.div
            key={item.year}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 * i }}
            style={{
              position: 'relative',
              padding: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderTop: `3px solid ${item.color}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.year}</span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 7px',
                  borderRadius: 3,
                  background: `${item.color}18`,
                  color: item.color,
                  border: `1px solid ${item.color}40`,
                }}
              >
                {item.status}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
                lineHeight: 1.25,
              }}
            >
              {item.market}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {item.details}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
