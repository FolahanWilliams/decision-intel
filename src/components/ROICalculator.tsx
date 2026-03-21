'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Users,
  ChevronRight,
  Calculator,
  Download,
  Share2
} from 'lucide-react';
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ROIInputs {
  // Company metrics
  annualRevenue: number;
  securityTeamSize: number;
  averageSecuritySalary: number;

  // Current performance
  currentMTTR: number; // minutes
  currentMTTD: number; // minutes
  alertsPerDay: number;
  falsePositiveRate: number; // percentage

  // Risk factors
  averageBreachCost: number;
  breachProbability: number; // percentage
  downTimeHourlyCost: number;
  compliancePenalty: number;

  // Wiz specific
  hasWiz: boolean;
  wizAnnualCost: number;
  toxicCombinationsPerMonth: number;
}

interface ROIResults {
  // Improvements
  improvedMTTR: number;
  improvedMTTD: number;
  reducedFalsePositives: number;
  biasReduction: number;

  // Financial
  annualSavings: number;
  breachRiskReduction: number;
  operationalEfficiency: number;
  complianceSavings: number;
  totalROI: number;
  paybackPeriod: number;

  // Productivity
  hoursReclaimed: number;
  alertsReduced: number;
  decisionsImproved: number;
}

const calculateROI = (inputs: ROIInputs): ROIResults => {
  // Performance improvements based on real metrics
  const mttrReduction = 0.37; // 37% reduction
  const mttdReduction = 0.31; // 31% reduction
  const falsePositiveReduction = 0.72; // 72% reduction
  const biasReductionRate = 0.65; // 65% reduction in cognitive biases

  const improvedMTTR = inputs.currentMTTR * (1 - mttrReduction);
  const improvedMTTD = inputs.currentMTTD * (1 - mttdReduction);
  const improvedFalsePositiveRate = inputs.falsePositiveRate * (1 - falsePositiveReduction);

  // Calculate breach risk reduction
  const currentBreachRisk = inputs.breachProbability / 100;
  const improvedBreachRisk = currentBreachRisk * (1 - biasReductionRate);
  const breachRiskReduction = inputs.averageBreachCost * (currentBreachRisk - improvedBreachRisk);

  // Calculate operational efficiency
  const alertsReduced = inputs.alertsPerDay * (improvedFalsePositiveRate / 100);
  const minutesSavedPerAlert = (inputs.currentMTTR - improvedMTTR) + (inputs.currentMTTD - improvedMTTD);
  const hoursReclaimed = (alertsReduced * minutesSavedPerAlert * 365) / 60;
  const operationalEfficiency = hoursReclaimed * (inputs.averageSecuritySalary / 2080); // Annual hours

  // Calculate compliance savings (EU AI Act, DORA)
  const complianceSavings = inputs.compliancePenalty * 0.85; // 85% penalty avoidance

  // Wiz-specific enhancements
  const wizBonus = inputs.hasWiz ? {
    toxicCombinationSavings: inputs.toxicCombinationsPerMonth * 12 * 50000, // $50k per toxic combo prevented
    integrationEfficiency: inputs.wizAnnualCost * 0.15 // 15% more value from Wiz
  } : { toxicCombinationSavings: 0, integrationEfficiency: 0 };

  // Total savings
  const annualSavings =
    breachRiskReduction +
    operationalEfficiency +
    complianceSavings +
    wizBonus.toxicCombinationSavings +
    wizBonus.integrationEfficiency;

  // Decision Intel pricing (tiered)
  const decisionIntelCost =
    inputs.securityTeamSize <= 10 ? 120000 :
    inputs.securityTeamSize <= 50 ? 250000 :
    inputs.securityTeamSize <= 100 ? 400000 : 600000;

  const totalROI = ((annualSavings - decisionIntelCost) / decisionIntelCost) * 100;
  const paybackPeriod = decisionIntelCost / annualSavings * 12; // months

  return {
    improvedMTTR,
    improvedMTTD,
    reducedFalsePositives: improvedFalsePositiveRate,
    biasReduction: biasReductionRate * 100,
    annualSavings,
    breachRiskReduction,
    operationalEfficiency,
    complianceSavings,
    totalROI,
    paybackPeriod,
    hoursReclaimed,
    alertsReduced: alertsReduced * 365,
    decisionsImproved: inputs.alertsPerDay * 365 * biasReductionRate
  };
};

