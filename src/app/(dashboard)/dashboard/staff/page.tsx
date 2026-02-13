'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Star,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getAllProfiles, type StaffProfile } from '@/app/actions/staff';
import {
  getAuraDashboard,
  getEmployeeAuraTrend,
  type AuraResponse,
  type AuraTrendPoint,
} from '@/app/actions/performance';
import {
  getEmployeeInsights,
  type PersonalInsightsResponse,
} from '@/app/actions/kpi';
import {
  getIndividualKpisByEmployee,
  updateIndividualKpi,
  type IndividualKpiItem,
} from '@/app/actions/individual-kpis';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Combined type for staff with Aura data
interface StaffWithAura extends StaffProfile {
  aura?: AuraResponse;
  overallKpi: number;
  isNewHire: boolean;
  kpis: {
    tasks: number;
    attendance: number;
    compliance: number;
    feedback: number;
  };
  attendanceStatus: 'On Track' | 'At Risk';
  lastUpdated: string;
}

type TrendMetric = 'auraScore' | 'initiative' | 'attitude' | 'teamwork';

const trendMetricOptions: Array<{
  key: TrendMetric;
  label: string;
  color: string;
}> = [
  { key: 'auraScore', label: 'Aura Score', color: '#6366f1' },
  { key: 'initiative', label: 'Initiative', color: '#f59e0b' },
  { key: 'attitude', label: 'Attitude', color: '#10b981' },
  { key: 'teamwork', label: 'Teamwork', color: '#3b82f6' },
];

