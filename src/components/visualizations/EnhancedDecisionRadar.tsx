'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Target,
  AlertTriangle,
  CheckCircle,
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  Play,
  Pause,
  Zap,
  Shield,
} from 'lucide-react';

interface DecisionRadarData {
  quality: number;
  consistency: number;
  factAccuracy: number;
  logic: number;
  compliance: number;
  objectivity: number;
}

interface HistoricalData {
  timestamp: string;
  data: DecisionRadarData;
  label?: string;
}

interface EnhancedDecisionRadarProps {
  data: DecisionRadarData;
  historicalData?: HistoricalData[];
  benchmarkData?: DecisionRadarData;
  targetData?: DecisionRadarData;
  onAxisClick?: (axis: string) => void;
  onThresholdAlert?: (axis: string, value: number) => void;
  interactive?: boolean;
  showWhatIf?: boolean;
}

const AXIS_CONFIG: Record<string, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  threshold: number;
  weight: number;
}> = {
  quality: {
    label: 'Quality',
    description: 'Overall decision quality and reasoning depth',
    icon: <Zap className="w-4 h-4" />,
    color: '#3b82f6',
    threshold: 70,
    weight: 1.2,
  },
  consistency: {
    label: 'Consistency',
    description: 'Internal consistency across arguments',
    icon: <Shield className="w-4 h-4" />,
    color: '#8b5cf6',
    threshold: 75,
    weight: 1.0,
  },
  factAccuracy: {
    label: 'Fact Accuracy',
    description: 'Accuracy of stated facts and claims',
    icon: <CheckCircle className="w-4 h-4" />,
    color: '#22c55e',
    threshold: 80,
    weight: 1.5,
  },
  logic: {
    label: 'Logic',
    description: 'Logical structure and absence of fallacies',
    icon: <Target className="w-4 h-4" />,
    color: '#f59e0b',
    threshold: 70,
    weight: 1.3,
  },
  compliance: {
    label: 'Compliance',
    description: 'Regulatory and policy alignment',
    icon: <Shield className="w-4 h-4" />,
    color: '#06b6d4',
    threshold: 90,
    weight: 1.1,
  },
  objectivity: {
    label: 'Objectivity',
    description: 'Absence of subjective bias',
    icon: <Eye className="w-4 h-4" />,
    color: '#ec4899',
    threshold: 65,
    weight: 1.0,
  },
};

// Custom tooltip extracted outside the component to avoid re-creation during render
interface RadarTooltipPayloadItem {
  payload: {
    axis: string;
    key: string;
    value: number;
    benchmark: number | null;
    target: number | null;
    color: string;
  };
}

function CustomRadarTooltip({ active, payload }: {
  active?: boolean;
  payload?: RadarTooltipPayloadItem[];
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const config = AXIS_CONFIG[data.key];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-3 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg"
    >
      <div className="flex items-center gap-2 mb-2">
        {config?.icon}
        <span className="font-semibold text-sm">{data.axis}</span>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Current:</span>
          <span className="font-mono font-semibold" style={{ color: config?.color }}>
            {data.value}
          </span>
        </div>
        {data.benchmark && (
          <div className="flex justify-between gap-4">
            <span className="text-white/60">Benchmark:</span>
            <span className="font-mono">{data.benchmark}</span>
          </div>
        )}
        {data.target && (
          <div className="flex justify-between gap-4">
            <span className="text-white/60">Target:</span>
            <span className="font-mono">{data.target}</span>
          </div>
        )}
        <div className="pt-1 mt-1 border-t border-white/10">
          <div className="text-white/60">{config?.description}</div>
        </div>
      </div>
    </motion.div>
  );
}