export default function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>({
    annualRevenue: 500000000,
    securityTeamSize: 25,
    averageSecuritySalary: 150000,
    currentMTTR: 72,
    currentMTTD: 18,
    alertsPerDay: 250,
    falsePositiveRate: 15,
    averageBreachCost: 4200000,
    breachProbability: 28,
    downTimeHourlyCost: 10000,
    compliancePenalty: 500000,
    hasWiz: true,
    wizAnnualCost: 500000,
    toxicCombinationsPerMonth: 5
  });

  const [results, setResults] = useState<ROIResults>(calculateROI(inputs));
  const [activeTab, setActiveTab] = useState<'inputs' | 'results'>('inputs');

  useEffect(() => {
    setResults(calculateROI(inputs));
  }, [inputs]);

  const updateInput = (key: keyof ROIInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Chart data
  const savingsBreakdown = [
    { name: 'Breach Risk', value: results.breachRiskReduction, color: '#ef4444' },
    { name: 'Operational', value: results.operationalEfficiency, color: '#22c55e' },
    { name: 'Compliance', value: results.complianceSavings, color: '#3b82f6' },
    { name: 'Wiz Enhanced', value: inputs.hasWiz ? inputs.toxicCombinationsPerMonth * 12 * 50000 : 0, color: '#a855f7' }
  ];

  const performanceComparison = [
    { metric: 'MTTR', current: inputs.currentMTTR, improved: results.improvedMTTR, unit: 'min' },
    { metric: 'MTTD', current: inputs.currentMTTD, improved: results.improvedMTTD, unit: 'min' },
    { metric: 'False Positives', current: inputs.falsePositiveRate, improved: results.reducedFalsePositives, unit: '%' }
  ];

  const monthlyProjection = Array.from({ length: 12 }, (_, i) => ({
    month: `Month ${i + 1}`,
    savings: (results.annualSavings / 12) * (i + 1),
    cost: 250000 * ((i + 1) / 12),
    net: ((results.annualSavings / 12) * (i + 1)) - (250000 * ((i + 1) / 12))
  }));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card className="liquid-glass border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-blue-400" />
              <CardTitle className="text-2xl">ROI Calculator</CardTitle>
              <Badge className="bg-green-500/20 text-green-400">
                Enterprise Security
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-700">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" className="border-gray-700">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b border-gray-800">
            <button
              className={`pb-2 px-1 ${activeTab === 'inputs'
                ? 'border-b-2 border-blue-400 text-blue-400'
                : 'text-gray-400'}`}
              onClick={() => setActiveTab('inputs')}
            >
              Input Parameters
            </button>
            <button
              className={`pb-2 px-1 ${activeTab === 'results'
                ? 'border-b-2 border-blue-400 text-blue-400'
                : 'text-gray-400'}`}
              onClick={() => setActiveTab('results')}
            >
              ROI Analysis
            </button>
          </div>

          {activeTab === 'inputs' ? (
            <div className="space-y-6">
              {/* Company Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Company Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Annual Revenue</Label>
                    <Input
                      type="number"
                      value={inputs.annualRevenue}
                      onChange={(e) => updateInput('annualRevenue', parseFloat(e.target.value))}
                      className="bg-gray-900 border-gray-700"
                    />
                    <span className="text-xs text-gray-400">{formatCurrency(inputs.annualRevenue)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Security Team Size</Label>
                    <Slider
                      value={[inputs.securityTeamSize]}
                      onValueChange={(v) => updateInput('securityTeamSize', v[0])}
                      max={100}
                      min={5}
                      className="mt-2"
                    />
                    <span className="text-sm text-gray-400">{inputs.securityTeamSize} analysts</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Average Salary</Label>
                    <Input
                      type="number"
                      value={inputs.averageSecuritySalary}
                      onChange={(e) => updateInput('averageSecuritySalary', parseFloat(e.target.value))}
                      className="bg-gray-900 border-gray-700"
                    />
                    <span className="text-xs text-gray-400">{formatCurrency(inputs.averageSecuritySalary)}</span>
                  </div>
                </div>
              </div>

              {/* Current Performance */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Current Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>MTTR (minutes)</Label>
                    <Slider
                      value={[inputs.currentMTTR]}
                      onValueChange={(v) => updateInput('currentMTTR', v[0])}
                      max={180}
                      min={15}
                      className="mt-2"
                    />
                    <span className="text-sm text-gray-400">{inputs.currentMTTR} minutes</span>
                  </div>
                  <div className="space-y-2">
                    <Label>MTTD (minutes)</Label>
                    <Slider
                      value={[inputs.currentMTTD]}
                      onValueChange={(v) => updateInput('currentMTTD', v[0])}
                      max={60}
                      min={5}
                      className="mt-2"
                    />
                    <span className="text-sm text-gray-400">{inputs.currentMTTD} minutes</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Alerts per Day</Label>
                    <Slider
                      value={[inputs.alertsPerDay]}
                      onValueChange={(v) => updateInput('alertsPerDay', v[0])}
                      max={1000}
                      min={50}
                      className="mt-2"
                    />
                    <span className="text-sm text-gray-400">{inputs.alertsPerDay} alerts</span>
                  </div>
                  <div className="space-y-2">
                    <Label>False Positive Rate (%)</Label>
                    <Slider
                      value={[inputs.falsePositiveRate]}
                      onValueChange={(v) => updateInput('falsePositiveRate', v[0])}
                      max={50}
                      min={5}
                      className="mt-2"
                    />
                    <span className="text-sm text-gray-400">{inputs.falsePositiveRate}%</span>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Risk Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Average Breach Cost</Label>
                    <Input
                      type="number"
                      value={inputs.averageBreachCost}
                      onChange={(e) => updateInput('averageBreachCost', parseFloat(e.target.value))}
                      className="bg-gray-900 border-gray-700"
                    />
                    <span className="text-xs text-gray-400">{formatCurrency(inputs.averageBreachCost)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Breach Probability (%)</Label>
                    <Slider
                      value={[inputs.breachProbability]}
                      onValueChange={(v) => updateInput('breachProbability', v[0])}
                      max={100}
                      min={5}
                      className="mt-2"
                    />
                    <span className="text-sm text-gray-400">{inputs.breachProbability}%</span>
                  </div>
                </div>
              </div>

              {/* Wiz Integration */}
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Wiz Integration</h3>
                  <input
                    type="checkbox"
                    checked={inputs.hasWiz}
                    onChange={(e) => updateInput('hasWiz', e.target.checked)}
                    className="ml-auto"
                  />
                </div>
                {inputs.hasWiz && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Wiz Annual Cost</Label>
                      <Input
                        type="number"
                        value={inputs.wizAnnualCost}
                        onChange={(e) => updateInput('wizAnnualCost', parseFloat(e.target.value))}
                        className="bg-gray-900 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Toxic Combinations/Month</Label>
                      <Slider
                        value={[inputs.toxicCombinationsPerMonth]}
                        onValueChange={(v) => updateInput('toxicCombinationsPerMonth', v[0])}
                        max={20}
                        min={1}
                        className="mt-2"
                      />
                      <span className="text-sm text-gray-400">{inputs.toxicCombinationsPerMonth}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Annual Savings</p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatCurrency(results.annualSavings)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">ROI</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {results.totalROI.toFixed(0)}%
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Payback Period</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {results.paybackPeriod.toFixed(1)} mo
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Hours Saved</p>
                        <p className="text-2xl font-bold text-orange-400">
                          {formatNumber(results.hoursReclaimed)}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-orange-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Savings Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Savings Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={savingsBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {savingsBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Improvements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={performanceComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="metric" tick={{ fill: '#9CA3AF' }} />
                        <YAxis tick={{ fill: '#9CA3AF' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="current" fill="#ef4444" name="Current" />
                        <Bar dataKey="improved" fill="#22c55e" name="With Decision Intel" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Projection */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">12-Month Financial Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyProjection}>
                      <defs>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" tick={{ fill: '#9CA3AF' }} />
                      <YAxis tick={{ fill: '#9CA3AF' }} tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorSavings)"
                        name="Cumulative Savings"
                      />
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorNet)"
                        name="Net Value"
                      />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        dot={false}
                        name="Investment"
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Impact Summary */}
              <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                <h3 className="text-lg font-semibold mb-4 text-white">Executive Summary</h3>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-300">
                    By implementing Decision Intel with your Wiz deployment, your organization will achieve:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-0.5" />
                      <span><strong className="text-green-400">{formatCurrency(results.annualSavings)}</strong> in annual savings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5" />
                      <span><strong className="text-blue-400">{results.biasReduction.toFixed(0)}%</strong> reduction in cognitive biases</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5" />
                      <span><strong className="text-purple-400">{formatNumber(results.hoursReclaimed)}</strong> hours reclaimed annually</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-orange-400 mt-0.5" />
                      <span><strong className="text-orange-400">{results.paybackPeriod.toFixed(1)}</strong> month payback period</span>
                    </li>
                  </ul>
                  <p className="text-gray-300 mt-4">
                    The platform pays for itself in under {Math.ceil(results.paybackPeriod)} months and delivers
                    a <strong className="text-white">{results.totalROI.toFixed(0)}% ROI</strong> in the first year.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}