function getInitials(name?: string | null): string {
  if (!name) return '—';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function normalizeInsightList(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildAuraSnapshot(aura?: AuraResponse): string[] {
  const snapshot: string[] = [];

  if (!aura) {
    snapshot.push('No Aura data available yet for this employee.');
    snapshot.push('Weekly ratings need to be submitted to generate insights.');
    return snapshot;
  }

  const score = aura.qgpa ?? aura.auraScore / 20;
  if (score >= 4.5) {
    snapshot.push(
      'Consistently exceeds performance targets across all metrics.'
    );
  } else if (score >= 4.0) {
    snapshot.push('Strong performance with room for minor improvements.');
  } else if (score >= 3.5) {
    snapshot.push('Meeting expectations with some areas needing attention.');
  } else {
    snapshot.push('Performance requires improvement in key areas.');
  }

  if (aura.pillars) {
    const technical = aura.pillars.technical?.score || 0;
    const behavioral = aura.pillars.behavioral?.score || 0;

    if (technical >= 85) {
      snapshot.push('Technical skills are excellent.');
    } else if (technical < 70) {
      snapshot.push('Technical skills need development.');
    }

    if (behavioral >= 85) {
      snapshot.push('Strong behavioral and teamwork skills.');
    } else if (behavioral < 70) {
      snapshot.push('Behavioral metrics could be improved.');
    }
  }

  snapshot.push(`Grade: ${aura.grade} | QGPA: ${aura.qgpa.toFixed(2)}`);
  return snapshot;
}

function buildInsightSnapshot(
  insights?: PersonalInsightsResponse['aiInsights'],
  aura?: AuraResponse
): string[] {
  if (!insights) {
    return buildAuraSnapshot(aura);
  }

  const points: string[] = [];

  if (
    typeof insights.overallAssessment === 'string' &&
    insights.overallAssessment.trim()
  ) {
    points.push(insights.overallAssessment.trim());
  }

  const improvementAreas = normalizeInsightList(insights.improvementAreas);
  const keyStrengths = normalizeInsightList(insights.keyStrengths);
  const recommendations = normalizeInsightList(
    insights.actionableRecommendations
  );

  points.push(...improvementAreas);
  points.push(...keyStrengths);
  points.push(...recommendations);

  if (typeof insights.performanceScore === 'number') {
    points.push(
      `Performance score: ${Math.round(insights.performanceScore)} / 100`
    );
  }

  const uniquePoints = Array.from(new Set(points)).filter(Boolean);
  if (uniquePoints.length === 0) {
    return buildAuraSnapshot(aura);
  }

  return uniquePoints.slice(0, 4);
}

function getAuraDisplayScore(aura?: AuraResponse): number | null {
  if (!aura) return null;
  if (typeof aura.qgpa === 'number') return aura.qgpa;
  if (typeof aura.auraScore === 'number') return aura.auraScore / 20;
  return null;
}

// Calculate KPIs from Aura data
function calculateKpis(aura?: AuraResponse): {
  tasks: number;
  attendance: number;
  compliance: number;
  feedback: number;
} {
  if (!aura || !aura.pillars) {
    return { tasks: 0, attendance: 0, compliance: 0, feedback: 0 };
  }

  // Map pillar scores to KPI categories
  return {
    tasks: aura.pillars.technical?.score || 0,
    attendance: aura.pillars.behavioral?.score || 0,
    compliance: aura.pillars.cultureFit?.score || 0,
    feedback: (aura.pillars.collaboration?.score || 0) / 20,
  };
}

function isNewHire(dateJoined: string | null): boolean {
  if (!dateJoined) return false;
  const joined = new Date(dateJoined);
  if (Number.isNaN(joined.getTime())) return false;
  const daysSinceJoin = Math.floor(
    (Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceJoin >= 0 && daysSinceJoin < 7;
}

export default function StaffPerformancePage() {
  const [staffList, setStaffList] = useState<StaffWithAura[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('Overview');
  const [selectedMetric, setSelectedMetric] =
    useState<TrendMetric>('auraScore');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<AuraTrendPoint[]>([]);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [insightsByStaffId, setInsightsByStaffId] = useState<
    Record<string, PersonalInsightsResponse | null>
  >({});
  const [insightsLoadingId, setInsightsLoadingId] = useState<string | null>(
    null
  );
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [individualKpisByStaffId, setIndividualKpisByStaffId] = useState<
    Record<string, IndividualKpiItem[]>
  >({});
  const [individualKpiMetaByStaffId, setIndividualKpiMetaByStaffId] = useState<
    Record<string, { totalWeight: number; averageAchievement: number }>
  >({});
  const [kpiLoadingId, setKpiLoadingId] = useState<string | null>(null);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [kpiDraft, setKpiDraft] = useState<{
    name: string;
    description: string;
    targetValue: string;
    currentValue: string;
    targetUnit: string;
    weight: string;
    isActive: boolean;
  } | null>(null);

  // Fetch staff data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profiles = await getAllProfiles();

      // Filter out admin profiles
      const staffProfiles = profiles.filter(
        (p) =>
          !['admin', 'super_admin', 'superadmin'].includes(
            p.role?.toLowerCase() || ''
          )
      );

      // Fetch Aura data for each staff member in parallel
      const staffWithAura = await Promise.all(
        staffProfiles.map(async (profile): Promise<StaffWithAura> => {
          let aura: AuraResponse | undefined = undefined;
          const newHire = isNewHire(profile.date_joined);

          try {
            aura = newHire ? undefined : await getAuraDashboard(profile.id);
          } catch {
            // No Aura data available for this staff
          }

          const kpis = calculateKpis(aura);
          const overallKpi = aura?.auraScore || 0;

          const staffWithData: StaffWithAura = {
            ...profile,
            aura,
            overallKpi,
            isNewHire: newHire,
            kpis,
            attendanceStatus: (kpis.attendance >= 80
              ? 'On Track'
              : 'At Risk') as 'On Track' | 'At Risk',
            lastUpdated: aura?.lastUpdated
              ? formatTimeAgo(new Date(aura.lastUpdated))
              : newHire
                ? 'New hire'
                : 'No data',
          };

          return staffWithData;
        })
      );

      // Sort by Aura score (descending)
      staffWithAura.sort((a, b) => (b.overallKpi || 0) - (a.overallKpi || 0));

      setStaffList(staffWithAura);

      // Select first staff if none selected
      if (staffWithAura.length > 0 && !selectedStaffId) {
        setSelectedStaffId(staffWithAura[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to fetch staff data:', err);
      setError('Failed to load staff data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const query = searchQuery.toLowerCase();
    return staffList.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(query) ||
        s.department?.toLowerCase().includes(query) ||
        s.job_title?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
    );
  }, [staffList, searchQuery]);

  // Selected staff
  const selectedStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

  const selectedIndividualKpis = useMemo(() => {
    if (!selectedStaff?.id) return [];
    return individualKpisByStaffId[selectedStaff.id] ?? [];
  }, [individualKpisByStaffId, selectedStaff?.id]);

  const selectedKpiMeta = useMemo(() => {
    if (!selectedStaff?.id) return { totalWeight: 0, averageAchievement: 0 };
    return (
      individualKpiMetaByStaffId[selectedStaff.id] ?? {
        totalWeight: 0,
        averageAchievement: 0,
      }
    );
  }, [individualKpiMetaByStaffId, selectedStaff?.id]);

  const loadIndividualKpis = useCallback(async (staffId: string) => {
    setKpiLoadingId(staffId);
    setKpiError(null);
    try {
      const response = await getIndividualKpisByEmployee(staffId);
      setIndividualKpisByStaffId((prev) => ({
        ...prev,
        [staffId]: response.kpis,
      }));
      setIndividualKpiMetaByStaffId((prev) => ({
        ...prev,
        [staffId]: {
          totalWeight: response.totalWeight ?? 0,
          averageAchievement: response.averageAchievement ?? 0,
        },
      }));
    } catch (err) {
      console.error('Error loading individual KPIs:', err);
      setKpiError('Unable to load individual KPIs.');
    } finally {
      setKpiLoadingId((prev) => (prev === staffId ? null : prev));
    }
  }, []);

  const beginEditKpi = (kpi: IndividualKpiItem) => {
    setEditingKpiId(kpi.id);
    setKpiError(null);
    setKpiDraft({
      name: kpi.name ?? '',
      description: kpi.description ?? '',
      targetValue: kpi.targetValue?.toString() ?? '',
      currentValue: kpi.currentValue?.toString() ?? '',
      targetUnit: kpi.targetUnit ?? '',
      weight: kpi.weight?.toString() ?? '',
      isActive: kpi.isActive ?? true,
    });
  };

  const cancelEditKpi = () => {
    setEditingKpiId(null);
    setKpiDraft(null);
  };

  const saveKpi = async (kpi: IndividualKpiItem) => {
    if (!kpiDraft) return;
    const targetValueRaw = kpiDraft.targetValue.trim();
    const weightRaw = kpiDraft.weight.trim();

    if (!targetValueRaw || !weightRaw) {
      setKpiError('Target value and weight are required.');
      return;
    }

    const payload = {
      name: kpiDraft.name.trim() || kpi.name,
      description: kpiDraft.description.trim() || kpi.description || '',
      targetValue: Number(targetValueRaw),
      currentValue:
        kpiDraft.currentValue.trim() === ''
          ? undefined
          : Number(kpiDraft.currentValue),
      targetUnit: kpiDraft.targetUnit.trim() || kpi.targetUnit || '',
      weight: Number(weightRaw),
      isActive: kpiDraft.isActive,
    };

    if (
      Number.isNaN(payload.targetValue) ||
      Number.isNaN(payload.weight) ||
      (payload.currentValue != null && Number.isNaN(payload.currentValue))
    ) {
      setKpiError(
        'Target value, current value, and weight must be valid numbers.'
      );
      return;
    }

    const result = await updateIndividualKpi(kpi.id, payload);
    if (!result.success) {
      setKpiError(result.error || 'Failed to update KPI');
      return;
    }

    if (selectedStaff?.id) {
      await loadIndividualKpis(selectedStaff.id);
    }
    cancelEditKpi();
  };

  useEffect(() => {
    if (!selectedStaff?.id) return;
    if (
      Object.prototype.hasOwnProperty.call(
        individualKpisByStaffId,
        selectedStaff.id
      )
    )
      return;
    setKpiError(null);
    loadIndividualKpis(selectedStaff.id);
  }, [selectedStaff?.id, individualKpisByStaffId, loadIndividualKpis]);

  const trendLimit = useMemo(() => {
    if (selectedTimeRange === '30d') return 4;
    if (selectedTimeRange === '90d') return 12;
    return 52;
  }, [selectedTimeRange]);

  useEffect(() => {
    if (!selectedStaff?.id) {
      setTrendData([]);
      return;
    }

    const loadTrend = async () => {
      setIsTrendLoading(true);
      setTrendError(null);
      try {
        const trend = await getEmployeeAuraTrend(selectedStaff.id, trendLimit);
        setTrendData(trend.weeks || []);
      } catch (err) {
        setTrendError(
          err instanceof Error ? err.message : 'Failed to load trend data'
        );
        setTrendData([]);
      } finally {
        setIsTrendLoading(false);
      }
    };

    loadTrend();
  }, [selectedStaff?.id, trendLimit]);

  useEffect(() => {
    if (!selectedStaff?.id) return;
    if (
      Object.prototype.hasOwnProperty.call(insightsByStaffId, selectedStaff.id)
    )
      return;

    let cancelled = false;
    setInsightsLoadingId(selectedStaff.id);
    setInsightsError(null);

    getEmployeeInsights(selectedStaff.id)
      .then((insights) => {
        if (cancelled) return;
        setInsightsByStaffId((prev) => ({
          ...prev,
          [selectedStaff.id]: insights,
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        setInsightsError(
          err instanceof Error ? err.message : 'Failed to load insights'
        );
      })
      .finally(() => {
        if (!cancelled) {
          setInsightsLoadingId(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStaff?.id, insightsByStaffId]);

  const trendChartData = useMemo(() => {
    return trendData.map((point) => ({
      name: point.weekNumber ? `W${point.weekNumber}` : '',
      auraScore: point.auraScore != null ? point.auraScore / 20 : 0,
      initiative: point.initiative ?? 0,
      attitude: point.attitude ?? 0,
      teamwork: point.teamwork ?? 0,
    }));
  }, [trendData]);

  const selectedMetricMeta =
    trendMetricOptions.find((option) => option.key === selectedMetric) ??
    trendMetricOptions[0];
  const trendDomain: [number, number] =
    selectedMetric === 'auraScore' ? [0, 5] : [0, 100];
  const selectedInsights = selectedStaff?.id
    ? insightsByStaffId[selectedStaff.id]
    : null;
  const snapshotPoints = useMemo(
    () =>
      buildInsightSnapshot(selectedInsights?.aiInsights, selectedStaff?.aura),
    [selectedInsights?.aiInsights, selectedStaff?.aura]
  );
  const selectedAuraScore = getAuraDisplayScore(selectedStaff?.aura);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const staffWithScores = staffList.filter((s) => s.overallKpi > 0);
    const avgKpi =
      staffWithScores.length > 0
        ? Math.round(
            staffWithScores.reduce((sum, s) => sum + s.overallKpi, 0) /
              staffWithScores.length
          )
        : 0;

    // Find top department
    const deptScores: Record<string, { sum: number; count: number }> = {};
    staffWithScores.forEach((s) => {
      const dept = s.department || 'Unassigned';
      if (!deptScores[dept]) deptScores[dept] = { sum: 0, count: 0 };
      deptScores[dept].sum += s.overallKpi;
      deptScores[dept].count += 1;
    });

    const topDept = Object.entries(deptScores)
      .map(([name, data]) => ({
        name,
        avg: data.count ? Math.round(data.sum / data.count) : 0,
      }))
      .sort((a, b) => b.avg - a.avg)[0];

    const atRiskCount = staffList.filter(
      (s) => s.attendanceStatus === 'At Risk'
    ).length;

    return [
      {
        label: 'Avg KPI score',
        value: `${avgKpi}%`,
        detail: `${staffWithScores.length} staff with scores`,
      },
      {
        label: 'Top department',
        value: topDept?.name || 'N/A',
        detail: topDept ? `Avg KPI ${topDept.avg}%` : 'No data',
      },
      {
        label: 'At risk staff',
        value: atRiskCount.toString(),
        detail: 'Need coaching this week.',
      },
    ];
  }, [staffList]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading staff performance data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            Staff Performance
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Dive into individual KPIs and trends across your team.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <p className="mb-4 text-sm text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            Staff Performance
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Dive into individual KPIs and trends across your team.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-12 text-center">
          <p className="text-muted-foreground">No staff data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            Staff Performance
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Dive into individual KPIs and trends across your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border/40 bg-white p-4 shadow-sm"
          >
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {metric.label}
            </p>
            <p
              className={`${metric.value.length > 10 ? 'text-xl' : 'text-2xl'} mb-1 font-normal tracking-tight text-gray-800`}
            >
              {metric.value}
            </p>
            <p className="text-xs text-muted-foreground">{metric.detail}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_500px]">
        {/* Left Panel - Team Members */}
        <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
          <div className="border-b border-border/40 p-6">
            <div>
              <h2 className="text-sm font-normal text-gray-700">
                Team members
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Filter and compare individual KPI performance.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="border-b border-border/40 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search staff"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Team Members Grid */}
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredStaff.map((member) => {
                const isSelected = selectedStaffId === member.id;
                const memberAuraScore = getAuraDisplayScore(member.aura);
                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaffId(member.id)}
                    className={`cursor-pointer rounded-lg border border-border/40 bg-white p-3 transition-all ${
                      isSelected
                        ? 'bg-primary/5 ring-1 ring-primary/40'
                        : 'hover:border-primary/30 hover:bg-muted/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 border border-slate-100/70">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-slate-100 text-[11px] font-medium text-slate-500">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate text-sm font-medium text-gray-800">
                              {member.full_name || 'Unknown'}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {member.job_title || 'Staff'} ·{' '}
                              {member.department || 'Unassigned'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-gray-800">
                              {member.isNewHire
                                ? '—'
                                : member.overallKpi > 0
                                  ? `${Math.round(member.overallKpi)}%`
                                  : '—'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              KPI
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/20 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {member.isNewHire
                                ? '—'
                                : memberAuraScore != null
                                  ? memberAuraScore.toFixed(1)
                                  : '—'}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                member.attendanceStatus === 'On Track'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-orange-200 bg-orange-50 text-orange-700'
                              }`}
                            >
                              {member.isNewHire
                                ? 'New hire'
                                : member.attendanceStatus}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Updated {member.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredStaff.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No staff found matching your search.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Detailed View */}
        {selectedStaff && (
          <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
            <div className="border-b border-border/40 p-6">
              <div className="mb-4 flex items-start gap-3">
                <Avatar className="h-12 w-12 border border-slate-100/70">
                  <AvatarImage src={selectedStaff.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-slate-100 text-sm font-medium text-slate-500">
                    {getInitials(selectedStaff.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-800">
                    {selectedStaff.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStaff.job_title || 'Staff'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStaff.department || 'Unassigned'}{' '}
                    {selectedStaff.employee_id
                      ? `· ${selectedStaff.employee_id}`
                      : ''}
                  </p>
                </div>
                <div
                  className={`rounded-full px-3 py-1 ${
                    selectedStaff.overallKpi >= 80
                      ? 'bg-emerald-100'
                      : selectedStaff.overallKpi >= 60
                        ? 'bg-amber-100'
                        : 'bg-gray-100'
                  }`}
                >
                  <p
                    className={`text-xs font-medium ${
                      selectedStaff.overallKpi >= 80
                        ? 'text-emerald-700'
                        : selectedStaff.overallKpi >= 60
                          ? 'text-amber-700'
                          : 'text-gray-700'
                    }`}
                  >
                    {selectedStaff.isNewHire
                      ? 'New hire · Performance data pending'
                      : selectedStaff.overallKpi > 0
                        ? `Overall KPI: ${Math.round(selectedStaff.overallKpi)}% · ${selectedStaff.aura?.grade || 'N/A'}`
                        : 'No data'}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="-mx-6 flex items-center gap-2 border-b border-border/40 px-6">
                {['Overview', 'KPIs', 'Attendance', 'Feedback'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`-mb-[1px] border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                      selectedTab === tab
                        ? 'border-primary font-medium text-primary'
                        : 'border-transparent font-medium text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[calc(100vh-400px)] space-y-6 overflow-y-auto p-6">
              {/* Tab Content */}
              {selectedTab === 'Overview' && (
                <>
                  {selectedStaff.isNewHire && (
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-6 text-sm text-muted-foreground">
                      Performance data will appear after the first check-in,
                      task activity, or weekly report.
                    </div>
                  )}

                  {/* Performance over time */}
                  {!selectedStaff.isNewHire && (
                    <div>
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-normal text-gray-700">
                            Performance over time
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Multi-metric trend of individual KPIs.
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Updated {selectedStaff.lastUpdated}
                        </span>
                      </div>

                      {/* Metric Selection Tabs */}
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        {trendMetricOptions.map((metric) => (
                          <button
                            key={metric.key}
                            onClick={() => setSelectedMetric(metric.key)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              selectedMetric === metric.key
                                ? 'bg-primary text-white'
                                : 'border border-border/40 bg-white text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                          >
                            {metric.label}
                          </button>
                        ))}
                      </div>

                      {/* Time Range Selection */}
                      <div className="mb-6 flex items-center gap-2">
                        {['30d', '90d', 'YTD'].map((range) => (
                          <button
                            key={range}
                            onClick={() => setSelectedTimeRange(range)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              selectedTimeRange === range
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>

                      {/* Trend Chart */}
                      <div className="flex h-[200px] w-full items-center justify-center rounded-lg border border-border/40 bg-muted/20">
                        {isTrendLoading ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading trend data...
                          </div>
                        ) : trendError ? (
                          <p className="text-xs text-muted-foreground">
                            {trendError}
                          </p>
                        ) : trendChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendChartData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#eef2f7"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                stroke="#94a3b8"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                domain={trendDomain}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                                  fontSize: '12px',
                                  color: '#1e293b',
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey={selectedMetric}
                                stroke={selectedMetricMeta?.color ?? '#6366f1'}
                                strokeWidth={2}
                                dot={{
                                  fill: 'white',
                                  stroke:
                                    selectedMetricMeta?.color ?? '#6366f1',
                                  strokeWidth: 2,
                                  r: 3,
                                }}
                                activeDot={{
                                  r: 5,
                                  fill: selectedMetricMeta?.color ?? '#6366f1',
                                  stroke: 'white',
                                  strokeWidth: 2,
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No trend data available
                          </p>
                        )}
                      </div>

                      {/* Chart Legend */}
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                        {trendMetricOptions.map((metric) => (
                          <div
                            key={metric.key}
                            className="flex items-center gap-2"
                          >
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: metric.color }}
                            ></div>
                            <span className="text-muted-foreground">
                              {metric.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Snapshot */}
                  {!selectedStaff.isNewHire && (
                    <div>
                      <h3 className="mb-1 text-sm font-normal text-gray-700">
                        Snapshot
                      </h3>
                      <p className="mb-4 text-xs text-muted-foreground">
                        Key highlights for coaching conversations.
                      </p>
                      {insightsLoadingId === selectedStaff.id ? (
                        <p className="text-xs text-muted-foreground">
                          Loading AI insights...
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {snapshotPoints.map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-gray-700"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {insightsError && insightsLoadingId === null && (
                        <p className="mt-3 text-xs text-amber-600">
                          Unable to load AI insights. Showing Aura-based
                          summary.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {selectedTab === 'KPIs' && (
                <div className="space-y-6">
                  <div>
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-normal text-gray-700">
                          Individual KPIs
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Edit targets and progress for this employee.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full border border-border/40 bg-muted/30 px-2 py-1">
                          Total weight:{' '}
                          {Math.round(selectedKpiMeta.totalWeight)}%
                        </span>
                        <span className="rounded-full border border-border/40 bg-muted/30 px-2 py-1">
                          Avg achievement:{' '}
                          {Math.round(selectedKpiMeta.averageAchievement)}%
                        </span>
                      </div>
                    </div>

                    {kpiLoadingId === selectedStaff?.id ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading individual KPIs...
                      </div>
                    ) : kpiError ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                        {kpiError}
                      </div>
                    ) : selectedIndividualKpis.length === 0 ? (
                      <div className="rounded-lg border border-border/40 p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No individual KPIs found for this employee.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedIndividualKpis.map((kpi) => {
                          const isEditing = editingKpiId === kpi.id;
                          const achievement =
                            kpi.achievementPercentage != null
                              ? Math.round(kpi.achievementPercentage)
                              : null;
                          const unitLabel = kpi.targetUnit
                            ? ` ${kpi.targetUnit}`
                            : '';

                          return (
                            <div
                              key={kpi.id}
                              className="rounded-lg border border-border/40 bg-white p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <input
                                        className="w-full rounded-md border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                        value={kpiDraft?.name ?? ''}
                                        onChange={(e) =>
                                          setKpiDraft((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  name: e.target.value,
                                                }
                                              : prev
                                          )
                                        }
                                        placeholder="KPI name"
                                      />
                                      <textarea
                                        className="w-full resize-none rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                        rows={2}
                                        value={kpiDraft?.description ?? ''}
                                        onChange={(e) =>
                                          setKpiDraft((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  description: e.target.value,
                                                }
                                              : prev
                                          )
                                        }
                                        placeholder="Add a short description"
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <p className="truncate text-sm font-medium text-gray-800">
                                        {kpi.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {kpi.description ||
                                          'No description added.'}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                                      kpi.isActive === false
                                        ? 'border-slate-200 bg-slate-50 text-slate-600'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {kpi.isActive === false
                                      ? 'Paused'
                                      : 'Active'}
                                  </span>
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => saveKpi(kpi)}
                                        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary/90"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEditKpi}
                                        className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-white px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/50"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => beginEditKpi(kpi)}
                                      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-white px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/50"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="text-[11px] text-muted-foreground">
                                      Target value
                                    </label>
                                    <input
                                      type="number"
                                      className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                      value={kpiDraft?.targetValue ?? ''}
                                      onChange={(e) =>
                                        setKpiDraft((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                targetValue: e.target.value,
                                              }
                                            : prev
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] text-muted-foreground">
                                      Current value
                                    </label>
                                    <input
                                      type="number"
                                      className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                      value={kpiDraft?.currentValue ?? ''}
                                      onChange={(e) =>
                                        setKpiDraft((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                currentValue: e.target.value,
                                              }
                                            : prev
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] text-muted-foreground">
                                      Unit
                                    </label>
                                    <input
                                      className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                      value={kpiDraft?.targetUnit ?? ''}
                                      onChange={(e) =>
                                        setKpiDraft((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                targetUnit: e.target.value,
                                              }
                                            : prev
                                        )
                                      }
                                      placeholder="e.g. calls, deals"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] text-muted-foreground">
                                      Weight (%)
                                    </label>
                                    <input
                                      type="number"
                                      className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                      value={kpiDraft?.weight ?? ''}
                                      onChange={(e) =>
                                        setKpiDraft((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                weight: e.target.value,
                                              }
                                            : prev
                                        )
                                      }
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <input
                                      type="checkbox"
                                      checked={kpiDraft?.isActive ?? true}
                                      onChange={(e) =>
                                        setKpiDraft((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                isActive: e.target.checked,
                                              }
                                            : prev
                                        )
                                      }
                                      className="h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/30"
                                    />
                                    KPI active
                                  </label>
                                </div>
                              ) : (
                                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide">
                                      Target
                                    </p>
                                    <p className="mt-1 text-sm text-gray-800">
                                      {kpi.targetValue}
                                      {unitLabel}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide">
                                      Current
                                    </p>
                                    <p className="mt-1 text-sm text-gray-800">
                                      {kpi.currentValue ?? '—'}
                                      {unitLabel}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide">
                                      Weight
                                    </p>
                                    <p className="mt-1 text-sm text-gray-800">
                                      {kpi.weight}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide">
                                      Achievement
                                    </p>
                                    <p className="mt-1 text-sm text-gray-800">
                                      {achievement != null
                                        ? `${achievement}%`
                                        : '—'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-normal text-gray-700">
                      Aura KPI signals
                    </h3>
                    {selectedStaff.isNewHire ? (
                      <div className="rounded-lg border border-border/40 p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          Aura KPI signals will appear after the first check-in,
                          task activity, or weekly report.
                        </p>
                      </div>
                    ) : selectedStaff.overallKpi > 0 ? (
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              Technical
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {Math.round(selectedStaff.kpis.tasks)}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${selectedStaff.kpis.tasks}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              Behavioral
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {Math.round(selectedStaff.kpis.attendance)}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{
                                width: `${selectedStaff.kpis.attendance}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              Culture Fit
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {Math.round(selectedStaff.kpis.compliance)}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${selectedStaff.kpis.compliance}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              Aura Score
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium text-gray-800">
                                {selectedAuraScore != null
                                  ? selectedAuraScore.toFixed(1)
                                  : '—'}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{
                                width: `${selectedAuraScore != null ? (selectedAuraScore / 5) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/40 p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          No Aura KPI data available yet for this employee.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'Attendance' && (
                <div>
                  <h3 className="mb-4 text-sm font-normal text-gray-700">
                    Attendance Details
                  </h3>
                  {selectedStaff.isNewHire ? (
                    <div className="rounded-lg border border-border/40 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Attendance status will appear after the first check-in.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-border/40 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">
                            Current Status
                          </span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              selectedStaff.attendanceStatus === 'On Track'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {selectedStaff.attendanceStatus}
                          </span>
                        </div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Behavioral Score
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {Math.round(selectedStaff.kpis.attendance)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>
                          Detailed attendance tracking will be displayed here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'Feedback' && (
                <div>
                  <h3 className="mb-4 text-sm font-normal text-gray-700">
                    Feedback Details
                  </h3>
                  {selectedStaff.isNewHire ? (
                    <div className="rounded-lg border border-border/40 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Feedback data will appear after the first review cycle.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-border/40 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">
                            Collaboration Rating
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium text-gray-800">
                              {selectedStaff.kpis.feedback.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{
                              width: `${(selectedStaff.kpis.feedback / 5) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      {selectedStaff.aura && (
                        <div className="rounded-lg border border-border/40 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              Aura Grade
                            </span>
                            <span className="text-sm font-bold text-primary">
                              {selectedStaff.aura.grade}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Quarterly GPA
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {selectedStaff.aura.qgpa.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <p>
                          Detailed feedback and reviews will be displayed here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
