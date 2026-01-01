'use client';
/* eslint-disable @next/next/no-img-element */

import {
  Download,
  Filter,
  Search,
  ArrowUpDown,
  Loader2,
  AlertCircle,
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
import { useState, useEffect } from 'react';
import { getAllProfiles, type StaffProfile } from '@/lib/api/backend';

const kpiTrendData = [
  {
    name: 'Mon',
    overall: 85,
    completion: 88,
    attendance: 95,
    compliance: 78,
    feedback: 82,
  },
  {
    name: 'Tue',
    overall: 87,
    completion: 90,
    attendance: 96,
    compliance: 80,
    feedback: 84,
  },
  {
    name: 'Wed',
    overall: 86,
    completion: 89,
    attendance: 94,
    compliance: 82,
    feedback: 83,
  },
  {
    name: 'Thu',
    overall: 88,
    completion: 91,
    attendance: 97,
    compliance: 84,
    feedback: 85,
  },
  {
    name: 'Fri',
    overall: 89,
    completion: 92,
    attendance: 96,
    compliance: 83,
    feedback: 87,
  },
  {
    name: 'Sat',
    overall: 87,
    completion: 90,
    attendance: 93,
    compliance: 85,
    feedback: 86,
  },
  {
    name: 'Sun',
    overall: 89,
    completion: 92,
    attendance: 96,
    compliance: 86,
    feedback: 88,
  },
];

const taskDistributionData = [
  { name: 'Completed', value: 148, color: '#575ff4' },
  { name: 'Pending', value: 64, color: '#a8acf8' },
  { name: 'Overdue', value: 26, color: '#f59e0b' },
];

const metrics = [
  {
    label: 'Task Completion Score',
    subtitle: 'Tasks',
    value: '92%',
    delta: 'vs last week',
    detail: '12k tasks evaluated',
    trend: '+5%',
  },
  {
    label: 'Attendance Score',
    subtitle: 'Attendance',
    value: '88%',
    delta: 'vs last week',
    detail: '320 shifts tracked',
    trend: '+2%',
  },
  {
    label: 'Compliance Score',
    subtitle: 'Compliance',
    value: '96%',
    delta: 'vs last week',
    detail: '12 open issues',
    trend: '+1%',
  },
  {
    label: 'Customer Feedback Score',
    subtitle: 'Feedback',
    value: '4.6',
    delta: 'vs last week',
    detail: '284 responses',
    trend: '+0.3',
  },
  {
    label: 'Overall KPI Rating',
    subtitle: 'Composite',
    value: '89',
    delta: 'vs last week',
    detail: 'Weighted across all KPIs',
    trend: '+3',
  },
];

export default function DashboardPage() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStaff() {
      try {
        setIsLoading(true);
        const profiles = await getAllProfiles();
        setStaff(profiles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch staff');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStaff();
  }, []);

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
          <div className="flex items-center gap-1 rounded-md border border-border/40 bg-white p-1">
            <button className="rounded bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors">
              Today
            </button>
            <button className="rounded px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
              Week
            </button>
            <button className="rounded px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
              Month
            </button>
            <button className="rounded px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
              Custom
            </button>
          </div>
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

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
              <span className="font-medium text-emerald-600">
                {metric.trend}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground">{metric.delta}</span>
            </div>
          </div>
        ))}
      </div>

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
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  Updated 5 mins ago
                </span>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
              <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
                Overall
              </button>
              <button className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                Completion
              </button>
              <button className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                Attendance
              </button>
              <button className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                Compliance
              </button>
              <button className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                Feedback
              </button>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiTrendData}>
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
                    dataKey="overall"
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
                    Weekly KPIs, task and attendance status
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="Search staff"
                      className="h-9 w-48 rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Sort
                  </button>
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
                      Weekly KPI
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Task Status
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading staff...
                        </p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                      </td>
                    </tr>
                  ) : staff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-muted-foreground"
                      >
                        No staff members found
                      </td>
                    </tr>
                  ) : (
                    staff.slice(0, 10).map((member) => (
                      <tr
                        key={member.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                member.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.full_name}`
                              }
                              alt={member.full_name || 'Staff'}
                              className="h-8 w-8 rounded-full ring-2 ring-white"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {member.full_name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.department || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">
                            {member.job_title || member.role || 'Staff'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                              member.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {member.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-xs font-medium text-primary hover:text-primary/80 hover:underline">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                {staff.length > 0 ? '1-' + Math.min(10, staff.length) : '0'} of{' '}
                {staff.length} staff
              </p>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50">
                  Prev
                </button>
                <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90">
                  1
                </button>
                <button className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                  2
                </button>
                <button className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Secondary Content) */}
        <div className="min-w-0 space-y-6">
          {/* Task Distribution */}
          <div className="rounded-xl border border-border/40 bg-white p-2 shadow-sm">
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
                Today
              </span>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {taskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-4">
              {taskDistributionData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {item.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {Math.round((item.value / 238) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
            <button className="w-full rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
              View reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
