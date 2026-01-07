'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    SparklesIcon,
    LightBulbIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getAllWeeklyInsights, type AiInsightItem } from '@/lib/api/backend';

export default function AiInsightsOverviewPage() {
    const [insights, setInsights] = useState<AiInsightItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState(() => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    });
    const [selectedYear] = useState(new Date().getFullYear());
    const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const data = await getAllWeeklyInsights(selectedWeek, selectedYear);
            setInsights(data.insights);
        } catch (error) {
            console.error('Failed to fetch insights:', error);
            setInsights([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInsights();
    }, [selectedWeek, selectedYear]);

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-indigo-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 90) return 'bg-green-50 border-green-200';
        if (score >= 80) return 'bg-blue-50 border-blue-200';
        if (score >= 70) return 'bg-indigo-50 border-indigo-200';
        if (score >= 60) return 'bg-amber-50 border-amber-200';
        return 'bg-red-50 border-red-200';
    };

    const averageScore = insights.length > 0
        ? insights.reduce((acc, i) => acc + i.kpiScore, 0) / insights.length
        : 0;

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-120px)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm text-muted-foreground">Loading AI insights...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        AI Insights Overview
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Weekly AI-generated performance insights across all teams
                    </p>
                </div>

                {/* Week Selector */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-5 w-5 text-muted-foreground" />
                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                            className="rounded-lg border border-border/40 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-primary/40"
                        >
                            {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                                <option key={week} value={week}>Week {week}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={fetchInsights}
                        className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <SparklesIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{insights.length}</p>
                            <p className="text-xs text-muted-foreground">Insights Generated</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                            <ChartBarIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                                {averageScore.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Avg KPI Score</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                            <LightBulbIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {insights.filter(i => i.kpiScore >= 80).length}
                            </p>
                            <p className="text-xs text-muted-foreground">High Performers</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Insights List */}
            <div className="space-y-4">
                {insights.map((insight, index) => (
                    <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-xl border bg-white shadow-sm transition-all ${expandedInsight === insight.id ? 'border-primary/40' : 'border-border/40'
                            }`}
                    >
                        {/* Insight Header */}
                        <div
                            onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                            className="flex cursor-pointer items-center justify-between p-5"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${getScoreBgColor(insight.kpiScore)}`}>
                                    <span className={`text-lg font-bold ${getScoreColor(insight.kpiScore)}`}>
                                        {insight.kpiScore.toFixed(0)}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">{insight.department}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Week {insight.weekNumber} • {insight.quarter} {insight.year}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground">
                                    {new Date(insight.generatedAt).toLocaleDateString()}
                                </span>
                                <ChevronDownIcon
                                    className={`h-5 w-5 text-muted-foreground transition-transform ${expandedInsight === insight.id ? 'rotate-180' : ''
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedInsight === insight.id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-border/40 p-5"
                            >
                                {/* Summary */}
                                <div className="mb-4 rounded-lg bg-gray-50 p-4">
                                    <p className="text-sm text-foreground">{insight.summary}</p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {/* Top Performing */}
                                    {insight.insights && 'topPerforming' in insight.insights && (
                                        <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
                                            <div className="mb-2 flex items-center gap-2 text-green-600">
                                                <CheckCircleIcon className="h-4 w-4" />
                                                <span className="text-xs font-semibold">Top Performing</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {(insight.insights.topPerforming as string[] || []).slice(0, 3).map((item, i) => (
                                                    <li key={i} className="text-xs text-foreground">• {item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Needs Attention */}
                                    {insight.insights && 'needsAttention' in insight.insights && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                                            <div className="mb-2 flex items-center gap-2 text-amber-600">
                                                <ExclamationTriangleIcon className="h-4 w-4" />
                                                <span className="text-xs font-semibold">Needs Attention</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {(insight.insights.needsAttention as string[] || []).slice(0, 3).map((item, i) => (
                                                    <li key={i} className="text-xs text-foreground">• {item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {insight.recommendations && 'items' in insight.recommendations && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                                            <div className="mb-2 flex items-center gap-2 text-blue-600">
                                                <LightBulbIcon className="h-4 w-4" />
                                                <span className="text-xs font-semibold">Recommendations</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {(insight.recommendations.items as string[] || []).slice(0, 3).map((item, i) => (
                                                    <li key={i} className="text-xs text-foreground">• {item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Risk Alerts */}
                                {insight.riskAlerts && 'items' in insight.riskAlerts && (insight.riskAlerts.items as string[] || []).length > 0 && (
                                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
                                        <div className="mb-2 flex items-center gap-2 text-red-600">
                                            <ExclamationTriangleIcon className="h-4 w-4" />
                                            <span className="text-xs font-semibold">Risk Alerts</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {(insight.riskAlerts.items as string[] || []).map((item, i) => (
                                                <li key={i} className="text-xs text-foreground">• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {insights.length === 0 && (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-border/40 bg-white">
                    <SparklesIcon className="h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-sm text-muted-foreground">No AI insights available for this week</p>
                    <p className="text-xs text-muted-foreground">Try selecting a different week or generate new insights from team dashboards</p>
                </div>
            )}
        </div>
    );
}
