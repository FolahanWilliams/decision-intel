'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Mic,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Activity,
  Target,
  Zap,
  UserX,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';
// import { useMeetings } from '@/hooks/useMeetings';

interface MeetingHealthMetrics {
  participationBalance: number;
  biasLevel: 'low' | 'medium' | 'high';
  dissentHealth: number;
  decisionClarity: number;
  overallHealth: number;
}

export default function MeetingCommandCenter() {
  // const { meetings, loading, error } = useMeetings();
  // const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<MeetingHealthMetrics>({
    participationBalance: 75,
    biasLevel: 'medium',
    dissentHealth: 60,
    decisionClarity: 80,
    overallHealth: 71,
  });

  // Mock real-time updates for demo
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setHealthMetrics(prev => ({
        participationBalance: Math.max(
          0,
          Math.min(100, prev.participationBalance + (Math.random() - 0.5) * 10)
        ),
        biasLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as
          | 'low'
          | 'medium'
          | 'high',
        dissentHealth: Math.max(0, Math.min(100, prev.dissentHealth + (Math.random() - 0.5) * 8)),
        decisionClarity: Math.max(
          0,
          Math.min(100, prev.decisionClarity + (Math.random() - 0.5) * 5)
        ),
        overallHealth: Math.max(0, Math.min(100, prev.overallHealth + (Math.random() - 0.5) * 6)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meeting Intelligence Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Real-time meeting quality monitoring and insights
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={isLive ? 'destructive' : 'default'}
            onClick={() => setIsLive(!isLive)}
            className="gap-2"
          >
            {isLive ? (
              <>
                <Pause className="h-4 w-4" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Live Monitor
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Live Meeting Status */}
      {isLive && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <Activity className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <span className="font-semibold">Live Monitoring Active</span> - Analyzing meeting in
            real-time. Quality predictions update as the meeting progresses.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Health Indicators - Left Column */}
        <div className="col-span-3 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Meeting Health
            </h3>
            <div className="space-y-3">
              <HealthIndicator
                label="Overall Health"
                value={healthMetrics.overallHealth}
                icon={<Zap className="h-4 w-4" />}
              />
              <HealthIndicator
                label="Participation"
                value={healthMetrics.participationBalance}
                icon={<Users className="h-4 w-4" />}
              />
              <HealthIndicator
                label="Healthy Dissent"
                value={healthMetrics.dissentHealth}
                icon={<MessageSquare className="h-4 w-4" />}
              />
              <HealthIndicator
                label="Decision Clarity"
                value={healthMetrics.decisionClarity}
                icon={<Target className="h-4 w-4" />}
              />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Bias Alert Level
            </h3>
            <BiasAlertLevel level={healthMetrics.biasLevel} />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <UserX className="h-4 w-4 mr-2" />
                Flag Dominance
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Bias Check
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Request Input
              </Button>
            </div>
          </Card>
        </div>

        {/* Central Visualization Area */}
        <div className="col-span-6 space-y-4">
          <Tabs defaultValue="speakers" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="speakers">Speakers</TabsTrigger>
              <TabsTrigger value="biases">Bias Map</TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="speakers" className="mt-4">
              <SpeakerDominanceView isLive={isLive} />
            </TabsContent>

            <TabsContent value="biases" className="mt-4">
              <BiasHeatMap />
            </TabsContent>

            <TabsContent value="decisions" className="mt-4">
              <DecisionTracker />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <MeetingTimeline />
            </TabsContent>
          </Tabs>

          {/* Quality Prediction */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quality Prediction
              </h3>
              <Badge variant={healthMetrics.overallHealth > 70 ? 'default' : 'destructive'}>
                {healthMetrics.overallHealth}% Confidence
              </Badge>
            </div>
            <QualityPredictionChart prediction={healthMetrics.overallHealth} />
          </Card>
        </div>

        {/* Right Panel - Insights & Actions */}
        <div className="col-span-3 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Live Insights</h3>
            <LiveInsightsFeed isLive={isLive} />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Recommended Actions</h3>
            <RecommendedActions metrics={healthMetrics} />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Action Items</h3>
            <ActionItemsTracker />
          </Card>
        </div>
      </div>
    </div>
  );
}

// Health Indicator Component
function HealthIndicator({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  const getColor = () => {
    if (value >= 75) return 'text-green-600 bg-green-100';
    if (value >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <div className={`p-1 rounded ${getColor()}`}>{icon}</div>
          {label}
        </span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

// Bias Alert Level Component
function BiasAlertLevel({ level }: { level: 'low' | 'medium' | 'high' }) {
  const configs = {
    low: {
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: <CheckCircle2 className="h-5 w-5" />,
      message: 'Bias levels are under control',
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: <AlertTriangle className="h-5 w-5" />,
      message: 'Moderate bias detected - monitor closely',
    },
    high: {
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: <XCircle className="h-5 w-5" />,
      message: 'High bias alert - intervention recommended',
    },
  };

  const config = configs[level];

  return (
    <div className={`p-3 rounded-lg border ${config.color}`}>
      <div className="flex items-center gap-2">
        {config.icon}
        <div>
          <p className="font-semibold capitalize">{level} Risk</p>
          <p className="text-xs mt-0.5">{config.message}</p>
        </div>
      </div>
    </div>
  );
}

// Speaker Dominance View
function SpeakerDominanceView({ isLive }: { isLive: boolean }) {
  const [speakers, setSpeakers] = useState([
    { name: 'Alice Johnson', talkTime: 35, interruptions: 2, active: true },
    { name: 'Bob Smith', talkTime: 25, interruptions: 1, active: false },
    { name: 'Charlie Davis', talkTime: 20, interruptions: 0, active: false },
    { name: 'Diana Wilson', talkTime: 15, interruptions: 3, active: false },
    { name: 'Eve Brown', talkTime: 5, interruptions: 0, active: false },
  ]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setSpeakers(prev => {
        const newSpeakers = [...prev];
        const activeIndex = Math.floor(Math.random() * newSpeakers.length);
        newSpeakers.forEach((s, i) => {
          s.active = i === activeIndex;
          if (s.active) {
            s.talkTime = Math.min(100, s.talkTime + Math.random() * 2);
          }
        });
        return newSpeakers;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {speakers.map(speaker => (
          <div key={speaker.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    speaker.active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                  }`}
                />
                <span className="font-medium">{speaker.name}</span>
                {speaker.active && <Mic className="h-3 w-3 text-green-600" />}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{speaker.talkTime.toFixed(0)}%</span>
                {speaker.interruptions > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {speaker.interruptions} interruptions
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={speaker.talkTime} className="h-2" />
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Dominance Alert:</strong> Alice has spoken for 35% of the meeting. Consider
          encouraging input from quieter participants.
        </p>
      </div>
    </Card>
  );
}

// Bias Heat Map Component
function BiasHeatMap() {
  const biasData = [
    { type: 'Confirmation Bias', alice: 3, bob: 7, charlie: 2, diana: 5, eve: 1 },
    { type: 'Groupthink', alice: 2, bob: 4, charlie: 8, diana: 6, eve: 3 },
    { type: 'Anchoring', alice: 5, bob: 2, charlie: 3, diana: 4, eve: 2 },
    { type: 'Availability', alice: 4, bob: 3, charlie: 5, diana: 2, eve: 6 },
  ];

  const speakers = ['alice', 'bob', 'charlie', 'diana', 'eve'];

  const getHeatColor = (value: number) => {
    if (value <= 2) return 'bg-green-100';
    if (value <= 4) return 'bg-yellow-100';
    if (value <= 6) return 'bg-orange-200';
    return 'bg-red-300';
  };

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-2">Bias Type</th>
              {speakers.map(s => (
                <th key={s} className="text-center p-2 capitalize">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {biasData.map(bias => (
              <tr key={bias.type}>
                <td className="p-2 font-medium">{bias.type}</td>
                {speakers.map(speaker => (
                  <td key={speaker} className="p-2 text-center">
                    <div
                      className={`w-10 h-10 mx-auto rounded flex items-center justify-center ${getHeatColor(
                        bias[speaker as keyof typeof bias] as number
                      )}`}
                    >
                      {bias[speaker as keyof typeof bias]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-100 rounded" />
          <span>Low (0-2)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-100 rounded" />
          <span>Medium (3-4)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-200 rounded" />
          <span>High (5-6)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-300 rounded" />
          <span>Critical (7+)</span>
        </div>
      </div>
    </Card>
  );
}

// Decision Tracker Component
function DecisionTracker() {
  const decisions = [
    {
      id: 1,
      time: '10:15',
      decision: 'Increase Q3 budget by 20%',
      speaker: 'Alice Johnson',
      explicit: true,
      hasRationale: true,
      dissent: 2,
      quality: 85,
    },
    {
      id: 2,
      time: '10:32',
      decision: 'Postpone product launch to Q4',
      speaker: 'Bob Smith',
      explicit: false,
      hasRationale: false,
      dissent: 0,
      quality: 45,
    },
    {
      id: 3,
      time: '10:45',
      decision: 'Hire 3 additional engineers',
      speaker: 'Charlie Davis',
      explicit: true,
      hasRationale: true,
      dissent: 3,
      quality: 78,
    },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {decisions.map(decision => (
          <div key={decision.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium">{decision.decision}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {decision.speaker} • {decision.time}
                </p>
              </div>
              <Badge variant={decision.quality > 70 ? 'default' : 'destructive'}>
                {decision.quality}% Quality
              </Badge>
            </div>

            <div className="flex gap-2 mt-3">
              {decision.explicit && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Explicit
                </Badge>
              )}
              {decision.hasRationale && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Rationale
                </Badge>
              )}
              {decision.dissent > 0 && (
                <Badge variant="outline" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Dissent: {decision.dissent}
                </Badge>
              )}
            </div>

            {decision.quality < 60 && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Low quality decision - consider revisiting with more discussion
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// Meeting Timeline Component
function MeetingTimeline() {
  const events = [
    { time: '10:00', type: 'start', label: 'Meeting Started' },
    { time: '10:05', type: 'speaker', label: 'Alice introduces agenda' },
    { time: '10:15', type: 'decision', label: 'Budget decision made' },
    { time: '10:20', type: 'bias', label: 'High groupthink detected' },
    { time: '10:32', type: 'decision', label: 'Product launch postponed' },
    { time: '10:40', type: 'intervention', label: 'Facilitator requested input from Eve' },
    { time: '10:45', type: 'decision', label: 'Hiring decision made' },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Play className="h-4 w-4" />;
      case 'speaker':
        return <Mic className="h-4 w-4" />;
      case 'decision':
        return <Target className="h-4 w-4" />;
      case 'bias':
        return <AlertTriangle className="h-4 w-4" />;
      case 'intervention':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'decision':
        return 'bg-blue-100 text-blue-800';
      case 'bias':
        return 'bg-red-100 text-red-800';
      case 'intervention':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-3">
        {events.map((event, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="text-sm text-muted-foreground font-mono">{event.time}</div>
            <div className={`p-1.5 rounded ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm">{event.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Quality Prediction Chart
function QualityPredictionChart({ prediction }: { prediction: number }) {
  const getColor = () => {
    if (prediction >= 75) return '#22c55e';
    if (prediction >= 50) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="relative h-32">
      <svg width="100%" height="100%" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="qualityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d="M 20 80 A 70 70 0 0 1 180 80"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M 20 80 A 70 70 0 0 1 ${20 + (160 * prediction) / 100} 80`}
          fill="none"
          stroke="url(#qualityGradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Center text */}
        <text x="100" y="60" textAnchor="middle" className="text-3xl font-bold" fill={getColor()}>
          {prediction}%
        </text>
        <text x="100" y="80" textAnchor="middle" className="text-xs" fill="#94a3b8">
          Predicted Quality
        </text>
      </svg>
    </div>
  );
}

// Live Insights Feed
function LiveInsightsFeed({ isLive }: { isLive: boolean }) {
  const [insights, setInsights] = useState([
    {
      time: '10:45',
      message: 'Charlie showed strong leadership in decision-making',
      type: 'positive',
    },
    { time: '10:42', message: 'Eve has not spoken in 15 minutes', type: 'warning' },
    { time: '10:38', message: 'Groupthink pattern emerging in budget discussion', type: 'danger' },
    { time: '10:35', message: 'Good dissent level on product timeline', type: 'positive' },
  ]);

  useEffect(() => {
    if (!isLive) return;

    const messages = [
      'New speaker joining the discussion',
      'Bias level increasing in current topic',
      'Healthy debate detected',
      'Decision made without full consensus',
      'Silent participant alert',
    ];

    const interval = setInterval(() => {
      const newInsight = {
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        message: messages[Math.floor(Math.random() * messages.length)],
        type: ['positive', 'warning', 'danger'][Math.floor(Math.random() * 3)] as
          | 'positive'
          | 'warning'
          | 'danger',
      };

      setInsights(prev => [newInsight, ...prev.slice(0, 3)]);
    }, 8000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'danger':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {insights.map((insight, idx) => (
        <div key={idx} className="flex gap-2 text-sm">
          {getInsightIcon(insight.type)}
          <div className="flex-1">
            <p>{insight.message}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{insight.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Recommended Actions Component
function RecommendedActions({ metrics }: { metrics: MeetingHealthMetrics }) {
  const getRecommendations = () => {
    const recs = [];

    if (metrics.participationBalance < 60) {
      recs.push({
        action: 'Request input from quiet participants',
        urgency: 'high',
        icon: <Users className="h-4 w-4" />,
      });
    }

    if (metrics.biasLevel === 'high') {
      recs.push({
        action: 'Conduct bias check exercise',
        urgency: 'high',
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }

    if (metrics.dissentHealth < 50) {
      recs.push({
        action: "Appoint a devil's advocate",
        urgency: 'medium',
        icon: <MessageSquare className="h-4 w-4" />,
      });
    }

    if (metrics.decisionClarity < 70) {
      recs.push({
        action: 'Clarify and document decisions',
        urgency: 'medium',
        icon: <Target className="h-4 w-4" />,
      });
    }

    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-2">
      {recommendations.length > 0 ? (
        recommendations.map((rec, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${
              rec.urgency === 'high' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`p-1 rounded ${
                  rec.urgency === 'high'
                    ? 'bg-red-200 text-red-700'
                    : 'bg-yellow-200 text-yellow-700'
                }`}
              >
                {rec.icon}
              </div>
              <p className="text-sm flex-1">{rec.action}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No immediate actions needed - meeting is healthy
        </p>
      )}
    </div>
  );
}

// Action Items Tracker
function ActionItemsTracker() {
  const [items, setItems] = useState([
    { id: 1, text: 'Review Q3 budget allocation', owner: 'Alice', completed: false },
    { id: 2, text: 'Schedule follow-up on product timeline', owner: 'Bob', completed: false },
    { id: 3, text: 'Send hiring requirements to HR', owner: 'Charlie', completed: true },
  ]);

  const toggleItem = (id: number) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          className={`flex items-start gap-2 p-2 rounded ${item.completed ? 'opacity-60' : ''}`}
        >
          <button
            onClick={() => toggleItem(item.id)}
            className={`mt-0.5 h-4 w-4 rounded border ${
              item.completed
                ? 'bg-green-600 border-green-600'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {item.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
          </button>
          <div className="flex-1">
            <p className={`text-sm ${item.completed ? 'line-through' : ''}`}>{item.text}</p>
            <p className="text-xs text-muted-foreground">{item.owner}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
