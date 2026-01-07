'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { getDashboardStats, getAnalyticsSummary } from '@/app/actions/dashboard';

interface InsightCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  trend: string;
}

interface ChannelData {
  name: string;
  percentage: number;
}

export default function DashboardInsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [channelData, setChannelData] = useState<ChannelData[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [stats, analytics] = await Promise.all([
        getDashboardStats(),
        getAnalyticsSummary().catch(() => null),
      ]);

      // Calculate insights from real data using correct property names
      const totalTasks = stats.taskCompletion.completed + stats.taskCompletion.inProgress + stats.taskCompletion.pending;
      const completionRate = totalTasks > 0
        ? ((stats.taskCompletion.completed / totalTasks) * 100).toFixed(1)
        : '0.0';

      const totalAttendance = stats.attendance.present + stats.attendance.late + stats.attendance.absent;
      const attendanceRate = totalAttendance > 0
        ? (((stats.attendance.present + stats.attendance.late) / totalAttendance) * 100).toFixed(1)
        : '0.0';

      // Build insight cards from real data
      const cards: InsightCard[] = [
        {
          title: 'Task Completion Rate',
          value: `${completionRate}%`,
          change: stats.taskCompletion.completed > stats.taskCompletion.pending ? '+' : '',
          changeType: parseFloat(completionRate) >= 70 ? 'positive' : parseFloat(completionRate) >= 50 ? 'neutral' : 'negative',
          trend: `${stats.taskCompletion.completed} completed, ${stats.taskCompletion.pending} pending`,
        },
        {
          title: 'Attendance Rate',
          value: `${attendanceRate}%`,
          change: '',
          changeType: parseFloat(attendanceRate) >= 90 ? 'positive' : parseFloat(attendanceRate) >= 70 ? 'neutral' : 'negative',
          trend: `${stats.attendance.present} present, ${stats.attendance.late} late`,
        },
        {
          title: 'Overall KPI Score',
          value: `${stats.overallKpi.score}%`,
          change: stats.overallKpi.trend,
          changeType: stats.overallKpi.score >= 70 ? 'positive' : stats.overallKpi.score >= 50 ? 'neutral' : 'negative',
          trend: 'Organization-wide performance',
        },
        {
          title: 'Compliance Score',
          value: `${stats.compliance.score}%`,
          change: stats.compliance.trend,
          changeType: stats.compliance.score >= 90 ? 'positive' : stats.compliance.score >= 70 ? 'neutral' : 'negative',
          trend: `${stats.compliance.openIssues} open issues`,
        },
      ];

      // Add analytics data if available
      if (analytics && analytics.averageAura !== null) {
        cards.push({
          title: 'Avg Aura Score',
          value: analytics.averageAura.toFixed(2),
          change: '',
          changeType: analytics.averageAura >= 3.5 ? 'positive' : 'neutral',
          trend: `${analytics.highPerformers} high performers`,
        });
      }

      setInsightCards(cards);

      // Use task distribution for channel data
      if (stats.taskDistribution && stats.taskDistribution.length > 0) {
        const total = stats.taskDistribution.reduce((sum, d) => sum + d.value, 0);
        const channels = stats.taskDistribution.map(item => ({
          name: item.name,
          percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
        }));
        setChannelData(channels);
      } else {
        // Fallback
        setChannelData([
          { name: 'Completed', percentage: totalTasks > 0 ? Math.round((stats.taskCompletion.completed / totalTasks) * 100) : 0 },
          { name: 'In Progress', percentage: totalTasks > 0 ? Math.round((stats.taskCompletion.inProgress / totalTasks) * 100) : 0 },
          { name: 'Pending', percentage: totalTasks > 0 ? Math.round((stats.taskCompletion.pending / totalTasks) * 100) : 0 },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      setInsightCards([]);
      setChannelData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getChangeIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getChangeColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return 'text-emerald-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="text-sm text-muted-foreground">
            Data visualizations for performance, attendance, and operational efficiency.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-border/40 bg-white px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="ml-auto text-sm font-medium text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Insight Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {insightCards.map((card) => (
          <article
            key={card.title}
            className="rounded-lg border border-border bg-background/80 p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {card.title}
              </span>
              {getChangeIcon(card.changeType)}
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {card.value}
            </p>
            {card.change && (
              <p className={`mt-1 text-xs font-medium ${getChangeColor(card.changeType)}`}>
                {card.change}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">{card.trend}</p>
          </article>
        ))}
      </section>

      {/* Distribution Chart */}
      <section className="rounded-lg border border-border bg-background/80 p-6 shadow-sm">
        <header className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Task Distribution</h2>
            <p className="text-sm text-muted-foreground">
              Current distribution of tasks across different statuses.
            </p>
          </div>
        </header>
        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          {channelData.length > 0 ? (
            channelData.map((channel) => (
              <div
                key={channel.name}
                className="overflow-hidden rounded-md border border-border/80 bg-muted/40"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium text-foreground">{channel.name}</span>
                  <span>{channel.percentage}%</span>
                </div>
                <div className="h-1 w-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${channel.percentage}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No distribution data available</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background/80 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">System Status</p>
              <p className="text-lg font-semibold text-emerald-600">Operational</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/80 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/80 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Points</p>
              <p className="text-lg font-semibold">{insightCards.length + channelData.length}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
