'use client';

import { useState, useEffect } from 'react';
import { Download, Search, Star } from 'lucide-react';

// Mock data for team members
const teamMembers = [
  {
    id: 1,
    name: 'Sarah Lee',
    title: 'Account Executive',
    department: 'Sales',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    overallKpi: 91,
    kpis: {
      tasks: 92,
      attendance: 88,
      compliance: 95,
      feedback: 4.6,
    },
    attendanceStatus: 'On Track',
    lastUpdated: '10 mins ago',
    fullTitle: 'Account Executive',
    fullDepartment: 'Sales · North America',
    strengths: ['Task completion', 'Customer satisfaction'],
    improvements: ['On-time check-ins'],
    snapshot: [
      'Consistently exceeds task completion targets for the last 6 weeks.',
      'Attendance improved after schedule adjustment, but 2 late check-ins this period.',
      'Customer feedback trending upward, with 4.6 average rating.',
    ],
  },
  {
    id: 2,
    name: 'Michael Tan',
    title: 'Support Lead',
    department: 'Support',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    overallKpi: 78,
    kpis: {
      tasks: 75,
      attendance: 70,
      compliance: 82,
      feedback: 3.6,
    },
    attendanceStatus: 'At Risk',
    lastUpdated: '35 mins ago',
    fullTitle: 'Support Lead',
    fullDepartment: 'Support',
    strengths: ['Team collaboration'],
    improvements: ['Attendance consistency', 'Task completion rates'],
    snapshot: [
      'Attendance has declined over the past 2 weeks.',
      'Task completion rates below team average.',
    ],
  },
  {
    id: 3,
    name: 'Priya Patel',
    title: 'Ops Manager',
    department: 'Operations',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    overallKpi: 94,
    kpis: {
      tasks: 96,
      attendance: 92,
      compliance: 98,
      feedback: 4.8,
    },
    attendanceStatus: 'On Track',
    lastUpdated: '1 hour ago',
    fullTitle: 'Ops Manager',
    fullDepartment: 'Operations',
    strengths: [
      'Operational efficiency',
      'Compliance adherence',
      'Team leadership',
    ],
    improvements: [],
    snapshot: [
      'Top performer across all metrics this quarter.',
      'Excellent compliance record with 98% adherence.',
    ],
  },
];

const summaryMetrics = [
  {
    label: 'Avg KPI score',
    value: '84',
    detail: '+3.1 vs last week.',
  },
  {
    label: 'Top department',
    value: 'Customer Support',
    detail: 'Avg KPI 89.',
  },
  {
    label: 'At risk staff',
    value: '6',
    detail: 'Need coaching this week.',
  },
];

