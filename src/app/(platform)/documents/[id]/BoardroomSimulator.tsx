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
  Brain
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
}

const PERSONA_CONFIG: Record<string, PersonaConfig> = {
  'Fiscal Conservative': {
    icon: <Briefcase size={28} />,
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    description: 'Focuses on ROI, cost control, and financial risk'
  },
  'Aggressive Growth': {
    icon: <TrendingUp size={28} />,
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    description: 'Prioritizes market capture and competitive advantage'
  },
  'Compliance Guard': {
    icon: <Shield size={28} />,
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    description: 'Ensures regulatory compliance and risk mitigation'
  }
};

const VOTE_CONFIG = {
  'APPROVE': { 
    color: '#22c55e', 
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    icon: <CheckCircle size={20} />,
    label: 'APPROVES'
  },
  'REJECT': { 
    color: '#ef4444', 
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    icon: <XCircle size={20} />,
    label: 'REJECTS'
  },
  'REVISE': { 
    color: '#f59e0b', 
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: <AlertTriangle size={20} />,
    label: 'REQUESTS REVISION'
  }
};

const OVERALL_CONFIG = {
  'APPROVED': { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.2)', icon: <CheckCircle size={32} /> },
  'REJECTED': { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)', icon: <XCircle size={32} /> },
  'MIXED': { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)', icon: <Minus size={32} /> }
};

