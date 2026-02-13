'use client';
/* eslint-disable @next/next/no-img-element */

import {
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getDashboardStats,
  getStaffWithPerformance,
  type DashboardStats,
  type StaffWithPerformance,
} from '@/app/actions/dashboard';
import {
  TimeRangeSelector,
  CustomDateRangePicker,
  type TimeRange,
} from '@/components/filters/TimeRangeSelector';

type KpiFilter =
  | 'overall'
  | 'completion'
  | 'attendance'
  | 'compliance'
  | 'feedback';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staff, setStaff] = useState<StaffWithPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('overall');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchData = useCallback(async () => {
    if (timeRange === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [statsData, staffData] = await Promise.all([
        getDashboardStats({
          timeRange,
          startDate: customStartDate,
          endDate: customEndDate,
        }),
        getStaffWithPerformance(),
      ]);
      setStats(statsData);
      setStaff(staffData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter staff based on search
  const filteredStaff = staff.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.department?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      ) ||
      (member.job_title?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      )
  );

  // Get the line data key based on filter
  const getLineDataKey = () => {
    switch (kpiFilter) {
      case 'completion':
        return 'completion';
      case 'attendance':
        return 'attendance';
      case 'compliance':
        return 'compliance';
      case 'feedback':
        return 'feedback';
      default:
        return 'overall';
    }
  };

  // Build metrics array from live data
  const metrics = stats
    ? [
        {
          label: 'Task Completion Score',
          subtitle: 'Tasks',
          value: `${stats.taskCompletion.score}%`,
          delta: 'vs last week',
          detail: `${stats.taskCompletion.total} tasks total`,
          trend: stats.taskCompletion.trend,
          isPositive: true,
        },
        {
          label: 'Attendance Score',
          subtitle: 'Attendance',
          value: `${stats.attendance.score}%`,
          delta: 'vs last week',
          detail: `${stats.attendance.total} staff tracked`,
          trend: stats.attendance.trend,
          isPositive: true,
        },
        {
          label: 'Compliance Score',
          subtitle: 'Compliance',
          value: `${stats.compliance.score}%`,
          delta: 'vs last week',
          detail: `${stats.compliance.openIssues} open issues`,
          trend: stats.compliance.trend,
          isPositive: true,
        },
        {
          label: 'Daily Report Submission',
          subtitle: 'Reports',
          value: `${stats.feedback?.score ?? 85}%`,
          delta: 'vs last week',
          detail: `${stats.feedback?.responses ?? stats.totalStaff} staff submitting`,
          trend: stats.feedback?.trend ?? '+2%',
          isPositive: true,
        },
        {
          label: 'Overall KPI Rating',
          subtitle: 'Composite',
          value: `${stats.overallKpi.score}%`,
          delta: 'vs last week',
          detail: 'Weighted across all KPIs',
          trend: stats.overallKpi.trend,
          isPositive: true,
        },
      ]
    : [];

  if (isLoading && !stats) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Overview</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            High-level snapshot of performance across your organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <button
            onClick={fetchData}
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

      {/* Custom Date Range Picker */}
      {timeRange === 'custom' && (
        <CustomDateRangePicker
          startDate={customStartDate}
          endDate={customEndDate}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          onApply={fetchData}
          onReset={() => {
            setTimeRange('week');
            setCustomStartDate('');
            setCustomEndDate('');
          }}
          applyDisabled={!customStartDate || !customEndDate}
        />
      )}

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

      {/* Metrics Grid - Full Width */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="group rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {metric.label}
                </p>
                <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {metric.subtitle}
                </span>
              </div>
            </div>
            <p className="mb-2 text-3xl font-normal tracking-tight text-gray-800">
              {metric.value}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`flex items-center gap-1 font-medium ${
                  metric.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {metric.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {metric.trend}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground">{metric.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push('/dashboard/ai-insights')}
        className="group flex w-full items-center justify-between rounded-xl border border-border/40 bg-primary/5 px-6 py-4 text-left shadow-sm transition-all hover:bg-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              AI Team Insights
            </p>
            <p className="text-xs text-muted-foreground">
              View the latest weekly insights for every team.
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-primary">View insights</span>
      </button>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
        {/* Left Column (Main Content) */}
        <div className="min-w-0 space-y-6">
          {/* Overall KPI Trend */}
          <div className="rounded-xl border border-border/40 bg-white p-10 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-normal text-gray-700">
                  Overall KPI Trend
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Track KPI performance over time
                </p>
              </div>
              {/* <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  Updated just now
                </span>
              </div> */}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
              {(
                [
                  'overall',
                  'completion',
                  'attendance',
                  'compliance',
                  'feedback',
                ] as KpiFilter[]
              ).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setKpiFilter(filter)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    kpiFilter === filter
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-border/40 bg-white text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <div className="h-[300px] w-full">
              {stats?.kpiTrend && stats.kpiTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.kpiTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                      domain={[0, 100]}
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
                      dataKey={getLineDataKey()}
                      stroke="#575ff4"
                      strokeWidth={2}
                      dot={{
                        fill: 'white',
                        stroke: '#575ff4',
                        strokeWidth: 2,
                        r: 4,
                      }}
                      activeDot={{
                        r: 6,
                        fill: '#575ff4',
                        stroke: 'white',
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </div>
          </div>

          {/* Staff Performance Table */}
          <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
            <div className="border-b border-border/40 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-normal text-gray-700">
                    Staff Performance
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Task status and KPI change
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="Search staff"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-48 rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {/* <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Sort
                  </button> */}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Task Status
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Aura Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading staff...
                        </p>
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-muted-foreground"
                      >
                        {searchQuery
                          ? 'No staff found matching your search'
                          : 'No staff members found'}
                      </td>
                    </tr>
                  ) : (
                    filteredStaff
                      .slice(
                        (currentPage - 1) * pageSize,
                        currentPage * pageSize
                      )
                      .map((member) => {
                        const kpiImprovement = member.kpiImprovement;
                        const auraScore = member.auraScore;

                        return (
                          <tr
                            key={member.id}
                            className="transition-colors hover:bg-muted/20"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={member.avatar_url}
                                  alt={member.full_name}
                                  className="h-8 w-8 rounded-full ring-2 ring-white"
                                />
                                {kpiImprovement != null &&
                                  (kpiImprovement > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-rose-500" />
                                  ))}
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {member.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.department || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-700">
                                {member.job_title || 'Staff'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              {member.taskStatus ? (
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                    member.taskStatus === 'On Track'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : member.taskStatus === 'At Risk'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {member.taskStatus}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs">
                                <span className="text-emerald-600">
                                  {member.tasksCompleted} done
                                </span>
                                <span className="text-muted-foreground">
                                  {' '}
                                  /{' '}
                                </span>
                                <span className="text-amber-600">
                                  {member.tasksPending} pending
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <span>
                                  {auraScore != null
                                    ? auraScore.toFixed(1)
                                    : '—'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                {filteredStaff.length > 0
                  ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredStaff.length)}`
                  : '0'}{' '}
                of {filteredStaff.length} staff
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                {Array.from(
                  {
                    length: Math.min(
                      5,
                      Math.ceil(filteredStaff.length / pageSize)
                    ),
                  },
                  (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'border border-border/40 bg-white text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                {Math.ceil(filteredStaff.length / pageSize) > 5 && (
                  <span className="px-2 text-xs text-muted-foreground">
                    ...
                  </span>
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(
                        Math.ceil(filteredStaff.length / pageSize),
                        p + 1
                      )
                    )
                  }
                  disabled={
                    currentPage >= Math.ceil(filteredStaff.length / pageSize)
                  }
                  className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Secondary Content) */}
        <div className="min-w-0 space-y-6">
          {/* Task Distribution */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-normal text-gray-700">
                  Task Distribution
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  By current task status
                </p>
              </div>
              <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
              </span>
            </div>

            {stats?.taskDistribution && stats.taskDistribution.length > 0 ? (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.taskDistribution.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {stats.taskDistribution
                          .filter((d) => d.value > 0)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 space-y-3">
                  {stats.taskDistribution.map((item) => {
                    const total = stats.taskDistribution.reduce(
                      (sum, i) => sum + i.value,
                      0
                    );
                    const percentage =
                      total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-gray-700">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">
                            {item.value}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {percentage}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No task data available
              </div>
            )}
          </div>

          {/* Usage Summary */}
          <div className="rounded-xl border border-border/40 bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-normal text-gray-800">
                Usage summary
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Monitor KPIs across teams in one place.
              </p>
            </div>
            <a
              href="/dashboard/reports"
              className="block w-full rounded-md bg-primary px-4 py-2 text-center text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              View reports
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
