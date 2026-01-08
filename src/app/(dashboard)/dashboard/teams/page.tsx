'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    UsersIcon,
    ChartBarIcon,
    TrophyIcon,
    ArrowTrendingUpIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    ChevronRightIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { getAllTeamScores, getAllTeamKpis, type TeamQuarterlyScore, type TeamKpi } from '@/lib/api/backend';

interface TeamDetail {
    department: string;
    teamName: string;
    teamLeadId: string;
    score: number;
    grade: string;
    kpiCount: number;
    kpis: TeamKpi[];
    quarterlyScore?: TeamQuarterlyScore;
}

export default function TeamsOverviewPage() {
    const [teams, setTeams] = useState<TeamDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuarter, setSelectedQuarter] = useState<string>(() => {
        const month = new Date().getMonth() + 1;
        if (month <= 3) return 'Q1';
        if (month <= 6) return 'Q2';
        if (month <= 9) return 'Q3';
        return 'Q4';
    });
    const [selectedYear] = useState(new Date().getFullYear());
    const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null);
    const [averageScore, setAverageScore] = useState(0);

    useEffect(() => {
        const fetchTeamData = async () => {
            setIsLoading(true);
            try {
                const [scoresData, kpisData] = await Promise.all([
                    getAllTeamScores(selectedQuarter, selectedYear),
                    getAllTeamKpis(selectedQuarter, selectedYear),
                ]);

                // Group KPIs by department
                const kpisByDept: Record<string, TeamKpi[]> = {};
                kpisData.kpis.forEach((kpi) => {
                    if (!kpisByDept[kpi.department]) {
                        kpisByDept[kpi.department] = [];
                    }
                    kpisByDept[kpi.department]!.push(kpi);
                });

                // Combine team scores with KPIs
                const teamDetails: TeamDetail[] = scoresData.teams.map((team) => ({
                    department: team.department,
                    teamName: team.teamName,
                    teamLeadId: team.id,
                    score: team.overallTeamScore,
                    grade: team.grade,
                    kpiCount: kpisByDept[team.department]?.length || 0,
                    kpis: kpisByDept[team.department] || [],
                    quarterlyScore: team,
                }));

                setTeams(teamDetails);
                setAverageScore(scoresData.averageScore || 0);
            } catch (error) {
                console.error('Failed to fetch team data:', error);
            }
            setIsLoading(false);
        };

        fetchTeamData();
    }, [selectedQuarter, selectedYear]);

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A+':
            case 'A':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'A-':
            case 'B+':
                return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'B':
            case 'B-':
                return 'text-indigo-600 bg-indigo-100 border-indigo-200';
            case 'C+':
            case 'C':
                return 'text-amber-600 bg-amber-100 border-amber-200';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-indigo-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-120px)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm text-muted-foreground">Loading teams...</p>
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
                        Teams Overview
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View all teams, their KPIs, and quarterly performance scores
                    </p>
                </div>

                {/* Quarter Selector */}
                <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5 text-muted-foreground" />
                    <select
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(e.target.value)}
                        className="rounded-lg border border-border/40 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-primary/40"
                    >
                        <option value="Q1">Q1 {selectedYear}</option>
                        <option value="Q2">Q2 {selectedYear}</option>
                        <option value="Q3">Q3 {selectedYear}</option>
                        <option value="Q4">Q4 {selectedYear}</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <UserGroupIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{teams.length}</p>
                            <p className="text-xs text-muted-foreground">Total Teams</p>
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
                            <TrophyIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{averageScore.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Avg Team Score</p>
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <ChartBarIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {teams.reduce((acc, t) => acc + t.kpiCount, 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Active KPIs</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                            <ArrowTrendingUpIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {teams.filter((t) => t.score >= 80).length}
                            </p>
                            <p className="text-xs text-muted-foreground">High Performers</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team, index) => (
                    <motion.div
                        key={team.department}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedTeam(team)}
                        className="cursor-pointer rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                                    <UsersIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">{team.teamName || team.department}</h3>
                                    <p className="text-xs text-muted-foreground">{team.department}</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${getGradeColor(team.grade)}`}>
                                {team.grade}
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className={`text-xl font-bold ${getScoreColor(team.score)}`}>{team.score.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">Score</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-xl font-bold text-foreground">{team.kpiCount}</p>
                                <p className="text-xs text-muted-foreground">KPIs</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                            <span className="text-xs text-muted-foreground">View Details</span>
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {teams.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 py-16"
                >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <UserGroupIcon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">No Team Data Yet</h3>
                    <p className="mb-4 max-w-md text-center text-sm text-muted-foreground">
                        Team performance data for {selectedQuarter} {selectedYear} is not available yet.
                        Teams are created automatically when team leads are assigned and KPIs are configured.
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                        <a href="/dashboard/hr-policy" className="text-primary hover:underline">
                            → Configure Team Leads
                        </a>
                        <span className="text-muted-foreground">|</span>
                        <a href="/dashboard/settings" className="text-primary hover:underline">
                            → Set Up KPIs
                        </a>
                    </div>
                </motion.div>
            )}

            {/* Team Detail Modal */}
            {selectedTeam && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedTeam(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Purple Gradient Header */}
                        <div className="relative bg-gradient-to-br from-violet-600 to-purple-600 px-6 py-6 text-white">
                            <button
                                onClick={() => setSelectedTeam(null)}
                                className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition-colors"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                    <UsersIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedTeam.teamName || selectedTeam.department}</h2>
                                    <p className="text-sm text-violet-100">{selectedTeam.kpiCount} KPIs • {selectedQuarter} {selectedYear}</p>
                                </div>
                            </div>

                            {/* Stats Row in Header */}
                            <div className="mt-6 grid grid-cols-4 gap-3">
                                <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
                                    <p className={`text-2xl font-bold ${selectedTeam.score >= 70 ? 'text-green-300' : 'text-amber-300'}`}>
                                        {selectedTeam.score.toFixed(0)}%
                                    </p>
                                    <p className="text-[10px] text-violet-100">Overall Score</p>
                                </div>
                                <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
                                    <p className="text-2xl font-bold">
                                        {selectedTeam.quarterlyScore?.kpiAchievementScore?.toFixed(0) || 0}%
                                    </p>
                                    <p className="text-[10px] text-violet-100">KPI Achievement</p>
                                </div>
                                <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
                                    <p className="text-2xl font-bold">{selectedTeam.kpiCount}</p>
                                    <p className="text-[10px] text-violet-100">Active KPIs</p>
                                </div>
                                <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3">
                                    <p className="text-2xl font-bold">{selectedTeam.grade}</p>
                                    <p className="text-[10px] text-violet-100">Grade</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-[50vh] overflow-y-auto p-6">
                            {/* AI Summary */}
                            {selectedTeam.quarterlyScore?.aiSummary && (
                                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <StarIcon className="h-5 w-5" />
                                        <span className="text-sm font-semibold">AI Summary</span>
                                    </div>
                                    <p className="mt-2 text-sm text-foreground">{selectedTeam.quarterlyScore.aiSummary}</p>
                                </div>
                            )}

                            {/* Department KPIs */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                                    Department KPIs ({selectedTeam.kpiCount})
                                </h3>
                                {selectedTeam.kpis.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedTeam.kpis.map((kpi) => (
                                            <div
                                                key={kpi.id}
                                                className="flex items-center justify-between rounded-lg border border-border/40 bg-gray-50 p-3"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-foreground">{kpi.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Target: {kpi.targetValue} {kpi.targetUnit} • Weight: {kpi.weight}%
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {kpi.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-border/60 bg-gray-50/50 py-8 text-center">
                                        <ChartBarIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
                                        <p className="mt-2 text-sm text-muted-foreground">No KPIs defined for this department yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border/40 p-4">
                            <button
                                onClick={() => setSelectedTeam(null)}
                                className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