export function BoardroomSimulator({ simulation }: BoardroomSimulatorProps) {
  const [revealedVotes, setRevealedVotes] = useState<number>(0);
  const [selectedTwin, setSelectedTwin] = useState<number | null>(null);
  const [showConsensus, setShowConsensus] = useState(false);

  // Sequential reveal animation
  useEffect(() => {
    if (!simulation?.twins) return;
    
    setRevealedVotes(0);
    setShowConsensus(false);
    
    const timer1 = setTimeout(() => setRevealedVotes(1), 600);
    const timer2 = setTimeout(() => setRevealedVotes(2), 1200);
    const timer3 = setTimeout(() => setRevealedVotes(3), 1800);
    const timer4 = setTimeout(() => setShowConsensus(true), 2400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [simulation]);

  if (!simulation) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500">
        <div className="text-center">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p>Simulation data not available</p>
        </div>
      </div>
    );
  }

  const voteCounts = simulation.twins?.reduce((acc, twin) => {
    acc[twin.vote] = (acc[twin.vote] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const overallConfig = OVERALL_CONFIG[simulation.overallVerdict] || OVERALL_CONFIG['MIXED'];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111] to-[#0a0a0a]"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
        </div>

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Building2 size={28} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Virtual Boardroom
                  <Sparkles size={16} className="text-orange-400" />
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  AI personas vote based on their expertise and real-time market data
                </p>
              </div>
            </div>

            {/* Overall Verdict */}
            <AnimatePresence>
              {showConsensus && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-right"
                >
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Board Consensus</div>
                  <motion.div 
                    className="flex items-center gap-3 px-4 py-2 rounded-xl font-bold text-lg"
                    style={{ 
                      color: overallConfig.color,
                      backgroundColor: overallConfig.bgColor,
                      border: `1px solid ${overallConfig.color}40`
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
            <span className="text-xs text-gray-500 uppercase tracking-wider">Vote Distribution</span>
            <div className="flex-1 flex gap-1 h-3 rounded-full overflow-hidden bg-white/5">
              {voteCounts['APPROVE'] > 0 && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(voteCounts['APPROVE'] / 3) * 100}%` }}
                  transition={{ delay: 2.5, duration: 0.5 }}
                  className="h-full bg-green-500"
                />
              )}
              {voteCounts['REVISE'] > 0 && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(voteCounts['REVISE'] / 3) * 100}%` }}
                  transition={{ delay: 2.6, duration: 0.5 }}
                  className="h-full bg-yellow-500"
                />
              )}
              {voteCounts['REJECT'] > 0 && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(voteCounts['REJECT'] / 3) * 100}%` }}
                  transition={{ delay: 2.7, duration: 0.5 }}
                  className="h-full bg-red-500"
                />
              )}
            </div>
            <div className="flex gap-3 text-xs">
              {voteCounts['APPROVE'] > 0 && (
                <span className="flex items-center gap-1 text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {voteCounts['APPROVE']} Approve
                </span>
              )}
              {voteCounts['REVISE'] > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  {voteCounts['REVISE']} Revise
                </span>
              )}
              {voteCounts['REJECT'] > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  {voteCounts['REJECT']} Reject
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
              className={`relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                isSelected ? 'ring-2 ring-orange-500/50' : ''
              }`}
              style={{
                background: config.bgGradient,
                borderColor: isSelected ? config.borderColor : 'rgba(255,255,255,0.1)',
              }}
            >
              {/* Top Color Bar */}
              <div 
                className="h-1 w-full"
                style={{ backgroundColor: config.color }}
              />

              <div className="p-5">
                {/* Persona Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10"
                      style={{ color: config.color }}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{twin.name}</h4>
                      <p className="text-xs text-gray-500">{twin.role}</p>
                    </div>
                  </div>

                  {/* Vote Badge - Animated Reveal */}
                  <AnimatePresence>
                    {isRevealed ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                        style={{
                          color: voteConfig.color,
                          backgroundColor: voteConfig.bgColor,
                          borderColor: voteConfig.borderColor
                        }}
                      >
                        {voteConfig.icon}
                        {twin.vote}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
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
                      className="mb-4"
                    >
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Confidence</span>
                        <span className="font-mono" style={{ color: config.color }}>
                          {Math.round(twin.confidence)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${twin.confidence}%` }}
                          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ 
                            backgroundColor: config.color,
                            boxShadow: `0 0 10px ${config.color}50`
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
                      className="relative"
                    >
                      <div className="absolute -top-2 -left-1 text-4xl text-white/10 font-serif">"</div>
                      <p className="text-sm text-gray-300 italic leading-relaxed pl-3 border-l-2 border-white/10">
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
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={12} style={{ color: config.color }} />
                        <span className="text-xs uppercase tracking-wider text-gray-500">
                          Key {twin.vote === 'APPROVE' ? 'Opportunity' : 'Concern'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{twin.keyRiskIdentified}</p>
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
                      className="mt-4 flex items-center justify-center text-xs text-gray-600"
                    >
                      <span className="flex items-center gap-1">
                        {isSelected ? 'Show Less' : 'Click to Expand'}
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
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#111] to-[#0a0a0a] p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Brain size={20} className="text-orange-500" />
              <h4 className="font-bold text-white">Boardroom Analysis</h4>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Consensus Analysis */}
              <div>
                <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Users size={14} />
                  Consensus Breakdown
                </h5>
                <div className="space-y-2">
                  {voteCounts['APPROVE'] === 3 && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle size={16} />
                      <span>Unanimous approval - strong strategic alignment</span>
                    </div>
                  )}
                  {voteCounts['REJECT'] === 3 && (
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle size={16} />
                      <span>Unanimous rejection - significant concerns identified</span>
                    </div>
                  )}
                  {voteCounts['APPROVE'] >= 2 && voteCounts['APPROVE'] < 3 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-400">
                      <AlertTriangle size={16} />
                      <span>Mixed consensus - majority approval with reservations</span>
                    </div>
                  )}
                  {voteCounts['REJECT'] >= 2 && voteCounts['REJECT'] < 3 && (
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <AlertTriangle size={16} />
                      <span>Mixed consensus - majority rejection with some support</span>
                    </div>
                  )}
                  {voteCounts['REVISE'] > 0 && (
                    <div className="flex items-center gap-2 text-sm text-orange-400">
                      <TrendingUp size={16} />
                      <span>Revision requested - proposal needs refinement</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence Analysis */}
              <div>
                <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Target size={14} />
                  Confidence Metrics
                </h5>
                <div className="space-y-3">
                  {(() => {
                    const avgConfidence = simulation.twins.reduce((acc, t) => acc + t.confidence, 0) / simulation.twins.length;
                    const minConfidence = Math.min(...simulation.twins.map(t => t.confidence));
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Average Confidence</span>
                          <span className={`font-mono font-bold ${
                            avgConfidence > 75 ? 'text-green-400' : avgConfidence > 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {Math.round(avgConfidence)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Lowest Confidence</span>
                          <span className={`font-mono font-bold ${
                            minConfidence > 75 ? 'text-green-400' : minConfidence > 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {Math.round(minConfidence)}%
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-xs text-gray-500">
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
