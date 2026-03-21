'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Brain,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import {
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SecurityKPI {
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  target: number;
  status: 'good' | 'warning' | 'critical';
  lastUpdated: string;
}

interface WizIssue {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  toxicCombination: boolean;
  biasDetected: string[];
  decisionTime: number;
  assignee: string;
  createdAt: string;
}

interface BiasMetric {
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: number; // Percentage change
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockKPIs: SecurityKPI[] = [
  {
    metric: 'MTTD',
    value: 12.5,
    unit: 'minutes',
    trend: 'down',
    target: 15,
    status: 'good',
    lastUpdated: '2 min ago'
  },
  {
    metric: 'MTTR',
    value: 45,
    unit: 'minutes',
    trend: 'down',
    target: 60,
    status: 'good',
    lastUpdated: '5 min ago'
  },
  {
    metric: 'MTTA',
    value: 8,
    unit: 'minutes',
    trend: 'up',
    target: 5,
    status: 'warning',
    lastUpdated: '1 min ago'
  },
  {
    metric: 'Dwell Time',
    value: 24,
    unit: 'hours',
    trend: 'down',
    target: 48,
    status: 'good',
    lastUpdated: '10 min ago'
  },
  {
    metric: 'False Positive Rate',
    value: 4.2,
    unit: '%',
    trend: 'down',
    target: 5,
    status: 'good',
    lastUpdated: '3 min ago'
  },
  {
    metric: 'Alert Volume',
    value: 247,
    unit: 'alerts/day',
    trend: 'up',
    target: 200,
    status: 'warning',
    lastUpdated: '1 min ago'
  }
];

const mockIssues: WizIssue[] = [
  {
    id: 'WIZ-001',
    title: 'Critical RCE vulnerability in public-facing service',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    toxicCombination: true,
    biasDetected: ['anchoring_bias', 'automation_bias'],
    decisionTime: 15,
    assignee: 'Alice Chen',
    createdAt: '2024-03-20T10:30:00Z'
  },
  {
    id: 'WIZ-002',
    title: 'Exposed AWS credentials in application logs',
    severity: 'HIGH',
    status: 'OPEN',
    toxicCombination: false,
    biasDetected: ['loss_aversion'],
    decisionTime: 120,
    assignee: 'Bob Smith',
    createdAt: '2024-03-20T09:15:00Z'
  },
  {
    id: 'WIZ-003',
    title: 'Misconfigured S3 bucket with public read access',
    severity: 'HIGH',
    status: 'RESOLVED',
    toxicCombination: true,
    biasDetected: [],
    decisionTime: 35,
    assignee: 'Carol White',
    createdAt: '2024-03-20T08:00:00Z'
  }
];

const mockBiasMetrics: BiasMetric[] = [
  { type: 'Anchoring', count: 23, severity: 'high', trend: -15 },
  { type: 'Automation', count: 18, severity: 'critical', trend: 25 },
  { type: 'Groupthink', count: 12, severity: 'medium', trend: -5 },
  { type: 'Loss Aversion', count: 31, severity: 'high', trend: 10 },
  { type: 'Confirmation', count: 8, severity: 'low', trend: -20 }
];

// ─── Components ──────────────────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: SecurityKPI }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const isPositiveTrend = (metric: string, trend: string) => {
    const negativeMetrics = ['MTTD', 'MTTR', 'MTTA', 'Dwell Time', 'False Positive Rate'];
    return negativeMetrics.includes(metric) ? trend === 'down' : trend === 'up';
  };

  return (
    <Card className="liquid-glass hover:scale-[1.02] transition-transform">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${getStatusColor(kpi.status)}`} />
            <span className="text-sm font-medium text-gray-400">{kpi.metric}</span>
          </div>
          <Badge
            variant="secondary"
            className={`${isPositiveTrend(kpi.metric, kpi.trend)
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
            }`}
          >
            {getTrendIcon(kpi.trend)}
          </Badge>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-3xl font-bold ${getStatusColor(kpi.status)}`}>
            {kpi.value}
          </span>
          <span className="text-sm text-gray-400">{kpi.unit}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Target: {kpi.target} {kpi.unit}
          </div>
          <div className="text-xs text-gray-500">{kpi.lastUpdated}</div>
        </div>
        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStatusColor(kpi.status)} bg-current transition-all`}
            style={{ width: `${Math.min(100, (kpi.target / kpi.value) * 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function IssuesList({ issues }: { issues: WizIssue[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-4">
      {issues.map(issue => (
        <Card key={issue.id} className="liquid-glass border-gray-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={getSeverityColor(issue.severity)}>
                    {issue.severity}
                  </Badge>
                  {issue.toxicCombination && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                      <Zap className="w-3 h-3 mr-1" />
                      Toxic Combo
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-gray-400">
                    {issue.status}
                  </Badge>
                </div>
                <h4 className="text-sm font-medium text-white mb-1">{issue.title}</h4>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>ID: {issue.id}</span>
                  <span>Assigned: {issue.assignee}</span>
                  <span>Decision Time: {issue.decisionTime}s</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {issue.biasDetected.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
                <Brain className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Biases Detected:</span>
                {issue.biasDetected.map(bias => (
                  <Badge key={bias} className="bg-yellow-500/10 text-yellow-400 text-xs">
                    {bias.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BiasRadar() {
  const data = [
    { bias: 'Anchoring', current: 65, target: 30, industry: 45 },
    { bias: 'Automation', current: 82, target: 40, industry: 60 },
    { bias: 'Groupthink', current: 45, target: 25, industry: 55 },
    { bias: 'Loss Aversion', current: 70, target: 35, industry: 65 },
    { bias: 'Confirmation', current: 38, target: 20, industry: 50 },
    { bias: 'Overconfidence', current: 55, target: 30, industry: 48 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="bias" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#9CA3AF', fontSize: 10 }}
        />
        <Radar
          name="Current"
          dataKey="current"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.3}
        />
        <Radar
          name="Target"
          dataKey="target"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.2}
        />
        <Radar
          name="Industry Avg"
          dataKey="industry"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.1}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function MTTRTrend() {
  const data = [
    { day: 'Mon', actual: 62, target: 60, withAI: 45 },
    { day: 'Tue', actual: 58, target: 60, withAI: 42 },
    { day: 'Wed', actual: 65, target: 60, withAI: 48 },
    { day: 'Thu', actual: 55, target: 60, withAI: 40 },
    { day: 'Fri', actual: 52, target: 60, withAI: 38 },
    { day: 'Sat', actual: 48, target: 60, withAI: 35 },
    { day: 'Sun', actual: 45, target: 60, withAI: 32 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="day" tick={{ fill: '#9CA3AF' }} />
        <YAxis tick={{ fill: '#9CA3AF' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px'
          }}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorActual)"
          name="Current MTTR"
        />
        <Area
          type="monotone"
          dataKey="withAI"
          stroke="#22c55e"
          fillOpacity={1}
          fill="url(#colorAI)"
          name="With Cognitive AI"
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#f97316"
          strokeDasharray="5 5"
          dot={false}
          name="Target"
        />
        <Legend />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SecurityOperationsPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Operations Center</h1>
          <p className="text-gray-400">
            Cognitive governance layer for Wiz integration with real-time bias detection
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
            Connect to Wiz
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {mockKPIs.map(kpi => (
          <KPICard key={kpi.metric} kpi={kpi} />
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="liquid-glass border-gray-800 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Active Issues</TabsTrigger>
          <TabsTrigger value="bias">Bias Analysis</TabsTrigger>
          <TabsTrigger value="causality">Causal Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="liquid-glass">
              <CardHeader>
                <CardTitle>MTTR Trend Analysis</CardTitle>
                <p className="text-sm text-gray-400">
                  Comparing current performance with AI-assisted projections
                </p>
              </CardHeader>
              <CardContent>
                <MTTRTrend />
              </CardContent>
            </Card>

            <Card className="liquid-glass">
              <CardHeader>
                <CardTitle>Cognitive Bias Radar</CardTitle>
                <p className="text-sm text-gray-400">
                  Current bias levels vs targets and industry benchmarks
                </p>
              </CardHeader>
              <CardContent>
                <BiasRadar />
              </CardContent>
            </Card>
          </div>

          <Card className="liquid-glass">
            <CardHeader>
              <CardTitle>Recent Wiz Issues</CardTitle>
              <p className="text-sm text-gray-400">
                Latest security findings with bias detection overlay
              </p>
            </CardHeader>
            <CardContent>
              <IssuesList issues={mockIssues.slice(0, 3)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card className="liquid-glass">
            <CardHeader>
              <CardTitle>All Active Issues</CardTitle>
              <p className="text-sm text-gray-400">
                Complete list of Wiz issues with cognitive analysis
              </p>
            </CardHeader>
            <CardContent>
              <IssuesList issues={mockIssues} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="liquid-glass lg:col-span-2">
              <CardHeader>
                <CardTitle>Bias Detection Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBiasMetrics.map(metric => (
                    <div key={metric.type} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="font-medium text-white">{metric.type} Bias</p>
                          <p className="text-xs text-gray-400">{metric.count} instances detected</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`
                          ${metric.severity === 'critical' ? 'bg-red-500/20 text-red-400' : ''}
                          ${metric.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : ''}
                          ${metric.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                          ${metric.severity === 'low' ? 'bg-blue-500/20 text-blue-400' : ''}
                        `}>
                          {metric.severity}
                        </Badge>
                        <span className={`text-sm font-medium ${
                          metric.trend > 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="liquid-glass">
              <CardHeader>
                <CardTitle>Bias Impact Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-yellow-400 mb-2">92</div>
                    <p className="text-sm text-gray-400">Total Biases This Week</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Decisions Impacted</span>
                      <span className="text-white font-medium">247</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Avg Decision Delay</span>
                      <span className="text-white font-medium">+12 min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">False Positives</span>
                      <span className="text-white font-medium">31</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Prevented Errors</span>
                      <span className="text-green-400 font-medium">18</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="causality">
          <Card className="liquid-glass">
            <CardHeader>
              <CardTitle>Causal Analysis Engine</CardTitle>
              <p className="text-sm text-gray-400">
                Counterfactual reasoning for security decisions
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Causal analysis visualization coming soon</p>
                <p className="text-sm mt-2">
                  This will show counterfactual scenarios and decision impact modeling
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}