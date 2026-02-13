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
} from '@heroicons/react/24/outline';
import {
  getAllTeamScores,
  getAllTeamKpis,
  type TeamQuarterlyScore,
  type TeamKpi,
} from '@/app/actions/kpi';
import { getTeamLeads, type TeamLead } from '@/app/actions/hr-management';
import { useRouter } from 'next/navigation';

interface TeamDetail {
  department: string;
  teamName: string;
  teamLeadId: string;
  score: number;
  grade: string;
  kpiCount: number;
  kpiAchievementScore: number;
  individualAvgScore: number;
  kpis: TeamKpi[];
  quarterlyScore?: TeamQuarterlyScore;
}

export default function TeamsOverviewPage() {
  const router = useRouter();
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
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    const fetchTeamData = async () => {
      setIsLoading(true);
      try {
        const [scoresData, kpisData, teamLeads] = await Promise.all([
          getAllTeamScores(selectedQuarter, selectedYear),
          getAllTeamKpis(selectedQuarter, selectedYear),
          getTeamLeads(),
        ]);

        // Group KPIs by team lead (fallback to department)
        const kpisByLead: Record<string, TeamKpi[]> = {};
        const kpisByDept: Record<string, TeamKpi[]> = {};
        kpisData.kpis.forEach((kpi) => {
          const deptKey = kpi.department?.toLowerCase() || '';
          const leadKey =
            kpi.teamLeadId?.toLowerCase?.() || kpi.teamLeadId || '';
          if (!kpisByDept[deptKey]) {
            kpisByDept[deptKey] = [];
          }
          kpisByDept[deptKey]!.push(kpi);

          if (leadKey) {
            if (!kpisByLead[leadKey]) {
              kpisByLead[leadKey] = [];
            }
            kpisByLead[leadKey]!.push(kpi);
          }
        });

        // Combine team scores with KPIs
        const teamDetailsByKey = new Map<string, TeamDetail>();

        scoresData.teams.forEach((team) => {
          const deptKey = team.department?.toLowerCase() || '';
          const teamKey =
            team.teamLeadId || team.teamName?.toLowerCase() || deptKey;
          const leadKey =
            team.teamLeadId?.toLowerCase?.() || team.teamLeadId || '';
          const kpis = leadKey
            ? kpisByLead[leadKey] || []
            : kpisByDept[deptKey] || [];
          const breakdown = team.scoreBreakdown || {};
          const kpiAchievement =
            typeof team.kpiAchievementScore === 'number'
              ? team.kpiAchievementScore
              : ((breakdown as Record<string, unknown>)?.teamKpiScore as
                  | number
                  | undefined) ||
                ((breakdown as Record<string, unknown>)?.kpiProgressScore as
                  | number
                  | undefined) ||
                0;
          const individualAvg =
            typeof team.individualAvgScore === 'number'
              ? team.individualAvgScore
              : ((breakdown as Record<string, unknown>)
                  ?.individualKpiAverage as number | undefined) || 0;
          teamDetailsByKey.set(teamKey, {
            department: team.department,
            teamName: team.teamName,
            teamLeadId: team.teamLeadId || '',
            score: team.overallTeamScore ?? 0,
            grade: team.grade || 'N/A',
            kpiCount: kpis.length,
            kpiAchievementScore: kpiAchievement,
            individualAvgScore: individualAvg,
            kpis,
            quarterlyScore: team,
          });
        });

        // Fallback: ensure team leads appear even if scores are not generated yet
        teamLeads.forEach((lead: TeamLead) => {
          const department = lead.department || lead.teamName || 'Unassigned';
          const deptKey = department.toLowerCase();
          const teamKey = lead.id || lead.teamName || deptKey;
          const leadKey = lead.id?.toLowerCase?.() || lead.id || '';
          const kpis = leadKey
            ? kpisByLead[leadKey] || []
            : kpisByDept[deptKey] || [];
          const fallbackScore =
            typeof lead.teamScore === 'number' ? lead.teamScore : 0;

          if (!teamDetailsByKey.has(teamKey)) {
            teamDetailsByKey.set(teamKey, {
              department,
              teamName: lead.teamName || department,
              teamLeadId: lead.id,
              score: fallbackScore,
              grade:
                fallbackScore > 0 ? getGradeFromScore(fallbackScore) : 'N/A',
              kpiCount: kpis.length,
              kpiAchievementScore: 0,
              individualAvgScore: 0,
              kpis,
            });
            return;
          }

          const existing = teamDetailsByKey.get(teamKey);
          if (!existing) return;
          if (!existing.teamName && lead.teamName) {
            existing.teamName = lead.teamName;
          }
          if (!existing.department && lead.department) {
            existing.department = lead.department;
          }
          if (!existing.teamLeadId && lead.id) {
            existing.teamLeadId = lead.id;
          }
          if (existing.score === 0 && fallbackScore > 0) {
            existing.score = fallbackScore;
            existing.grade = getGradeFromScore(fallbackScore);
          }
          if (existing.kpiCount === 0 && kpis.length > 0) {
            existing.kpiCount = kpis.length;
            existing.kpis = kpis;
          }
        });

        const teamDetails = Array.from(teamDetailsByKey.values());
        setTeams(teamDetails);
        const computedAverage =
          scoresData.teams.length > 0
            ? scoresData.averageScore || 0
            : teamDetails.length > 0
              ? teamDetails.reduce((acc, t) => acc + t.score, 0) /
                teamDetails.length
              : 0;
        setAverageScore(computedAverage);
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

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-indigo-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getTeamDisplayName = (team: TeamDetail) => {
    const department = team.department?.trim();
    if (department) {
      return department.toLowerCase().endsWith('team')
        ? department
        : `${department} Team`;
    }
    return team.teamName || 'Team';
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
          <h1 className="text-xl font-normal text-gray-800">Teams Overview</h1>
          <p className="mt-1 text-xs text-muted-foreground">
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
              <p className="text-2xl font-normal text-gray-800">
                {teams.length}
              </p>
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
              <p className="text-2xl font-normal text-gray-800">
                {averageScore.toFixed(1)}%
              </p>
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
              <p className="text-2xl font-normal text-gray-800">
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
              <p className="text-2xl font-normal text-gray-800">
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
            key={team.teamLeadId || team.department}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() =>
              team.teamLeadId &&
              router.push(
                `/dashboard/teams/${team.teamLeadId}?quarter=${selectedQuarter}&year=${selectedYear}`
              )
            }
            className="cursor-pointer rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                  <UsersIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {getTeamDisplayName(team)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {team.department} · {team.kpiCount} KPIs
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${getGradeColor(team.grade)}`}
              >
                {team.grade}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p
                  className={`text-lg font-medium ${getScoreColor(team.score)}`}
                >
                  {team.score.toFixed(1)}%
                </p>
                <p className="text-[11px] text-muted-foreground">Team Score</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-lg font-medium text-gray-800">
                  {team.kpiAchievementScore.toFixed(1)}%
                </p>
                <p className="text-[11px] text-muted-foreground">
                  KPI Achievement
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-lg font-medium text-gray-800">
                  {team.individualAvgScore.toFixed(1)}%
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Individual KPI Avg
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
              <span className="text-xs text-muted-foreground">
                View Details
              </span>
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
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No Team Data Yet
          </h3>
          <p className="mb-4 max-w-md text-center text-sm text-muted-foreground">
            Team performance data for {selectedQuarter} {selectedYear} is not
            available yet. Teams are created automatically when team leads are
            assigned and KPIs are configured.
          </p>
          <div className="flex items-center gap-3 text-sm">
            <a
              href="/dashboard/hr-policy"
              className="text-primary hover:underline"
            >
              → Configure Team Leads
            </a>
            <span className="text-muted-foreground">|</span>
            <a
              href="/dashboard/settings"
              className="text-primary hover:underline"
            >
              → Set Up KPIs
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
