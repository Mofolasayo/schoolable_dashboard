'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useMemo } from 'react';
import { Download, Search, Star, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  getAllProfiles,
  getAuraDashboard,
  type StaffProfile,
  type AuraResponse,
} from '@/lib/api/backend';

// Combined type for staff with Aura data
interface StaffWithAura extends StaffProfile {
  aura?: AuraResponse;
  overallKpi: number;
  kpis: {
    tasks: number;
    attendance: number;
    compliance: number;
    feedback: number;
  };
  attendanceStatus: 'On Track' | 'At Risk';
  lastUpdated: string;
  snapshot: string[];
}

// Helper to generate avatar URL
function getAvatarUrl(staff: StaffProfile): string {
  if (staff.avatar_url && staff.avatar_url.length > 0) {
    return staff.avatar_url;
  }
  const seed = staff.employee_id || staff.email || staff.full_name || 'User';
  const style = staff.gender?.toLowerCase() === 'female' ? 'avataaars' : 'bottts';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Helper to generate snapshot from Aura data
function generateSnapshot(staff: StaffWithAura): string[] {
  const snapshot: string[] = [];

  if (staff.aura) {
    const score = staff.aura.auraScore;
    if (score >= 90) {
      snapshot.push('Consistently exceeds performance targets across all metrics.');
    } else if (score >= 80) {
      snapshot.push('Strong performance with room for minor improvements.');
    } else if (score >= 70) {
      snapshot.push('Meeting expectations with some areas needing attention.');
    } else {
      snapshot.push('Performance requires improvement in key areas.');
    }

    // Add pillar-specific insights
    if (staff.aura.pillars) {
      const technical = staff.aura.pillars.technical?.score || 0;
      const behavioral = staff.aura.pillars.behavioral?.score || 0;

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

    snapshot.push(`Grade: ${staff.aura.grade} | QGPA: ${staff.aura.qgpa.toFixed(2)}`);
  } else {
    snapshot.push('No Aura data available yet for this employee.');
    snapshot.push('Weekly ratings need to be submitted to generate insights.');
  }

  return snapshot;
}

// Calculate KPIs from Aura data
function calculateKpis(aura?: AuraResponse): { tasks: number; attendance: number; compliance: number; feedback: number } {
  if (!aura || !aura.pillars) {
    return { tasks: 0, attendance: 0, compliance: 0, feedback: 0 };
  }

  // Map pillar scores to KPI categories
  return {
    tasks: aura.pillars.technical?.score || 0,
    attendance: aura.pillars.behavioral?.score || 0,
    compliance: aura.pillars.cultureFit?.score || 0,
    feedback: (aura.pillars.collaboration?.score || 0) / 20, // Convert to 5-point scale
  };
}

export default function StaffPerformancePage() {
  const [staffList, setStaffList] = useState<StaffWithAura[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('Overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('Overall');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profiles = await getAllProfiles();

      // Filter out admin profiles
      const staffProfiles = profiles.filter(
        (p) => !['admin', 'super_admin', 'superadmin'].includes(p.role?.toLowerCase() || '')
      );

      // Fetch Aura data for each staff member in parallel
      const staffWithAura = await Promise.all(
        staffProfiles.map(async (profile): Promise<StaffWithAura> => {
          let aura: AuraResponse | undefined = undefined;

          try {
            aura = await getAuraDashboard(profile.id);
          } catch {
            // No Aura data available for this staff
          }

          const kpis = calculateKpis(aura);
          const overallKpi = aura?.auraScore || 0;

          const staffWithData: StaffWithAura = {
            ...profile,
            aura,
            overallKpi,
            kpis,
            attendanceStatus: (kpis.attendance >= 80 ? 'On Track' : 'At Risk') as 'On Track' | 'At Risk',
            lastUpdated: aura?.lastUpdated
              ? formatTimeAgo(new Date(aura.lastUpdated))
              : 'No data',
            snapshot: [],
          };

          staffWithData.snapshot = generateSnapshot(staffWithData);

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

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const staffWithScores = staffList.filter((s) => s.overallKpi > 0);
    const avgKpi = staffWithScores.length > 0
      ? Math.round(staffWithScores.reduce((sum, s) => sum + s.overallKpi, 0) / staffWithScores.length)
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
      .map(([name, data]) => ({ name, avg: data.count ? Math.round(data.sum / data.count) : 0 }))
      .sort((a, b) => b.avg - a.avg)[0];

    const atRiskCount = staffList.filter((s) => s.attendanceStatus === 'At Risk').length;

    return [
      {
        label: 'Avg KPI score',
        value: avgKpi.toString(),
        detail: `${staffWithScores.length} staff with scores`,
      },
      {
        label: 'Top department',
        value: topDept?.name || 'N/A',
        detail: topDept ? `Avg KPI ${topDept.avg}` : 'No data',
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading staff performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Staff Performance</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Dive into individual KPIs and trends across your team.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <p className="text-sm text-red-700 mb-4">{error}</p>
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
          <h1 className="text-xl font-normal text-gray-800">Staff Performance</h1>
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
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            Export
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

          {/* Team Members List */}
          <div className="max-h-[calc(100vh-400px)] divide-y divide-border/40 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredStaff.map((member) => {
              const isSelected = selectedStaffId === member.id;
              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedStaffId(member.id)}
                  className={`cursor-pointer p-4 transition-colors ${isSelected
                      ? 'border-l-4 border-l-primary bg-primary/5'
                      : 'border-l-4 border-l-transparent hover:bg-muted/20'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={getAvatarUrl(member)}
                      alt={member.full_name || 'Staff'}
                      className="h-10 w-10 rounded-full ring-2 ring-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {member.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.job_title || 'Staff'} · {member.department || 'Unassigned'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-normal text-gray-800">
                            {member.overallKpi > 0 ? Math.round(member.overallKpi) : '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Overall KPI
                          </p>
                        </div>
                      </div>

                      {/* KPI Breakdown */}
                      {member.overallKpi > 0 && (
                        <div className="mb-3 space-y-2">
                          {/* Tasks */}
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                Technical
                              </span>
                              <span className="text-xs font-medium text-gray-700">
                                {Math.round(member.kpis.tasks)}%
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
                                Behavioral
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700">
                                  {Math.round(member.kpis.attendance)}%
                                </span>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${member.attendanceStatus === 'On Track'
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
                                Culture Fit
                              </span>
                              <span className="text-xs font-medium text-gray-700">
                                {Math.round(member.kpis.compliance)}%
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
                                Collaboration
                              </span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium text-gray-700">
                                  {member.kpis.feedback.toFixed(1)}
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
                      )}

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

            {filteredStaff.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No staff found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Detailed View */}
        {selectedStaff && (
          <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
            <div className="border-b border-border/40 p-6">
              <div className="mb-4 flex items-start gap-3">
                <img
                  src={getAvatarUrl(selectedStaff)}
                  alt={selectedStaff.full_name || 'Staff'}
                  className="h-12 w-12 rounded-full ring-2 ring-white"
                />
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-800">
                    {selectedStaff.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStaff.job_title || 'Staff'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStaff.department || 'Unassigned'} {selectedStaff.employee_id ? `· ${selectedStaff.employee_id}` : ''}
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1 ${selectedStaff.overallKpi >= 80
                    ? 'bg-emerald-100'
                    : selectedStaff.overallKpi >= 60
                      ? 'bg-amber-100'
                      : 'bg-gray-100'
                  }`}>
                  <p className={`text-xs font-medium ${selectedStaff.overallKpi >= 80
                      ? 'text-emerald-700'
                      : selectedStaff.overallKpi >= 60
                        ? 'text-amber-700'
                        : 'text-gray-700'
                    }`}>
                    {selectedStaff.overallKpi > 0
                      ? `Overall KPI: ${Math.round(selectedStaff.overallKpi)} · ${selectedStaff.aura?.grade || 'N/A'}`
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
                    className={`-mb-[1px] border-b-2 px-3 py-2 text-xs font-medium transition-colors ${selectedTab === tab
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
                        Updated {selectedStaff.lastUpdated}
                      </span>
                    </div>

                    {/* Metric Selection Tabs */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {[
                        'Overall',
                        'Technical',
                        'Behavioral',
                        'Culture Fit',
                        'Collaboration',
                      ].map((metric) => (
                        <button
                          key={metric}
                          onClick={() => setSelectedMetric(metric)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${selectedMetric === metric
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
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${selectedTimeRange === range
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>

                    {/* Chart Placeholder */}
                    <div className="flex h-[200px] w-full items-center justify-center rounded-lg border border-border/40 bg-muted/20">
                      <p className="text-xs text-muted-foreground">
                        Performance chart coming soon
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
                        <span className="text-muted-foreground">Technical</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-muted-foreground">Behavioral</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span className="text-muted-foreground">Collaboration</span>
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
                  {selectedStaff.overallKpi > 0 ? (
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
                            style={{ width: `${selectedStaff.kpis.attendance}%` }}
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
                            style={{ width: `${selectedStaff.kpis.compliance}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">
                            Collaboration Score
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium text-gray-800">
                              {selectedStaff.kpis.feedback.toFixed(1)}
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
                  ) : (
                    <div className="rounded-lg border border-border/40 p-8 text-center">
                      <p className="text-sm text-muted-foreground">No KPI data available yet for this employee.</p>
                    </div>
                  )}
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
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${selectedStaff.attendanceStatus === 'On Track'
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
                          Collaboration Rating
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-gray-800">
                            {selectedStaff.kpis.feedback.toFixed(1)}
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
                      <p>Detailed feedback and reviews will be displayed here.</p>
                    </div>
                  </div>
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
