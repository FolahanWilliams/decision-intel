'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationResult } from '@/types';
import {
  Briefcase,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Minus,
  Building2,
  Sparkles,
  ChevronRight,
  Users,
  Target,
  Shield,
  Brain,
} from 'lucide-react';

interface BoardroomSimulatorProps {
  simulation: SimulationResult;
}

interface PersonaConfig {
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  borderColor: string;
  description: string;
  avatarInitials: string;
  avatarGradient: string;
}

const PERSONA_CONFIG: Record<string, PersonaConfig> = {
  'Fiscal Conservative': {
    icon: <Briefcase size={20} />,
    color: '#38bdf8',
    bgGradient:
      'linear-gradient(135deg, rgba(56, 189, 248, 0.06) 0%, rgba(56, 189, 248, 0.02) 100%)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
    description: 'Focuses on ROI, cost control, and financial risk',
    avatarInitials: 'FC',
    avatarGradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
  },
  'Aggressive Growth': {
    icon: <TrendingUp size={20} />,
    color: '#a78bfa',
    bgGradient:
      'linear-gradient(135deg, rgba(167, 139, 250, 0.06) 0%, rgba(167, 139, 250, 0.02) 100%)',
    borderColor: 'rgba(167, 139, 250, 0.25)',
    description: 'Prioritizes market capture and competitive advantage',
    avatarInitials: 'AG',
    avatarGradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
  },
  'Compliance Guard': {
    icon: <Shield size={20} />,
    color: '#A3E635',
    bgGradient:
      'linear-gradient(135deg, rgba(163, 230, 53, 0.06) 0%, rgba(163, 230, 53, 0.02) 100%)',
    borderColor: 'rgba(163, 230, 53, 0.25)',
    description: 'Ensures regulatory compliance and risk mitigation',
    avatarInitials: 'CG',
    avatarGradient: 'linear-gradient(135deg, #A3E635, #84cc16)',
  },
};

const VOTE_CONFIG = {
  APPROVE: {
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    icon: <CheckCircle size={16} />,
    label: 'APPROVES',
  },
  REJECT: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    icon: <XCircle size={16} />,
    label: 'REJECTS',
  },
  REVISE: {
    color: '#FBBF24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    icon: <AlertTriangle size={16} />,
    label: 'REQUESTS REVISION',
  },
};

const OVERALL_CONFIG = {
  APPROVED: {
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    icon: <CheckCircle size={28} />,
  },
  REJECTED: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    icon: <XCircle size={28} />,
  },
  MIXED: {
    color: '#FBBF24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    icon: <Minus size={28} />,
  },
};

