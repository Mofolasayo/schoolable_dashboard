import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import { getAllWeeklyInsights } from '@/app/actions/kpi';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PageProps = {
  params: { id: string };
  searchParams?: { week?: string; year?: string };
};

const getCurrentWeek = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const toList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0
    );
  }
  if (typeof value === 'string') {
    return value.trim().length > 0 ? [value] : [];
  }
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    return toList(objectValue.items ?? objectValue.list ?? objectValue.values);
  }
  return [];
};

const getScoreTone = (score: number | null) => {
  if (score === null || Number.isNaN(score)) {
    return {
      label: 'No score',
      badge: 'border-slate-200 bg-slate-50 text-slate-600',
      panel: 'border-slate-200 bg-slate-50/50 text-slate-700',
    };
  }
  if (score >= 80) {
    return {
      label: 'Strong',
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      panel: 'border-emerald-100 bg-emerald-50/60 text-emerald-800',
    };
  }
  if (score >= 60) {
    return {
      label: 'On track',
      badge: 'border-blue-200 bg-blue-50 text-blue-700',
      panel: 'border-blue-100 bg-blue-50/60 text-blue-800',
    };
  }
  if (score >= 45) {
    return {
      label: 'Watch',
      badge: 'border-amber-200 bg-amber-50 text-amber-700',
      panel: 'border-amber-100 bg-amber-50/60 text-amber-800',
    };
  }
  return {
    label: 'At risk',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    panel: 'border-rose-100 bg-rose-50/60 text-rose-800',
  };
};

export default async function AiInsightDetailPage({
  params,
  searchParams,
}: PageProps) {
  const weekNumber = Number(searchParams?.week) || getCurrentWeek();
  const year = Number(searchParams?.year) || new Date().getFullYear();
  const data = await getAllWeeklyInsights(weekNumber, year);
  const insight = data.insights.find((item) => item.id === params.id) || null;

  if (!insight) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-normal text-gray-800">
              AI Insight Detail
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Insight not found for Week {weekNumber}.
            </p>
          </div>
          <Link
            href="/dashboard/ai-insights"
            className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to insights
          </Link>
        </div>

        <Card className="border-dashed border-border/60 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              No insight to display
            </CardTitle>
            <CardDescription>
              Pick a different week or regenerate insights from the team lead
              portal.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const topPerforming = toList(
    (insight.insights as Record<string, unknown> | undefined)?.topPerforming
  );
  const needsAttention = toList(
    (insight.insights as Record<string, unknown> | undefined)?.needsAttention
  );
  const achievements = toList(
    (insight.insights as Record<string, unknown> | undefined)?.achievements
  );
  const challenges = toList(
    (insight.insights as Record<string, unknown> | undefined)?.challenges
  );
  const recommendations = toList(
    (insight.recommendations as Record<string, unknown> | undefined)?.items ??
      insight.recommendations
  );
  const riskAlerts = toList(
    (insight.riskAlerts as Record<string, unknown> | undefined)?.items ??
      insight.riskAlerts
  );
  const scoreTone = getScoreTone(insight.kpiScore ?? null);
  const scoreBreakdown = (insight.scoreBreakdown ??
    insight.rawAiResponse?.scoreBreakdown) as
    | Record<string, unknown>
    | undefined;
  const baselineScore =
    typeof scoreBreakdown?.kpiProgressScore === 'number'
      ? scoreBreakdown.kpiProgressScore
      : null;
  const reportAvailable =
    typeof scoreBreakdown?.reportAvailable === 'boolean'
      ? scoreBreakdown.reportAvailable
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            AI Insight Detail
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {insight.department || 'Team insight'} • Week {insight.weekNumber} •{' '}
            {insight.quarter} {insight.year}
          </p>
        </div>
        <Link
          href="/dashboard/ai-insights"
          className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to insights
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/40 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              KPI score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold text-slate-900">
              {insight.kpiScore != null
                ? `${insight.kpiScore.toFixed(1)}%`
                : 'N/A'}
            </div>
            <Badge variant="outline" className={scoreTone.badge}>
              {scoreTone.label}
            </Badge>
            {baselineScore != null && (
              <div className="text-xs text-slate-500">
                KPI baseline: {baselineScore.toFixed(1)}%
              </div>
            )}
            {reportAvailable !== null && (
              <div className="text-xs text-slate-500">
                Report: {reportAvailable ? 'Available' : 'Unavailable'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Insight window
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              Week {insight.weekNumber}
            </div>
            <p className="text-xs text-muted-foreground">
              {insight.quarter} {insight.year}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Sparkles className="h-4 w-4 text-slate-400" />
              {formatDate(insight.generatedAt)}
            </div>
            <p className="text-xs text-muted-foreground">
              Latest AI output for the week.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Summary
          </CardTitle>
          <CardDescription>Highlights from the AI analysis.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-slate-700">
          {insight.summary}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/40 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Top performing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {topPerforming.length > 0 ? (
              topPerforming.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Target className="mt-1 h-3.5 w-3.5 text-slate-400" />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No highlights yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {needsAttention.length > 0 ? (
              needsAttention.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertTriangle className="mt-1 h-3.5 w-3.5 text-slate-400" />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No blockers identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {(achievements.length > 0 || challenges.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {achievements.length > 0 && (
            <Card className="border-border/40 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                {achievements.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-3.5 w-3.5 text-slate-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {challenges.length > 0 && (
            <Card className="border-border/40 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                {challenges.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertTriangle className="mt-1 h-3.5 w-3.5 text-slate-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card className="border-border/40 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {recommendations.length > 0 ? (
            recommendations.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <Target className="mt-1 h-3.5 w-3.5 text-slate-400" />
                <span>{item}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No recommendations yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Risk alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {riskAlerts.length > 0 ? (
            riskAlerts.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <ShieldAlert className="mt-1 h-3.5 w-3.5 text-slate-400" />
                <span>{item}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No risks flagged this week.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
