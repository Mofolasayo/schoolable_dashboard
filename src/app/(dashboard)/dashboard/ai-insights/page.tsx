'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { getAllWeeklyInsights, type AiInsightItem } from '@/app/actions/kpi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const getCurrentWeek = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

export default function AiInsightsOverviewPage() {
  const [insights, setInsights] = useState<AiInsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [selectedYear] = useState(new Date().getFullYear());

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllWeeklyInsights(selectedWeek, selectedYear);
      const latestByDepartment = new Map<string, AiInsightItem>();

      data.insights.forEach((insight) => {
        const key =
          (insight.department || 'Unknown Team').trim() || 'Unknown Team';
        const existing = latestByDepartment.get(key);
        const currentTime = new Date(insight.generatedAt).getTime();
        const existingTime = existing
          ? new Date(existing.generatedAt).getTime()
          : 0;

        if (!existing || currentTime > existingTime) {
          latestByDepartment.set(key, insight);
        }
      });

      const latestInsights = Array.from(latestByDepartment.values()).sort(
        (a, b) => (a.department || '').localeCompare(b.department || '')
      );

      setInsights(latestInsights);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      setInsights([]);
    }
    setIsLoading(false);
  }, [selectedWeek, selectedYear]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const averageScore = useMemo(() => {
    if (insights.length === 0) return 0;
    return (
      insights.reduce((acc, insight) => acc + insight.kpiScore, 0) /
      insights.length
    );
  }, [insights]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            Loading AI insights...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">AI Insights</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest generated insight per team for Week {selectedWeek}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
              className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-primary/40"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchInsights}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/40 bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Teams covered
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {insights.length}
          </p>
          <p className="text-xs text-muted-foreground">
            Teams with latest insights
          </p>
        </div>
        <div className="rounded-lg border border-border/40 bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Average KPI score
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {averageScore.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Week {selectedWeek} average
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                No insights yet
              </CardTitle>
              <CardDescription>
                AI insights for Week {selectedWeek} haven&apos;t been generated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Check a previous week or generate new insights from the team
                lead dashboard.
              </p>
            </CardContent>
          </Card>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-lg border border-border/40 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {insight.department || 'Team insight'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Week {insight.weekNumber} • {insight.quarter} {insight.year}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-white text-slate-600"
                  >
                    {insight.kpiScore.toFixed(1)}%
                  </Badge>
                  {insight.generationStatus === 'FALLBACK' && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-white text-amber-700"
                    >
                      Fallback
                    </Badge>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{insight.summary}</p>
              <Link
                href={`/dashboard/ai-insights/${insight.id}?week=${selectedWeek}&year=${selectedYear}`}
                className="mt-3 inline-flex text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                View full insight
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
