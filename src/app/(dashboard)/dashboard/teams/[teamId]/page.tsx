'use server';

import {
  getAllTeamScores,
  getAllTeamKpis,
  type TeamQuarterlyScore,
  type TeamKpi,
} from '@/app/actions/kpi';
import { getTeamLeads } from '@/app/actions/hr-management';
import { getAllProfiles } from '@/app/actions/staff';
import TeamDetailsClient from './team-details-client';

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

interface TeamDetailsPageProps {
  params: { teamId: string };
  searchParams?: { quarter?: string; year?: string };
}

function getCurrentQuarter() {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

function getGradeFromScore(score: number) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default async function TeamDetailsPage({
  params,
  searchParams,
}: TeamDetailsPageProps) {
  const teamLeadId = params.teamId;
  const quarter = searchParams?.quarter ?? getCurrentQuarter();
  const year = searchParams?.year
    ? Number(searchParams.year)
    : new Date().getFullYear();

  const [scoresData, kpisData, teamLeads, profiles] = await Promise.all([
    getAllTeamScores(quarter, year),
    getAllTeamKpis(quarter, year),
    getTeamLeads(),
    getAllProfiles(),
  ]);

  const teamLead = teamLeads.find((lead) => lead.id === teamLeadId) || null;
  const scoreRecord = scoresData.teams.find(
    (team) => team.teamLeadId === teamLeadId
  );

  const department =
    scoreRecord?.department ||
    teamLead?.department ||
    teamLead?.teamName ||
    'Unassigned';
  const teamName = scoreRecord?.teamName || teamLead?.teamName || department;

  const leadKey = teamLeadId.toLowerCase();
  const kpisById = new Map<string, TeamKpi>();
  kpisData.kpis
    .filter((kpi) => (kpi.teamLeadId || '').toLowerCase() === leadKey)
    .forEach((kpi) => kpisById.set(kpi.id, kpi));
  kpisData.kpis
    .filter(
      (kpi) =>
        !kpi.teamLeadId &&
        kpi.department?.toLowerCase() === department.toLowerCase()
    )
    .forEach((kpi) => kpisById.set(kpi.id, kpi));
  const kpis = Array.from(kpisById.values());

  const breakdown = scoreRecord?.scoreBreakdown || {};
  const kpiAchievement =
    typeof scoreRecord?.kpiAchievementScore === 'number'
      ? scoreRecord.kpiAchievementScore
      : ((breakdown as Record<string, unknown>)?.teamKpiScore as
          | number
          | undefined) ||
        ((breakdown as Record<string, unknown>)?.kpiProgressScore as
          | number
          | undefined) ||
        0;
  const individualAvg =
    typeof scoreRecord?.individualAvgScore === 'number'
      ? scoreRecord.individualAvgScore
      : ((breakdown as Record<string, unknown>)?.individualKpiAverage as
          | number
          | undefined) || 0;

  const fallbackScore =
    typeof teamLead?.teamScore === 'number' ? teamLead.teamScore : 0;
  const scoreValue = scoreRecord?.overallTeamScore ?? fallbackScore;

  const team: TeamDetail = {
    department,
    teamName,
    teamLeadId,
    score: scoreValue,
    grade:
      scoreRecord?.grade ||
      (scoreValue > 0 ? getGradeFromScore(scoreValue) : 'N/A'),
    kpiCount: kpis.length,
    kpiAchievementScore: kpiAchievement,
    individualAvgScore: individualAvg,
    kpis,
    quarterlyScore: scoreRecord,
  };

  const members = profiles.filter((profile) => {
    if (!profile.department) return false;
    if (
      profile.role?.toLowerCase() === 'admin' ||
      profile.role?.toLowerCase() === 'super_admin'
    ) {
      return false;
    }
    return profile.department.toLowerCase() === department.toLowerCase();
  });

  return (
    <TeamDetailsClient
      team={team}
      teamLead={teamLead}
      members={members}
      quarter={quarter}
      year={year}
    />
  );
}