export default function StaffPerformancePage() {
  const [selectedStaffId, setSelectedStaffId] = useState<number>(1);
  // Commented out filter state variables
  // const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  // const [selectedRole, setSelectedRole] = useState<string>('All roles');
  // const [selectedDateRange, setSelectedDateRange] = useState<string>('Last 30 days');
  const [selectedTab, setSelectedTab] = useState<string>('Overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('Overall');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');

  // Ensure selectedStaffId is valid, default to first member
  useEffect(() => {
    const isValid = teamMembers.some((m) => m.id === selectedStaffId);
    if (!isValid && teamMembers.length > 0 && teamMembers[0]) {
      setSelectedStaffId(teamMembers[0].id);
    }
  }, [selectedStaffId]);

  const selectedStaff =
    teamMembers.find((member) => member.id === selectedStaffId) ??
    teamMembers[0];

  // Ensure selectedStaff exists (early return if no data)
  if (!selectedStaff || teamMembers.length === 0) {
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
        <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
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
              className={`${metric.value === 'Customer Support' ? 'text-xl' : 'text-2xl'} mb-1 font-normal tracking-tight text-gray-800`}
            >
              {metric.value}
            </p>
            <p className="text-xs text-muted-foreground">{metric.detail}</p>
          </div>
        ))}
      </div>

      {/* Filter Section - Commented out */}
      {/* <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Department Filter */}
      {/* <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Department
              </p>
              <div className="flex items-center gap-1">
                {['All', 'Sales', 'Support', 'Operations'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedDepartment === dept
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div> */}

      {/* Role Filter */}
      {/* <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Role
              </p>
              <div className="flex items-center gap-1">
                {['All roles', 'Executive', 'Lead', 'Manager'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedRole === role
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div> */}

      {/* Date Range Filter */}
      {/* <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Date range
              </p>
              <div className="flex items-center gap-1">
                {['Last 30 days', 'Last 90 days', 'YTD'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedDateRange(range)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedDateRange === range
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div> */}

      {/* Action Buttons */}
      {/* <div className="flex items-end gap-2">
            <button className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              Reset
            </button>
            <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary/90 transition-colors">
              Apply filters
            </button>
          </div>
        </div>
      </div> */}

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
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Team Members List */}
          <div className="max-h-[calc(100vh-400px)] divide-y divide-border/40 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {teamMembers.map((member) => {
              const isSelected = selectedStaffId === member.id;
              return (
                <div
                  key={member.id}
                  onClick={() => {
                    // Ensure only this staff member is selected
                    setSelectedStaffId(member.id);
                  }}
                  className={`cursor-pointer p-4 transition-colors ${
                    isSelected
                      ? 'border-l-4 border-l-primary bg-primary/5'
                      : 'border-l-4 border-l-transparent hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-10 w-10 rounded-full ring-2 ring-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.title} · {member.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-normal text-gray-800">
                            {member.overallKpi}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Overall KPI
                          </p>
                        </div>
                      </div>

                      {/* KPI Breakdown */}
                      <div className="mb-3 space-y-2">
                        {/* Tasks */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Tasks
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {member.kpis.tasks}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${member.kpis.tasks}%` }}
                            />
                          </div>
                        </div>

                        {/* Attendance */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Attendance
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">
                                {member.kpis.attendance}%
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  member.attendanceStatus === 'On Track'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {member.attendanceStatus}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${member.kpis.attendance}%` }}
                            />
                          </div>
                        </div>

                        {/* Compliance */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Compliance
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {member.kpis.compliance}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${member.kpis.compliance}%` }}
                            />
                          </div>
                        </div>

                        {/* Feedback */}
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Feedback
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium text-gray-700">
                                {member.kpis.feedback}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{
                                width: `${(member.kpis.feedback / 5) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          Updated {member.lastUpdated}
                        </p>
                        <button className="text-xs font-medium text-primary hover:text-primary/80 hover:underline">
                          View detail
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Detailed View */}
        <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
          <div className="border-b border-border/40 p-6">
            <div className="mb-4 flex items-start gap-3">
              <img
                src={selectedStaff.avatar}
                alt={selectedStaff.name}
                className="h-12 w-12 rounded-full ring-2 ring-white"
              />
              <div className="flex-1">
                <p className="text-base font-medium text-gray-800">
                  {selectedStaff.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedStaff.fullTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedStaff.fullDepartment}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1">
                <p className="text-xs font-medium text-emerald-700">
                  Overall KPI: {selectedStaff.overallKpi} · On Track
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
                {/* Performance over time */}
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
                      Updated 5 mins ago
                    </span>
                  </div>

                  {/* Metric Selection Tabs */}
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {[
                      'Overall',
                      'Task Completion',
                      'Attendance',
                      'Compliance',
                      'Feedback',
                    ].map((metric) => (
                      <button
                        key={metric}
                        onClick={() => setSelectedMetric(metric)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedMetric === metric
                            ? 'bg-primary text-white'
                            : 'border border-border/40 bg-white text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        {metric}
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

                  {/* Chart Placeholder */}
                  <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-border/40 bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                      Chart will be rendered here
                    </p>
                  </div>

                  {/* Chart Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-muted-foreground">Overall KPI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary/50"></div>
                      <span className="text-muted-foreground">
                        Task completion
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span className="text-muted-foreground">Attendance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <span className="text-muted-foreground">
                        Feedback score
                      </span>
                    </div>
                  </div>
                </div>

                {/* Snapshot */}
                <div>
                  <h3 className="mb-1 text-sm font-normal text-gray-700">
                    Snapshot
                  </h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Key highlights for coaching conversations.
                  </p>
                  <ul className="space-y-2">
                    {selectedStaff.snapshot.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-gray-700"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {selectedTab === 'KPIs' && (
              <div>
                <h3 className="mb-4 text-sm font-normal text-gray-700">
                  KPI Breakdown
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        Task Completion
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {selectedStaff.kpis.tasks}%
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
                        Attendance
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {selectedStaff.kpis.attendance}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${selectedStaff.kpis.attendance}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        Compliance
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {selectedStaff.kpis.compliance}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${selectedStaff.kpis.compliance}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        Feedback Score
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {selectedStaff.kpis.feedback}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${(selectedStaff.kpis.feedback / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'Attendance' && (
              <div>
                <h3 className="mb-4 text-sm font-normal text-gray-700">
                  Attendance Details
                </h3>
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
                        Attendance Rate
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {selectedStaff.kpis.attendance}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>
                      Attendance tracking information will be displayed here.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'Feedback' && (
              <div>
                <h3 className="mb-4 text-sm font-normal text-gray-700">
                  Feedback Details
                </h3>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border/40 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        Average Rating
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {selectedStaff.kpis.feedback}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / 5.0
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
                  <div className="text-xs text-muted-foreground">
                    <p>Detailed feedback and reviews will be displayed here.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
