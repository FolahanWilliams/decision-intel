'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Sector,
  ReferenceLine,
  Brush,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Brain,
  Activity,
} from 'lucide-react';

interface RiskDistribution {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

interface ScoreTrend {
  date: string;
  score: number;
  biasCount?: number;
  confidence?: number;
}

interface BiasCategory {
  name: string;
  count: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  trend?: number; // percentage change
  instances?: Array<{
    document: string;
    excerpt: string;
    timestamp: string;
  }>;
}

interface EnhancedDashboardChartsProps {
  riskDistribution: RiskDistribution;
  scoreTrend: ScoreTrend[];
  topBiases: BiasCategory[];
  totalAnalyzed: number;
  avgScore: number;
  onBiasClick?: (biasName: string) => void;
  onPeriodSelect?: (startDate: string, endDate: string) => void;
  onRiskSegmentClick?: (risk: 'high' | 'medium' | 'low') => void;
}

const RISK_COLORS = {
  high: '#ef4444',
  medium: '#fbbf24',
  low: '#22c55e',
};

const stableHash = (str: string, seed: number): number => {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 100);
};

// Custom tooltip with rich content — extracted outside component to avoid re-creation during render
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-3 rounded-lg",
        "bg-black/90 backdrop-blur-xl",
        "border border-white/20",
        "shadow-xl"
      )}
    >
      <p className="text-xs font-semibold text-white">{label}</p>
      {payload.map((entry, index: number) => (
        <div key={index} className="flex items-center gap-2 mt-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-white/80">
            {entry.name}: {entry.value}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#fbbf24',
  high: '#f97316',
  critical: '#ef4444',
};

// Custom active shape for pie chart
interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: { name: string };
  value: number;
  percent: number;
}

const renderActiveShape = (props: ActiveShapeProps) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, percent } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-8} textAnchor="middle" fill={fill} className="text-lg font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={16} textAnchor="middle" fill="#999" className="text-sm">
        {`${value} documents`}
      </text>
      <text x={cx} y={cy} dy={32} textAnchor="middle" fill="#666" className="text-xs">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export function EnhancedDashboardCharts({
  riskDistribution,
  scoreTrend,
  topBiases,
  totalAnalyzed,
  avgScore,
  onBiasClick,
  onPeriodSelect,
  onRiskSegmentClick,
}: EnhancedDashboardChartsProps) {
  const [activeRiskIndex, setActiveRiskIndex] = useState<number | undefined>(undefined);
  const [selectedBias, setSelectedBias] = useState<string | null>(null);
  const [hoveredBias, setHoveredBias] = useState<string | null>(null);
  const [_selectedTimeRange, setSelectedTimeRange] = useState<[number, number] | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [_animationKey, setAnimationKey] = useState(0);
  const [showBiasDetails, setShowBiasDetails] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced donut data with animations
  const donutData = useMemo(() => [
    {
      name: 'High Risk',
      value: riskDistribution.highRisk,
      color: RISK_COLORS.high,
      description: 'Critical attention needed',
      percentage: (riskDistribution.highRisk / totalAnalyzed) * 100,
    },
    {
      name: 'Medium Risk',
      value: riskDistribution.mediumRisk,
      color: RISK_COLORS.medium,
      description: 'Monitor closely',
      percentage: (riskDistribution.mediumRisk / totalAnalyzed) * 100,
    },
    {
      name: 'Low Risk',
      value: riskDistribution.lowRisk,
      color: RISK_COLORS.low,
      description: 'Acceptable levels',
      percentage: (riskDistribution.lowRisk / totalAnalyzed) * 100,
    },
  ].filter(d => d.value > 0), [riskDistribution, totalAnalyzed]);

  // Enhanced trend data with predictions
  const enhancedTrendData = useMemo(() => {
    if (scoreTrend.length < 2) return scoreTrend;

    // Add moving average
    const windowSize = 3;
    return scoreTrend.map((point, index) => {
      const start = Math.max(0, index - windowSize + 1);
      const window = scoreTrend.slice(start, index + 1);
      const movingAvg = window.reduce((sum, p) => sum + p.score, 0) / window.length;

      return {
        ...point,
        movingAverage: movingAvg,
        deviation: Math.abs(point.score - movingAvg),
        trend: index > 0 ? point.score - scoreTrend[index - 1].score : 0,
      };
    });
  }, [scoreTrend]);

  // Enhanced bias data with relationships
  const enhancedBiasData = useMemo(() => {
    return topBiases.map((bias, biasIndex) => ({
      ...bias,
      severity: bias.severity || 'medium',
      connections: topBiases
        .filter((b, bIndex) => b.name !== bias.name && stableHash(bias.name + b.name, biasIndex + bIndex) > 60)
        .map(b => b.name),
      impact: Math.round(bias.count * (bias.severity === 'critical' ? 4 : bias.severity === 'high' ? 3 : 2)),
    }));
  }, [topBiases]);

  // Filter biases based on selected risk level
  const filteredBiases = useMemo(() => {
    if (selectedRiskLevel === 'all') return enhancedBiasData;
    return enhancedBiasData.filter(bias => {
      const severityMap = { critical: 'high', high: 'high', medium: 'medium', low: 'low' };
      return severityMap[bias.severity as keyof typeof severityMap] === selectedRiskLevel;
    });
  }, [enhancedBiasData, selectedRiskLevel]);

  // Handle interactions
  const handleBiasClick = useCallback((biasName: string) => {
    setSelectedBias(prev => prev === biasName ? null : biasName);
    onBiasClick?.(biasName);

    // Trigger animation
    setAnimationKey(prev => prev + 1);
  }, [onBiasClick]);

  const handleRiskSegmentClick = useCallback((entry: { name: string }, index: number) => {
    setActiveRiskIndex(index);
    const riskLevel = entry.name.toLowerCase().replace(' risk', '') as 'high' | 'medium' | 'low';
    setSelectedRiskLevel(riskLevel);
    onRiskSegmentClick?.(riskLevel);
  }, [onRiskSegmentClick]);

  const handleTimeRangeSelect = useCallback((domain: { startIndex?: number; endIndex?: number } | null) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      setSelectedTimeRange([domain.startIndex, domain.endIndex]);
      const startDate = scoreTrend[domain.startIndex].date;
      const endDate = scoreTrend[domain.endIndex].date;
      onPeriodSelect?.(startDate, endDate);
    }
  }, [scoreTrend, onPeriodSelect]);

  // Radar chart data for bias relationships
  const radarData = useMemo(() => {
    const categories = ['Cognitive', 'Emotional', 'Social', 'Logical', 'Memory'];
    return categories.map((category, index) => ({
      category,
      current: stableHash(category, index),
      benchmark: 50,
      target: 30,
    }));
  }, []);

  return (
    <div ref={chartContainerRef} className="space-y-4">
      {/* View mode selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['overview', 'detailed', 'comparison'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                viewMode === mode
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Risk filter pills */}
        <div className="flex gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map(level => (
            <button
              key={level}
              onClick={() => setSelectedRiskLevel(level)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                selectedRiskLevel === level
                  ? level === 'all'
                    ? "bg-white/20 text-white border border-white/30"
                    : `bg-opacity-20 border`
                  : "bg-white/5 text-white/60 hover:bg-white/10",
                selectedRiskLevel === level && level !== 'all' && "border-opacity-50"
              )}
              style={{
                backgroundColor: selectedRiskLevel === level && level !== 'all'
                  ? `${RISK_COLORS[level]}20`
                  : undefined,
                borderColor: selectedRiskLevel === level && level !== 'all'
                  ? RISK_COLORS[level]
                  : undefined,
                color: selectedRiskLevel === level && level !== 'all'
                  ? RISK_COLORS[level]
                  : undefined,
              }}
            >
              <span className="capitalize">{level}</span>
              {level !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({level === 'high' ? riskDistribution.highRisk :
                    level === 'medium' ? riskDistribution.mediumRisk :
                    riskDistribution.lowRisk})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Enhanced Risk Distribution */}
        <motion.div
          layout
          className={cn(
            "card liquid-glass-premium p-4",
            viewMode === 'detailed' && "lg:col-span-2"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Risk Distribution</h3>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white/40" />
              <span className="text-xs text-white/60">{totalAnalyzed} analyzed</span>
            </div>
          </div>

          <div className="relative">
            <ResponsiveContainer width="100%" height={viewMode === 'detailed' ? 300 : 200}>
              <PieChart>
                <Pie
                  {...({
                    activeIndex: activeRiskIndex,
                    activeShape: viewMode === 'detailed' ? renderActiveShape : undefined,
                  } as Record<string, unknown>)}
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={viewMode === 'detailed' ? 60 : 40}
                  outerRadius={viewMode === 'detailed' ? 100 : 70}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  onClick={handleRiskSegmentClick}
                  onMouseEnter={(_, index) => setActiveRiskIndex(index)}
                  onMouseLeave={() => setActiveRiskIndex(undefined)}
                >
                  {donutData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-all hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center metrics */}
            {viewMode !== 'detailed' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold">{avgScore}</div>
                  <div className="text-xs text-white/60">Avg Score</div>
                </div>
              </div>
            )}
          </div>

          {/* Risk level breakdown */}
          <AnimatePresence>
            {viewMode === 'detailed' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2"
              >
                {donutData.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg",
                      "bg-white/5 hover:bg-white/10 transition-colors cursor-pointer",
                      activeRiskIndex === index && "bg-white/15"
                    )}
                    onClick={() => handleRiskSegmentClick(item, index)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">{item.description}</span>
                      <span className="text-sm font-semibold">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Score Trend */}
        <motion.div
          layout
          className={cn(
            "card liquid-glass-premium p-4",
            viewMode === 'comparison' ? "lg:col-span-2" : "lg:col-span-1"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Score Trend</h3>
            <div className="flex items-center gap-2">
              {scoreTrend.length > 1 && scoreTrend[scoreTrend.length - 1].score > scoreTrend[0].score ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-error" />
              )}
              <span className="text-xs text-white/60">
                {scoreTrend.length > 1
                  ? `${((scoreTrend[scoreTrend.length - 1].score - scoreTrend[0].score) > 0 ? '+' : '')}${(scoreTrend[scoreTrend.length - 1].score - scoreTrend[0].score).toFixed(1)}`
                  : 'N/A'}
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={viewMode === 'comparison' ? 300 : 200}>
            <ComposedChart data={enhancedTrendData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                stroke="rgba(255,255,255,0.2)"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                stroke="rgba(255,255,255,0.2)"
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Main score area */}
              <Area
                type="monotone"
                dataKey="score"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                animationDuration={1000}
                name="Score"
              />

              {/* Moving average line */}
              {viewMode !== 'overview' && (
                <Line
                  type="monotone"
                  dataKey="movingAverage"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Moving Avg"
                />
              )}

              {/* Deviation bars */}
              {viewMode === 'detailed' && (
                <Bar
                  dataKey="deviation"
                  fill="#ef4444"
                  opacity={0.3}
                  name="Deviation"
                />
              )}

              {/* Interactive brush for time selection */}
              {viewMode === 'comparison' && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="rgba(255,255,255,0.2)"
                  fill="rgba(255,255,255,0.05)"
                  onChange={handleTimeRangeSelect}
                />
              )}

              {/* Reference lines */}
              <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Enhanced Top Biases */}
        <motion.div
          layout
          className={cn(
            "card liquid-glass-premium p-4",
            viewMode === 'detailed' && "lg:col-span-3"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Top Biases</h3>
            <button
              onClick={() => setShowBiasDetails(!showBiasDetails)}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              {showBiasDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {viewMode === 'detailed' ? (
            // Detailed view with connections
            <div className="space-y-3">
              {filteredBiases.map((bias, index) => (
                <motion.div
                  key={bias.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all",
                    "bg-white/5 hover:bg-white/10",
                    selectedBias === bias.name && "bg-white/15 ring-1 ring-white/30"
                  )}
                  onClick={() => handleBiasClick(bias.name)}
                  onMouseEnter={() => setHoveredBias(bias.name)}
                  onMouseLeave={() => setHoveredBias(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain
                        className="w-5 h-5"
                        style={{ color: SEVERITY_COLORS[bias.severity || 'medium'] }}
                      />
                      <div>
                        <div className="font-medium text-sm">{bias.name}</div>
                        <div className="text-xs text-white/60">
                          {bias.count} occurrences • Impact: {bias.impact}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {bias.trend && (
                        <span className={cn(
                          "text-xs font-medium",
                          bias.trend > 0 ? "text-error" : "text-success"
                        )}>
                          {bias.trend > 0 ? '+' : ''}{bias.trend}%
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    </div>
                  </div>

                  {/* Connections */}
                  <AnimatePresence>
                    {(selectedBias === bias.name || hoveredBias === bias.name) && bias.connections && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-white/10"
                      >
                        <div className="text-xs text-white/60 mb-1">Related biases:</div>
                        <div className="flex flex-wrap gap-1">
                          {bias.connections.map(conn => (
                            <span
                              key={conn}
                              className="px-2 py-0.5 bg-white/10 rounded-full text-xs"
                            >
                              {conn}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Instances preview */}
                  <AnimatePresence>
                    {showBiasDetails && bias.instances && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 space-y-1"
                      >
                        {bias.instances.slice(0, 2).map((instance, i) => (
                          <div key={i} className="p-2 bg-white/5 rounded text-xs">
                            <div className="font-medium text-white/80">{instance.document}</div>
                            <div className="text-white/60 truncate">{instance.excerpt}</div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          ) : (
            // Compact bar chart view
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={filteredBiases}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                  stroke="rgba(255,255,255,0.2)"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                  stroke="rgba(255,255,255,0.2)"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  animationDuration={800}
                  onClick={(data) => data.name && handleBiasClick(data.name)}
                  className="cursor-pointer"
                >
                  {filteredBiases.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.severity || 'medium']}
                      opacity={selectedBias === entry.name ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Radar comparison chart (appears in comparison mode) */}
        <AnimatePresence>
          {viewMode === 'comparison' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card liquid-glass-premium p-4 lg:col-span-1"
            >
              <h3 className="text-sm font-semibold mb-4">Bias Categories</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }}
                  />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Benchmark"
                    dataKey="benchmark"
                    stroke="#fbbf24"
                    fill="#fbbf24"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}