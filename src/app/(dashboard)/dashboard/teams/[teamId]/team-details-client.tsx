'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { type TeamKpi, type TeamQuarterlyScore } from '@/app/actions/kpi';
import { type TeamLead } from '@/app/actions/hr-management';
import { type StaffProfile } from '@/app/actions/staff';
import {
  getEmployeeKpis,
  type EmployeeKpiResponse,
} from '@/app/actions/individual-kpis';
import { getStaffAvatarUrl } from '@/lib/avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ChevronLeft,
  Users,
  Trophy,
  Target,
  BadgeCheck,
  UserCircle2,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';

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

interface TeamDetailsClientProps {
  team: TeamDetail;
  teamLead: TeamLead | null;
  members: StaffProfile[];
  quarter: string;
  year: number;
}

function formatScore(value?: number | null) {
  if (value == null) return '--';
  return `${value.toFixed(1)}%`;
}

function formatGrade(grade?: string | null) {
  if (!grade) return 'N/A';
  return grade;
}

export default function TeamDetailsClient({
  team,
  teamLead,
  members,
  quarter,
  year,
}: TeamDetailsClientProps) {
  const [selectedMember, setSelectedMember] = useState<StaffProfile | null>(
    null
  );
  const [memberKpis, setMemberKpis] = useState<EmployeeKpiResponse | null>(
    null
  );
  const [isLoadingMember, setIsLoadingMember] = useState(false);

  useEffect(() => {
    let isActive = true;
    if (!selectedMember?.id) {
      setMemberKpis(null);
      return;
    }

    const fetchMemberKpis = async () => {
      setIsLoadingMember(true);
      try {
        const data = await getEmployeeKpis(selectedMember.id, quarter, year);
        if (isActive) {
          setMemberKpis(data);
        }
      } finally {
        if (isActive) {
          setIsLoadingMember(false);
        }
      }
    };

    fetchMemberKpis();

    return () => {
      isActive = false;
    };
  }, [selectedMember?.id, quarter, year]);

  const scoreBreakdown = useMemo(() => {
    const breakdown = team.quarterlyScore?.scoreBreakdown as
      | Record<string, unknown>
      | undefined;
    if (!breakdown) return null;
    return {
      teamKpiScore:
        typeof breakdown.teamKpiScore === 'number'
          ? breakdown.teamKpiScore
          : null,
      individualKpiAverage:
        typeof breakdown.individualKpiAverage === 'number'
          ? breakdown.individualKpiAverage
          : null,
      teamWeight:
        typeof breakdown.teamWeight === 'number' ? breakdown.teamWeight : null,
      individualWeight:
        typeof breakdown.individualWeight === 'number'
          ? breakdown.individualWeight
          : null,
      fallback: breakdown.fallback === true,
    };
  }, [team.quarterlyScore?.scoreBreakdown]);

  const teamLeadDisplay = teamLead?.name || 'Unassigned';
  const memberCount = members.length;
  const teamLeadAvatar = teamLead
    ? getStaffAvatarUrl({
        employeeId: teamLead.employeeId ?? null,
        id: teamLead.id,
        email: teamLead.email ?? null,
        full_name: teamLead.name ?? null,
        gender: teamLead.gender ?? null,
        role: teamLead.role ?? null,
      })
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/teams"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 text-muted-foreground transition-colors hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Team Overview
            </p>
            <h1 className="text-xl font-normal text-gray-800">
              {team.teamName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {team.department} • {quarter} {year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="border border-border/40 bg-white text-xs font-normal"
          >
            {memberCount} members
          </Badge>
          <Badge
            variant="secondary"
            className="border border-border/40 bg-white text-xs font-normal"
          >
            {team.kpiCount} KPIs
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Team Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold text-gray-800">
              {formatScore(team.score)}
            </div>
            <Trophy className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              KPI Achievement
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold text-gray-800">
              {formatScore(team.kpiAchievementScore)}
            </div>
            <Target className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Individual KPI Avg
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold text-gray-800">
              {formatScore(team.individualAvgScore)}
            </div>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-semibold text-gray-800">
              {formatGrade(team.grade)}
            </div>
            <BadgeCheck className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              Team Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4 pt-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarImage src={teamLeadAvatar} />
                <AvatarFallback className="bg-slate-100 text-slate-500">
                  {teamLeadDisplay.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">
                  {teamLeadDisplay}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {teamLead?.role || 'Team Lead'}
                  {teamLead?.email ? ` • ${teamLead.email}` : ''}
                </p>
              </div>
            </div>
            {teamLead?.status && teamLead.status !== 'legacy' && (
              <Badge
                variant="secondary"
                className="border border-border/40 bg-slate-50 text-xs font-normal"
              >
                {teamLead.status}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {scoreBreakdown ? (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Team KPI Score</span>
                  <span className="text-gray-800">
                    {formatScore(scoreBreakdown.teamKpiScore || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Individual KPI Avg</span>
                  <span className="text-gray-800">
                    {formatScore(scoreBreakdown.individualKpiAverage || 0)}
                  </span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Team Weight</span>
                  <span className="text-gray-800">
                    {scoreBreakdown.teamWeight ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Individual Weight</span>
                  <span className="text-gray-800">
                    {scoreBreakdown.individualWeight ?? 0}
                  </span>
                </div>
                {/* {scoreBreakdown.fallback && (
                  <Badge className="mt-2 w-fit bg-amber-50 text-amber-700 border-amber-200">
                    Fallback scoring applied
                  </Badge>
                )} */}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Score breakdown is not available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Target className="h-4 w-4 text-muted-foreground" />
              Department KPIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.kpis.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No KPIs set for this team yet.
              </p>
            ) : (
              team.kpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {kpi.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target: {kpi.targetValue} {kpi.targetUnit} • Weight:{' '}
                      {kpi.weight}%
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      kpi.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }
                  >
                    {kpi.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="h-4 w-4 text-muted-foreground" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No team members found.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-slate-100">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-slate-100 text-slate-500">
                          {member.full_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {member.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.job_title || member.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedMember(member)}
                    >
                      View KPIs
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          {team.quarterlyScore?.aiSummary && (
            <Card className="border-border/40 bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700">
                {team.quarterlyScore.aiSummary}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Sheet
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      >
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold text-gray-800">
              {selectedMember?.full_name || 'Member KPIs'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {isLoadingMember && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading KPI details...
              </div>
            )}

            {!isLoadingMember && memberKpis && (
              <>
                <div className="rounded-lg border border-border/40 bg-slate-50 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Average achievement</span>
                    <span className="font-medium text-gray-800">
                      {memberKpis.averageAchievement.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Total KPI weight</span>
                    <span className="font-medium text-gray-800">
                      {memberKpis.totalWeight}%
                    </span>
                  </div>
                </div>
                {memberKpis.kpis.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No KPIs assigned for this period.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {memberKpis.kpis.map((kpi) => (
                      <div
                        key={kpi.id}
                        className="rounded-lg border border-border/40 bg-white p-3"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {kpi.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Target: {kpi.targetValue} {kpi.targetUnit} • Weight:{' '}
                          {kpi.weight}%
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Achievement: {kpi.achievementPercentage ?? 0}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!isLoadingMember && !memberKpis && (
              <p className="text-xs text-muted-foreground">
                No KPI details available for this member.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