export function EnhancedDecisionRadar({
  data,
  historicalData = [],
  benchmarkData,
  targetData,
  onAxisClick,
  onThresholdAlert,
  interactive = true,
  showWhatIf = false,
}: EnhancedDecisionRadarProps) {
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  const [_animationStep, setAnimationStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [whatIfData, setWhatIfData] = useState<DecisionRadarData>(data);
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [selectedHistorical, setSelectedHistorical] = useState<number | null>(null);

  const animationRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Calculate weighted score
  const calculateWeightedScore = useCallback((values: DecisionRadarData) => {
    const totalWeight = Object.values(AXIS_CONFIG).reduce((sum, config) => sum + config.weight, 0);
    const weightedSum = Object.entries(values).reduce(
      (sum, [key, value]) => sum + value * (AXIS_CONFIG[key]?.weight || 1),
      0
    );
    return Math.round((weightedSum / totalWeight));
  }, []);

  // Prepare chart data
  const chartData = useMemo(() => {
    const baseData = whatIfMode ? whatIfData : data;
    return Object.entries(baseData).map(([key, value]) => {
      const config = AXIS_CONFIG[key];
      const benchmark = benchmarkData?.[key as keyof DecisionRadarData];
      const target = targetData?.[key as keyof DecisionRadarData];
      const historical = selectedHistorical !== null && historicalData[selectedHistorical]
        ? historicalData[selectedHistorical].data[key as keyof DecisionRadarData]
        : null;

      return {
        axis: config?.label || key,
        key,
        value,
        benchmark: showBenchmark ? benchmark : null,
        target: showTarget ? target : null,
        historical,
        fullMark: 100,
        threshold: config?.threshold || 70,
        color: config?.color || '#666',
        isSelected: selectedAxis === key,
        isHovered: hoveredAxis === key,
      };
    });
  }, [data, whatIfData, whatIfMode, benchmarkData, targetData, showBenchmark, showTarget, selectedAxis, hoveredAxis, selectedHistorical, historicalData]);

  // Animation for historical playback
  useEffect(() => {
    if (isPlaying && historicalData.length > 0) {
      animationRef.current = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % historicalData.length);
      }, 1500);
    } else {
      if (animationRef.current) clearInterval(animationRef.current);
    }
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isPlaying, historicalData]);

  // Check thresholds
  useEffect(() => {
    Object.entries(data).forEach(([key, value]) => {
      const config = AXIS_CONFIG[key];
      if (config && value < config.threshold && onThresholdAlert) {
        onThresholdAlert(key, value);
      }
    });
  }, [data, onThresholdAlert]);

  // Handle axis interaction
  const handleAxisClick = useCallback((axisKey: string) => {
    if (!interactive) return;
    setSelectedAxis(prev => prev === axisKey ? null : axisKey);
    onAxisClick?.(axisKey);
  }, [interactive, onAxisClick]);

  // Calculate delta from benchmark
  const deltaFromBenchmark = useMemo(() => {
    if (!benchmarkData) return null;
    return Object.entries(data).reduce((acc, [key, value]) => {
      const benchmark = benchmarkData[key as keyof DecisionRadarData];
      acc[key] = value - benchmark;
      return acc;
    }, {} as Record<string, number>);
  }, [data, benchmarkData]);

  // What-if scenario handler
  const handleWhatIfChange = useCallback((axis: string, value: number) => {
    setWhatIfData(prev => ({ ...prev, [axis]: value }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View toggles */}
          {benchmarkData && (
            <button
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                showBenchmark
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {showBenchmark ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
              Benchmark
            </button>
          )}
          {targetData && (
            <button
              onClick={() => setShowTarget(!showTarget)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                showTarget
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {showTarget ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
              Target
            </button>
          )}
          {showWhatIf && (
            <button
              onClick={() => {
                setWhatIfMode(!whatIfMode);
                if (!whatIfMode) setWhatIfData(data);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                whatIfMode
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              <Sliders className="w-3 h-3 inline mr-1" />
              What-If Mode
            </button>
          )}
        </div>

        {/* Historical playback */}
        {historicalData.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <select
              value={selectedHistorical ?? ''}
              onChange={(e) => setSelectedHistorical(e.target.value ? parseInt(e.target.value) : null)}
              className="px-2 py-1 rounded-lg bg-white/10 text-xs border border-white/20"
            >
              <option value="">Current</option>
              {historicalData.map((item, index) => (
                <option key={index} value={index}>
                  {item.label || item.timestamp}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main radar chart */}
      <div className="card liquid-glass-premium p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Decision Health Radar</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-white/60">
                Weighted Score:
                <span className={cn(
                  "ml-1 font-bold",
                  calculateWeightedScore(whatIfMode ? whatIfData : data) >= 70 ? "text-success" : "text-warning"
                )}>
                  {calculateWeightedScore(whatIfMode ? whatIfData : data)}
                </span>
              </span>
              {deltaFromBenchmark && (
                <span className="text-xs text-white/60">
                  vs Benchmark:
                  <span className={cn(
                    "ml-1 font-bold",
                    Object.values(deltaFromBenchmark).reduce((a, b) => a + b, 0) >= 0 ? "text-success" : "text-error"
                  )}>
                    {Object.values(deltaFromBenchmark).reduce((a, b) => a + b, 0) >= 0 ? '+' : ''}
                    {Object.values(deltaFromBenchmark).reduce((a, b) => a + b, 0).toFixed(1)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData}>
            <PolarGrid
              stroke="rgba(255,255,255,0.1)"
              radialLines={true}
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={({ x, y, payload }) => {
                const data = chartData.find(d => d.axis === payload.value);
                const isActive = data?.isSelected || data?.isHovered;
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fill={isActive ? data?.color : 'rgba(255,255,255,0.6)'}
                    fontSize={isActive ? 12 : 11}
                    fontWeight={isActive ? 600 : 400}
                    className="cursor-pointer transition-all"
                    onClick={() => data && handleAxisClick(data.key)}
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
            />

            {/* Threshold rings */}
            {Object.values(AXIS_CONFIG).map((config, index) => (
              <circle
                key={index}
                cx="50%"
                cy="50%"
                r={`${config.threshold * 0.7}%`}
                fill="none"
                stroke={config.color}
                strokeWidth={0.5}
                strokeDasharray="2 4"
                opacity={0.2}
              />
            ))}

            {/* Historical data */}
            {selectedHistorical !== null && historicalData[selectedHistorical] && (
              <Radar
                name="Historical"
                dataKey="historical"
                stroke="rgba(255,255,255,0.3)"
                fill="rgba(255,255,255,0.05)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}

            {/* Benchmark */}
            {showBenchmark && benchmarkData && (
              <Radar
                name="Benchmark"
                dataKey="benchmark"
                stroke="#fbbf24"
                fill="#fbbf24"
                fillOpacity={0.1}
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
            )}

            {/* Target */}
            {showTarget && targetData && (
              <Radar
                name="Target"
                dataKey="target"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.05}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {/* Main data */}
            <Radar
              name="Current"
              dataKey="value"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.25}
              strokeWidth={2}
              onMouseEnter={(data) => data.key && setHoveredAxis(String(data.key))}
              onMouseLeave={() => setHoveredAxis(null)}
            />

            <Tooltip content={<CustomRadarTooltip />} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Axis details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {Object.entries(whatIfMode ? whatIfData : data).map(([key, value]) => {
            const config = AXIS_CONFIG[key];
            const isLow = value < config.threshold;
            const delta = deltaFromBenchmark?.[key];

            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-2 rounded-lg cursor-pointer transition-all",
                  "bg-white/5 hover:bg-white/10",
                  selectedAxis === key && "ring-1 ring-white/30",
                  isLow && "ring-1 ring-warning/50"
                )}
                onClick={() => handleAxisClick(key)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div style={{ color: config.color }}>{config.icon}</div>
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                  {isLow && <AlertTriangle className="w-3 h-3 text-warning" />}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold" style={{ color: config.color }}>
                    {Math.round(value)}
                  </span>
                  <span className="text-xs text-white/40">/100</span>
                  {delta !== null && delta !== undefined && (
                    <span className={cn(
                      "text-xs ml-auto",
                      delta >= 0 ? "text-success" : "text-error"
                    )}>
                      {delta >= 0 ? '+' : ''}{delta.toFixed(0)}
                    </span>
                  )}
                </div>

                {/* What-if slider */}
                <AnimatePresence>
                  {whatIfMode && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={whatIfData[key as keyof DecisionRadarData]}
                        onChange={(e) => handleWhatIfChange(key, parseInt(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, ${config.color} ${value}%, rgba(255,255,255,0.2) ${value}%)`,
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Progress bar */}
                <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* What-if summary */}
        <AnimatePresence>
          {whatIfMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-semibold text-blue-400">What-If Scenario</span>
                  <div className="text-xs text-white/60 mt-1">
                    New weighted score:
                    <span className={cn(
                      "ml-1 font-bold",
                      calculateWeightedScore(whatIfData) >= 70 ? "text-success" : "text-warning"
                    )}>
                      {calculateWeightedScore(whatIfData)}
                    </span>
                    <span className="ml-2">
                      ({calculateWeightedScore(whatIfData) - calculateWeightedScore(data) >= 0 ? '+' : ''}
                      {calculateWeightedScore(whatIfData) - calculateWeightedScore(data)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setWhatIfData(data);
                    setWhatIfMode(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3 inline mr-1" />
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}