export function BoardroomSimulator({ simulation }: BoardroomSimulatorProps) {
  const [revealedVotes, setRevealedVotes] = useState<number>(0);
  const [selectedTwin, setSelectedTwin] = useState<number | null>(null);
  const [showConsensus, setShowConsensus] = useState(false);

  // Sequential reveal animation
  useEffect(() => {
    if (!simulation?.twins) return;

    const initTimer = setTimeout(() => {
      setRevealedVotes(0);
      setShowConsensus(false);
    }, 0);

    const timer1 = setTimeout(() => setRevealedVotes(1), 600);
    const timer2 = setTimeout(() => setRevealedVotes(2), 1200);
    const timer3 = setTimeout(() => setRevealedVotes(3), 1800);
    const timer4 = setTimeout(() => setShowConsensus(true), 2400);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [simulation]);

  if (!simulation) {
    return (
      <div className="flex items-center justify-center p-12" style={{ color: 'var(--text-muted)' }}>
        <div className="text-center">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p>Simulation data not available</p>
        </div>
      </div>
    );
  }

  const voteCounts =
    simulation.twins?.reduce(
      (acc, twin) => {
        acc[twin.vote] = (acc[twin.vote] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  const overallConfig = OVERALL_CONFIG[simulation.overallVerdict] || OVERALL_CONFIG['MIXED'];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-elevated)',
          borderRadius: 'var(--liquid-radius)',
          borderTop: '2px solid var(--border-color)',
        }}
      >
        <div style={{ position: 'relative', padding: '24px' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar cluster */}
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                {(simulation.twins || []).slice(0, 3).map((twin, i) => {
                  const config = PERSONA_CONFIG[twin.name] || PERSONA_CONFIG['Fiscal Conservative'];
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: config.avatarGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#0a0a0a',
                        border: '2px solid #080808',
                        marginLeft: i > 0 ? '-10px' : '0',
                        zIndex: 3 - i,
                        position: 'relative',
                      }}
                    >
                      {config.avatarInitials}
                    </motion.div>
                  );
                })}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Virtual Boardroom
                  <Sparkles size={16} style={{ color: 'var(--text-highlight)' }} />
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  AI personas deliberate based on their expertise
                </p>
              </div>
            </div>

            {/* Overall Verdict */}
            <AnimatePresence>
              {showConsensus && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ textAlign: 'right' }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    Board Consensus
                  </div>
                  <motion.div
                    className="flex items-center gap-3"
                    style={{
                      padding: '8px 16px',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: overallConfig.color,
                      backgroundColor: overallConfig.bgColor,
                      border: `1px solid ${overallConfig.color}30`,
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    {overallConfig.icon}
                    {simulation.overallVerdict}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Vote Tally Bar */}
          <div className="mt-6 flex items-center gap-4">
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              Votes
            </span>
            <div
              className="flex-1 flex gap-1 overflow-hidden"
              style={{
                height: '8px',
                background: 'var(--bg-card-hover)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {(() => {
                const totalTwins = simulation.twins?.length || 1;
                return (
                  <>
                    {voteCounts['APPROVE'] > 0 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(voteCounts['APPROVE'] / totalTwins) * 100}%` }}
                        transition={{ delay: 2.5, duration: 0.6, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: '#22c55e',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    )}
                    {voteCounts['REVISE'] > 0 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(voteCounts['REVISE'] / totalTwins) * 100}%` }}
                        transition={{ delay: 2.6, duration: 0.6, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: '#FBBF24',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    )}
                    {voteCounts['REJECT'] > 0 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(voteCounts['REJECT'] / totalTwins) * 100}%` }}
                        transition={{ delay: 2.7, duration: 0.6, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: '#ef4444',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    )}
                  </>
                );
              })()}
            </div>
            <div className="flex gap-3" style={{ fontSize: '11px', flexShrink: 0 }}>
              {voteCounts['APPROVE'] > 0 && (
                <span className="flex items-center gap-1" style={{ color: '#22c55e' }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#22c55e',
                      display: 'inline-block',
                    }}
                  />
                  {voteCounts['APPROVE']}
                </span>
              )}
              {voteCounts['REVISE'] > 0 && (
                <span className="flex items-center gap-1" style={{ color: '#FBBF24' }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#FBBF24',
                      display: 'inline-block',
                    }}
                  />
                  {voteCounts['REVISE']}
                </span>
              )}
              {voteCounts['REJECT'] > 0 && (
                <span className="flex items-center gap-1" style={{ color: '#ef4444' }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#ef4444',
                      display: 'inline-block',
                    }}
                  />
                  {voteCounts['REJECT']}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Persona Cards Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {simulation.twins?.map((twin, idx) => {
          const config = PERSONA_CONFIG[twin.name] || PERSONA_CONFIG['Fiscal Conservative'];
          const voteConfig = VOTE_CONFIG[twin.vote] || VOTE_CONFIG['REVISE'];
          const isRevealed = idx < revealedVotes;
          const isSelected = selectedTwin === idx;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              onClick={() => setSelectedTwin(isSelected ? null : idx)}
              className="cursor-pointer"
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: config.bgGradient,
                border: `1px solid ${isSelected ? config.borderColor : 'var(--bg-card-hover)'}`,
                borderRadius: 'var(--liquid-radius)',
                transition: 'all 0.3s',
                boxShadow: isSelected ? `0 0 24px ${config.color}15` : 'none',
              }}
            >
              {/* Top Color Bar */}
              <div style={{ height: '2px', width: '100%', backgroundColor: config.color }} />

              <div style={{ padding: '20px' }}>
                {/* Persona Header with Avatar */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: config.avatarGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#0a0a0a',
                        boxShadow: `0 4px 16px ${config.color}30`,
                        flexShrink: 0,
                      }}
                    >
                      {config.avatarInitials}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {twin.name}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{twin.role}</p>
                    </div>
                  </div>

                  {/* Vote Badge - Animated Reveal */}
                  <AnimatePresence>
                    {isRevealed ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="flex items-center gap-1.5"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: voteConfig.color,
                          backgroundColor: voteConfig.bgColor,
                          border: `1px solid ${voteConfig.borderColor}`,
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        {voteConfig.icon}
                        {twin.vote}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          width: 36,
                          height: 36,
                          background: 'var(--bg-card-hover)',
                          border: '1px solid var(--bg-elevated)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            border: '2px solid var(--border-color)',
                            borderTopColor: config.color,
                            borderRadius: '50%',
                          }}
                          className="animate-spin"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confidence Meter */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{ marginBottom: '16px' }}
                    >
                      <div
                        className="flex justify-between"
                        style={{ fontSize: '11px', marginBottom: '6px' }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            color: config.color,
                          }}
                        >
                          {Math.round(twin.confidence)}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: '4px',
                          background: 'var(--bg-card-hover)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${twin.confidence}%` }}
                          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            backgroundColor: config.color,
                            borderRadius: 'var(--radius-full)',
                            boxShadow: `0 0 12px ${config.color}40`,
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rationale Quote */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          paddingLeft: '12px',
                          borderLeft: `2px solid ${config.color}40`,
                        }}
                      >
                        {twin.rationale}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Key Risk/Opportunity */}
                <AnimatePresence>
                  {isRevealed && twin.keyRiskIdentified && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--bg-card-hover)',
                      }}
                    >
                      <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                        <Target size={12} style={{ color: config.color }} />
                        <span
                          style={{
                            fontSize: '10px',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Key {twin.vote === 'APPROVE' ? 'Opportunity' : 'Concern'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {twin.keyRiskIdentified}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expand Indicator */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-center"
                      style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}
                    >
                      <span className="flex items-center gap-1">
                        {isSelected ? 'Show Less' : 'Expand'}
                        <ChevronRight
                          size={14}
                          className={`transition-transform ${isSelected ? 'rotate-90' : ''}`}
                        />
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Analysis Insights */}
      <AnimatePresence>
        {showConsensus && simulation.twins && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--bg-elevated)',
              borderRadius: 'var(--liquid-radius)',
              padding: '24px',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Brain size={20} style={{ color: 'var(--text-highlight)' }} />
              <h4 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Boardroom Analysis</h4>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Consensus Analysis */}
              <div>
                <h5
                  className="flex items-center gap-2"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                  }}
                >
                  <Users size={14} />
                  Consensus Breakdown
                </h5>
                <div className="space-y-2">
                  {voteCounts['APPROVE'] === 3 && (
                    <div
                      className="flex items-center gap-2"
                      style={{ fontSize: '13px', color: '#22c55e' }}
                    >
                      <CheckCircle size={16} />
                      <span>Unanimous approval — strong strategic alignment</span>
                    </div>
                  )}
                  {voteCounts['REJECT'] === 3 && (
                    <div
                      className="flex items-center gap-2"
                      style={{ fontSize: '13px', color: '#ef4444' }}
                    >
                      <XCircle size={16} />
                      <span>Unanimous rejection — significant concerns identified</span>
                    </div>
                  )}
                  {voteCounts['APPROVE'] >= 2 && voteCounts['APPROVE'] < 3 && (
                    <div
                      className="flex items-center gap-2"
                      style={{ fontSize: '13px', color: '#FBBF24' }}
                    >
                      <AlertTriangle size={16} />
                      <span>Mixed consensus — majority approval with reservations</span>
                    </div>
                  )}
                  {voteCounts['REJECT'] >= 2 && voteCounts['REJECT'] < 3 && (
                    <div
                      className="flex items-center gap-2"
                      style={{ fontSize: '13px', color: '#ef4444' }}
                    >
                      <AlertTriangle size={16} />
                      <span>Mixed consensus — majority rejection with some support</span>
                    </div>
                  )}
                  {voteCounts['REVISE'] > 0 && (
                    <div
                      className="flex items-center gap-2"
                      style={{ fontSize: '13px', color: '#FBBF24' }}
                    >
                      <TrendingUp size={16} />
                      <span>Revision requested — proposal needs refinement</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence Analysis */}
              <div>
                <h5
                  className="flex items-center gap-2"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                  }}
                >
                  <Target size={14} />
                  Confidence Metrics
                </h5>
                <div className="space-y-3">
                  {(() => {
                    const avgConfidence =
                      simulation.twins.reduce((acc, t) => acc + t.confidence, 0) /
                      simulation.twins.length;
                    const minConfidence = Math.min(...simulation.twins.map(t => t.confidence));

                    return (
                      <>
                        <div className="flex justify-between" style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Average Confidence</span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                              color:
                                avgConfidence > 75
                                  ? '#22c55e'
                                  : avgConfidence > 50
                                    ? '#FBBF24'
                                    : '#ef4444',
                            }}
                          >
                            {Math.round(avgConfidence)}%
                          </span>
                        </div>
                        <div className="flex justify-between" style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Lowest Confidence</span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                              color:
                                minConfidence > 75
                                  ? '#22c55e'
                                  : minConfidence > 50
                                    ? '#FBBF24'
                                    : '#ef4444',
                            }}
                          >
                            {Math.round(minConfidence)}%
                          </span>
                        </div>
                        <div
                          style={{
                            paddingTop: '8px',
                            borderTop: '1px solid var(--bg-card-hover)',
                          }}
                        >
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {avgConfidence > 80
                              ? 'High confidence levels indicate strong conviction across all perspectives.'
                              : avgConfidence > 60
                                ? 'Moderate confidence suggests some uncertainty in the decision.'
                                : 'Low confidence indicates significant doubts and potential risks.'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
