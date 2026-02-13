'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  X,
  TrendingUp,
  Star,
  Target,
  Award,
  Zap,
  Info,
} from 'lucide-react';
import {
  getDepartmentReports,
  type DepartmentReport,
} from '@/app/actions/dashboard';
import {
  getReferenceData,
  type ReferenceData,
} from '@/app/actions/reference-data';
import {
  getAllTeamScores,
  getAllTeamKpis,
  type TeamQuarterlyScore,
  type TeamKpi,
} from '@/app/actions/kpi';
import { Progress } from '@/components/ui/progress';

// Types for extended department data
interface DepartmentDetail extends DepartmentReport {
  teamScore: TeamQuarterlyScore | null;
  kpis: TeamKpi[];
}

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [departmentReports, setDepartmentReports] = useState<
    DepartmentReport[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );
  const recordsPerPage = 5;

  // Department detail modal state
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  // Get current quarter
  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  };
  const currentQuarter = getCurrentQuarter();
  const currentYear = new Date().getFullYear();
  const reportTypes: Array<{ value: string; label: string }> =
    referenceData?.reportTypes && referenceData.reportTypes.length > 0
      ? [
          { value: 'All', label: 'All' },
          ...referenceData.reportTypes.filter((type) => type.value !== 'All'),
        ]
      : [{ value: 'All', label: 'All' }];

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [reports, refs] = await Promise.all([
        getDepartmentReports(),
        getReferenceData().catch((err) => {
          console.warn('Failed to load reference data:', err);
          return null;
        }),
      ]);
      setDepartmentReports(reports);
      if (refs) {
        setReferenceData(refs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Fetch department detail including team score and KPIs
  const handleDepartmentClick = async (dept: DepartmentReport) => {
    setIsLoadingDetail(true);
    try {
      const [scoresData, kpisData] = await Promise.all([
        getAllTeamScores(currentQuarter, currentYear),
        getAllTeamKpis(currentQuarter, currentYear),
      ]);

      // Find team score for this department
      const teamScore =
        scoresData.teams.find(
          (t) => t.department.toLowerCase() === dept.department.toLowerCase()
        ) || null;

      // Find KPIs for this department
      const departmentKpis = kpisData.kpis.filter(
        (kpi) => kpi.department.toLowerCase() === dept.department.toLowerCase()
      );

      setSelectedDepartment({
        ...dept,
        teamScore,
        kpis: departmentKpis,
      });
    } catch (err) {
      console.error('Failed to fetch department detail:', err);
      // Still show the basic info even if extended data fails
      setSelectedDepartment({
        ...dept,
        teamScore: null,
        kpis: [],
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Filter departments based on search
  const filteredDepartments = departmentReports.filter((dept) => {
    const matchesSearch =
      searchQuery === '' ||
      dept.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate summary metrics
  const totalStaff = departmentReports.reduce(
    (sum, d) => sum + d.totalStaff,
    0
  );
  const totalTasksCompleted = departmentReports.reduce(
    (sum, d) => sum + d.tasksCompleted,
    0
  );
  const totalTasksPending = departmentReports.reduce(
    (sum, d) => sum + d.tasksPending,
    0
  );
  const avgKpi =
    departmentReports.length > 0
      ? Math.round(
          departmentReports.reduce((sum, d) => sum + d.averageKpi, 0) /
            departmentReports.length
        )
      : 0;

  const summaryMetrics = [
    {
      label: 'Total Departments',
      value: departmentReports.length.toString(),
      detail: 'Active departments',
      icon: Building2,
      color: 'text-primary',
    },
    {
      label: 'Total Staff',
      value: totalStaff.toString(),
      detail: 'Across all departments',
      icon: Users,
      color: 'text-emerald-600',
    },
    {
      label: 'Tasks Completed',
      value: totalTasksCompleted.toString(),
      detail: `${totalTasksPending} pending`,
      icon: CheckCircle,
      color: 'text-blue-600',
    },
    {
      label: 'Average KPI',
      value: `${avgKpi}%`,
      detail: 'Organization-wide',
      icon: BarChart3,
      color: 'text-purple-600',
    },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / recordsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Helper functions for grades
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'A-':
      case 'B+':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'B':
      case 'B-':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'C+':
      case 'C':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const taskTotal = selectedDepartment
    ? selectedDepartment.tasksCompleted + selectedDepartment.tasksPending
    : 0;
  const taskCompletionRate =
    selectedDepartment && taskTotal > 0
      ? Math.round((selectedDepartment.tasksCompleted / taskTotal) * 100)
      : 0;
  const attendanceRate = selectedDepartment
    ? Math.round(selectedDepartment.attendanceRate || 0)
    : 0;
  const averageKpiScore = selectedDepartment
    ? Math.round(selectedDepartment.averageKpi || 0)
    : 0;
  const activeKpis = selectedDepartment
    ? selectedDepartment.kpis.filter((kpi) => kpi.isActive).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Reports</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            View performance reports by department. Click on a department for
            detailed analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchReports}
            className="ml-auto text-sm font-medium text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {metric.label}
                </p>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <p className="mb-1 text-3xl font-normal tracking-tight text-gray-800">
                {isLoading ? '—' : metric.value}
              </p>
              <p className="text-xs text-muted-foreground">{metric.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="max-w-md flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Type:
              </span>
              <div className="flex items-center gap-1">
                {reportTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedType === type.value
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Reports Table */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="border-b border-border/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-normal text-gray-700">
                Department Performance Reports
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Click on any department to view detailed team scores, KPIs, and
                AI insights.
              </p>
            </div>
            <button
              onClick={() => setShowScoringInfo(true)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Info className="h-3.5 w-3.5" />
              How scoring works
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading reports...
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDepartments.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="mb-4 rounded-full bg-muted/50 p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-gray-800">
              No reports found
            </h3>
            <p className="max-w-sm text-center text-xs text-muted-foreground">
              {searchQuery
                ? 'No departments match your search. Try a different search term.'
                : 'No department data available. Reports will appear here once there are staff and tasks in the system.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Department Reports List */}
        {!isLoading && paginatedDepartments.length > 0 && (
          <div className="divide-y divide-border/40">
            {paginatedDepartments.map((dept) => (
              <div
                key={dept.department}
                onClick={() => handleDepartmentClick(dept)}
                className="cursor-pointer p-6 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="mb-1 text-sm font-medium text-gray-800">
                              {dept.department}
                            </h3>
                            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {dept.totalStaff} staff
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {currentQuarter} {currentYear}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Metrics Preview */}
                        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Average KPI
                            </p>
                            <p
                              className={`text-sm font-medium ${
                                dept.averageKpi >= 70
                                  ? 'text-emerald-600'
                                  : dept.averageKpi >= 50
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {dept.averageKpi}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Tasks Done
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {dept.tasksCompleted}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Tasks Pending
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {dept.tasksPending}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Attendance
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {dept.attendanceRate}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Top Performer
                            </p>
                            <p className="truncate text-sm font-medium text-gray-800">
                              {dept.topPerformer || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Report Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {/* <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated just now
                          </span> */}
                          <span className="font-medium text-primary">
                            Click to view details →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredDepartments.length > recordsPerPage && (
          <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * recordsPerPage + 1}-
              {Math.min(
                currentPage * recordsPerPage,
                filteredDepartments.length
              )}{' '}
              of {filteredDepartments.length} departments
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Department Detail Modal */}
      {selectedDepartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedDepartment(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border/40 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="relative border-b border-border/40 bg-white p-6">
                  <button
                    onClick={() => setSelectedDepartment(null)}
                    className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 bg-muted/20 text-muted-foreground">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-800">
                        {selectedDepartment.department}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {selectedDepartment.totalStaff} employees •{' '}
                        {currentQuarter} {currentYear}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/40 bg-white px-4 py-3 shadow-sm">
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedDepartment.averageKpi}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Average KPI
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-white px-4 py-3 shadow-sm">
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedDepartment.attendanceRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Attendance
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-white px-4 py-3 shadow-sm">
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedDepartment.tasksCompleted}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tasks Done
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-white px-4 py-3 shadow-sm">
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedDepartment.tasksPending}
                      </p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6 p-6">
                  {/* Team Score Section */}
                  {selectedDepartment.teamScore && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        Team Performance Score
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl border border-border/40 bg-white p-4 text-center">
                          <p className="text-2xl font-semibold text-gray-800">
                            {selectedDepartment.teamScore.overallTeamScore.toFixed(
                              1
                            )}
                            %
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Overall Score
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-white p-4 text-center">
                          <p className="text-2xl font-semibold text-gray-800">
                            {selectedDepartment.teamScore.kpiAchievementScore.toFixed(
                              1
                            )}
                            %
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            KPI Achievement
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-white p-4 text-center shadow-sm">
                          <div
                            className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-lg font-semibold ${getGradeColor(selectedDepartment.teamScore.grade)}`}
                          >
                            {selectedDepartment.teamScore.grade}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Team Grade
                          </p>
                        </div>
                      </div>

                      {(selectedDepartment.teamScore.individualAvgScore ??
                        null) !== null && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-border/40 bg-white p-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Team KPI score (80%)</span>
                              <span className="text-gray-700">
                                {selectedDepartment.teamScore.kpiAchievementScore.toFixed(
                                  1
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                selectedDepartment.teamScore.kpiAchievementScore
                              }
                              className="mt-2 h-2"
                            />
                          </div>
                          <div className="rounded-xl border border-border/40 bg-white p-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Individual KPI avg (20%)</span>
                              <span className="text-gray-700">
                                {selectedDepartment.teamScore.individualAvgScore?.toFixed(
                                  1
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                selectedDepartment.teamScore
                                  .individualAvgScore ?? 0
                              }
                              className="mt-2 h-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-xl border border-border/40 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        Department Pulse
                      </h3>
                      <span className="rounded-full border border-border/40 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        This week
                      </span>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>KPI completion</span>
                          <span className="text-gray-700">
                            {averageKpiScore}%
                          </span>
                        </div>
                        <Progress
                          value={averageKpiScore}
                          className="mt-2 h-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Attendance rate</span>
                          <span className="text-gray-700">
                            {attendanceRate}%
                          </span>
                        </div>
                        <Progress value={attendanceRate} className="mt-2 h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Task completion</span>
                          <span className="text-gray-700">
                            {taskCompletionRate}%
                          </span>
                        </div>
                        <Progress
                          value={taskCompletionRate}
                          className="mt-2 h-2"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          {selectedDepartment.tasksCompleted} completed •{' '}
                          {selectedDepartment.tasksPending} pending
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        Active KPIs: {activeKpis}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        Pending tasks: {selectedDepartment.tasksPending}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        Team size: {selectedDepartment.totalStaff}
                      </span>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {selectedDepartment.teamScore?.aiSummary && (
                    <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-slate-600">
                        <Star className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          AI Summary
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700">
                        {selectedDepartment.teamScore.aiSummary}
                      </p>
                    </div>
                  )}

                  {/* KPIs Section */}
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      Department KPIs ({selectedDepartment.kpis.length})
                    </h3>
                    {selectedDepartment.kpis.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDepartment.kpis.map((kpi) => (
                          <div
                            key={kpi.id}
                            className="flex items-center justify-between rounded-lg border border-border/40 bg-white p-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                {kpi.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Target: {kpi.targetValue} {kpi.targetUnit} •
                                Weight: {kpi.weight}%
                              </p>
                            </div>
                            <span
                              className={`rounded px-2 py-1 text-xs font-medium ${
                                kpi.isActive
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {kpi.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/40 bg-muted/20 p-6 text-center text-sm text-gray-500">
                        <Target className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        <p>No KPIs defined for this department yet</p>
                      </div>
                    )}
                  </div>

                  {/* Top Performer */}
                  {selectedDepartment.topPerformer && (
                    <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-white text-muted-foreground">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Top Performer
                          </p>
                          <p className="text-lg font-semibold text-gray-800">
                            {selectedDepartment.topPerformer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border/40 p-4">
                  <button
                    onClick={() => setSelectedDepartment(null)}
                    className="w-full rounded-md border border-border/40 bg-white py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Scoring Info Modal */}
      {showScoringInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowScoringInfo(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                  <Info className="h-5 w-5 text-primary" />
                  Understanding Performance Scores
                </h2>
                <button
                  onClick={() => setShowScoringInfo(false)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6 text-sm text-gray-600">
                {/* KPI Score */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-800">
                    <Target className="h-4 w-4" />
                    Team KPI Score (Department Level)
                  </h3>
                  <p className="mb-2">
                    Measures how well a team achieves its Key Performance
                    Indicators. Team Leads define KPIs and report progress
                    weekly.
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-blue-700">
                    <li>
                      Each KPI has a target value and weight (total = 100%)
                    </li>
                    <li>Achievement = (Actual / Target × 100)</li>
                    <li>
                      Team Score = Weighted average of all KPI achievements
                    </li>
                  </ul>
                </div>

                {/* AURA Score */}
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-purple-800">
                    <Zap className="h-4 w-4" />
                    AURA Score (Individual Level)
                  </h3>
                  <p className="mb-2">
                    The <strong>AURA Score</strong> (Automated Universal Rating
                    Assessment) is an individual performance metric based on 4
                    pillars:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-purple-700">
                    <li>
                      <strong>Technical Competence (35%)</strong> - Daily
                      reports, task performance, KPI achievement
                    </li>
                    <li>
                      <strong>Behavioral (25%)</strong> - Attendance,
                      punctuality, consistency, peer helpfulness
                    </li>
                    <li>
                      <strong>Culture Fit (20%)</strong> - Policy compliance,
                      values alignment
                    </li>
                    <li>
                      <strong>Growth & Learning (20%)</strong> - Training,
                      certifications, improvement trend
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-purple-600">
                    ~80% auto-calculated from system data, ~19% from Team Lead
                    ratings, ~1% peer ratings
                  </p>
                </div>

                {/* Grade System */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-gray-800">
                    <Award className="h-4 w-4" />
                    Grade System
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-8 items-center justify-center rounded bg-emerald-100 text-xs font-bold text-emerald-700">
                        A
                      </span>
                      <span>90%+ (Exceptional)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-8 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700">
                        B
                      </span>
                      <span>80-89% (High Performer)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-8 items-center justify-center rounded bg-amber-100 text-xs font-bold text-amber-700">
                        C
                      </span>
                      <span>70-79% (Good Standing)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-8 items-center justify-center rounded bg-orange-100 text-xs font-bold text-orange-700">
                        D
                      </span>
                      <span>60-69% (Needs Improvement)</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="flex h-6 w-8 items-center justify-center rounded bg-red-100 text-xs font-bold text-red-700">
                        F
                      </span>
                      <span>&lt;60% (Performance Alert)</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowScoringInfo(false)}
                className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
