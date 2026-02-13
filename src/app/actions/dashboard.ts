'use server';

import { cookies } from 'next/headers';
import { getSuperAdminAvatarUrl } from '@/lib/avatar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

// Helper to generate avatar URL matching mobile app logic (internal use only)
function generateAvatarUrl(profile: {
  gender?: string | null;
  employee_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}): string {
  if (profile.avatar_url) return profile.avatar_url;

  const role = profile.role?.toLowerCase() || '';
  if (role === 'admin' || role === 'super_admin' || role === 'superadmin') {
    return getSuperAdminAvatarUrl();
  }

  const gender = profile.gender?.toLowerCase();
  let style = 'bottts';
  if (gender === 'male') style = 'adventurer';
  else if (gender === 'female') style = 'adventurer-neutral';

  const seed =
    profile.employee_id || profile.email || profile.full_name || 'User';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

function formatDate(date: Date): string {
  const [label] = date.toISOString().split('T');
  return label ?? '';
}

function getDateRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function getWeekdayLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getTaskTimestamp(task: {
  updated_at?: string;
  updatedAt?: string;
  created_at?: string;
  createdAt?: string;
}): Date | null {
  const raw =
    task.updated_at || task.updatedAt || task.created_at || task.createdAt;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDaysBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(
    1,
    Math.floor((endUtc - startUtc) / (24 * 60 * 60 * 1000)) + 1
  );
}

function getIsoWeekInfo(date: Date): { week: number; year: number } {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { week, year: target.getUTCFullYear() };
}

export type DashboardTimeRange = 'today' | 'week' | 'month' | 'custom';

export interface DashboardRangeParams {
  timeRange?: DashboardTimeRange;
  startDate?: string;
  endDate?: string;
}

function resolveDashboardRange(params: DashboardRangeParams = {}): {
  rangeStart: Date;
  rangeEnd: Date;
  compareStart: Date;
  compareEnd: Date;
} {
  const now = new Date();
  let rangeEnd = new Date(now);
  let rangeStart = new Date(now);

  const timeRange = params.timeRange ?? 'week';
  if (timeRange === 'today') {
    rangeStart = new Date(now);
    rangeEnd = new Date(now);
  } else if (timeRange === 'week') {
    rangeStart = addDays(now, -6);
  } else if (timeRange === 'month') {
    rangeStart = addDays(now, -29);
  } else if (timeRange === 'custom') {
    if (params.startDate) {
      const parsedStart = new Date(params.startDate);
      if (!Number.isNaN(parsedStart.getTime())) {
        rangeStart = parsedStart;
      }
    }
    if (params.endDate) {
      const parsedEnd = new Date(params.endDate);
      if (!Number.isNaN(parsedEnd.getTime())) {
        rangeEnd = parsedEnd;
      }
    }
    if (rangeStart > rangeEnd) {
      const swap = rangeStart;
      rangeStart = rangeEnd;
      rangeEnd = swap;
    }
  }

  const rangeDays = getDaysBetween(rangeStart, rangeEnd);
  const compareEnd = addDays(rangeStart, -1);
  const compareStart = addDays(compareEnd, -(rangeDays - 1));

  return {
    rangeStart,
    rangeEnd,
    compareStart,
    compareEnd,
  };
}

// ==================== DASHBOARD STATS ====================

export interface DashboardStats {
  taskCompletion: {
    score: number;
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    trend: string;
  };
  attendance: {
    score: number;
    present: number;
    late: number;
    absent: number;
    total: number;
    trend: string;
  };
  compliance: {
    score: number;
    openIssues: number;
    trend: string;
  };
  feedback: {
    score: number;
    responses: number;
    trend: string;
  };
  overallKpi: {
    score: number;
    trend: string;
  };
  taskDistribution: Array<{ name: string; value: number; color: string }>;
  kpiTrend: Array<{
    name: string;
    overall: number;
    completion: number;
    attendance: number;
    compliance: number;
    feedback: number;
  }>;
  totalStaff?: number;
}

export async function getDashboardStats(
  params: DashboardRangeParams = {}
): Promise<DashboardStats> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for dashboard stats');
    return getDefaultStats();
  }

  try {
    const { rangeStart, rangeEnd, compareStart, compareEnd } =
      resolveDashboardRange(params);
    const rangeStartLabel = formatDate(rangeStart);
    const rangeEndLabel = formatDate(rangeEnd);
    const compareStartLabel = formatDate(compareStart);
    const compareEndLabel = formatDate(compareEnd);

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const attendanceMetricsPromise =
      params.timeRange === 'today'
        ? fetch(`${API_URL}/attendance/metrics/today`, {
            headers,
            cache: 'no-store',
          })
        : Promise.resolve(null);

    const [
      tasksResponse,
      attendanceRangeResponse,
      reportsRangeResponse,
      complianceResponse,
      profilesResponse,
      attendanceMetricsResponse,
    ] = await Promise.all([
      fetch(`${API_URL}/tasks?size=1000`, { headers, cache: 'no-store' }),
      fetch(
        `${API_URL}/attendance/range?startDate=${compareStartLabel}&endDate=${rangeEndLabel}`,
        { headers, cache: 'no-store' }
      ),
      fetch(
        `${API_URL}/api/daily-reports/stats/range?startDate=${compareStartLabel}&endDate=${rangeEndLabel}`,
        { headers, cache: 'no-store' }
      ),
      fetch(`${API_URL}/compliance/metrics`, { headers, cache: 'no-store' }),
      fetch(`${API_URL}/profile/all`, { headers, cache: 'no-store' }),
      attendanceMetricsPromise,
    ]);

    const profilesData = profilesResponse.ok
      ? await profilesResponse.json()
      : [];
    const profiles = Array.isArray(profilesData) ? profilesData : [];
    const staffProfiles = profiles.filter((p: { role?: string }) => {
      const role = (p.role || '').toLowerCase();
      return !role.includes('admin');
    });
    const totalStaff = staffProfiles.length;

    const tasksData = tasksResponse.ok ? await tasksResponse.json() : [];
    const tasks = (
      Array.isArray(tasksData) ? tasksData : tasksData?.items || []
    ) as Array<{
      status?: string;
      due_date?: string;
      updated_at?: string;
      created_at?: string;
    }>;

    const isCompletedStatus = (status?: string) => {
      const normalized = (status || '').toLowerCase();
      return normalized === 'done' || normalized === 'completed';
    };

    const isWithinRange = (
      timestamp: Date | null,
      startLabel: string,
      endLabel: string
    ) => {
      if (!timestamp) return false;
      const dateLabel = formatDate(timestamp);
      return dateLabel >= startLabel && dateLabel <= endLabel;
    };

    const tasksInRange = tasks.filter((t) =>
      isWithinRange(getTaskTimestamp(t), rangeStartLabel, rangeEndLabel)
    );
    const tasksInCompare = tasks.filter((t) =>
      isWithinRange(getTaskTimestamp(t), compareStartLabel, compareEndLabel)
    );

    const taskStats: {
      total: number;
      completed: number;
      pending: number;
      inProgress: number;
      overdue: number;
      trendChange?: number;
    } = {
      total: tasksInRange.length,
      completed: tasksInRange.filter((t) => isCompletedStatus(t.status)).length,
      pending: tasksInRange.filter((t) =>
        ['pending', 'to do', 'todo'].includes((t.status || '').toLowerCase())
      ).length,
      inProgress: tasksInRange.filter((t) =>
        ['in progress', 'in_progress', 'review'].includes(
          (t.status || '').toLowerCase()
        )
      ).length,
      overdue: tasksInRange.filter((t) => {
        if (!t.due_date) return false;
        const status = (t.status || '').toLowerCase();
        return (
          new Date(t.due_date) < rangeEnd &&
          !['done', 'completed', 'cancelled', 'canceled'].includes(status)
        );
      }).length,
    };

    const completedInRange = taskStats.completed;
    const completedInCompare = tasksInCompare.filter((t) =>
      isCompletedStatus(t.status)
    ).length;

    taskStats.trendChange =
      completedInCompare > 0
        ? Math.round(
            ((completedInRange - completedInCompare) / completedInCompare) * 100
          )
        : 0;

    const attendanceRecords = attendanceRangeResponse.ok
      ? await attendanceRangeResponse.json()
      : [];
    const attendanceByDate = new Map<
      string,
      { present: number; late: number; absent: number }
    >();
    for (const record of attendanceRecords as Array<{
      date?: string;
      status?: string;
    }>) {
      if (!record.date) continue;
      const status = (record.status || '').toLowerCase();
      const normalizedStatus = status === 'excused' ? 'late' : status;
      const current = attendanceByDate.get(record.date) || {
        present: 0,
        late: 0,
        absent: 0,
      };
      if (normalizedStatus === 'present') current.present += 1;
      else if (normalizedStatus === 'late') current.late += 1;
      else if (normalizedStatus === 'absent') current.absent += 1;
      attendanceByDate.set(record.date, current);
    }

    const rangeDays = getDateRange(rangeStart, rangeEnd);
    const compareDays = getDateRange(compareStart, compareEnd);

    const attendanceRateForDate = (date: string) => {
      const stats = attendanceByDate.get(date);
      const checkedIn = (stats?.present || 0) + (stats?.late || 0);
      return totalStaff > 0 ? Math.round((checkedIn / totalStaff) * 100) : 0;
    };

    const rangeRates = rangeDays.map(attendanceRateForDate);
    const compareRates = compareDays.map(attendanceRateForDate);
    const rangeAvg = average(rangeRates);
    const compareAvg = average(compareRates);
    const attendanceTrend =
      compareAvg > 0
        ? Math.round(((rangeAvg - compareAvg) / compareAvg) * 100)
        : 0;

    const attendanceMetrics =
      attendanceMetricsResponse && attendanceMetricsResponse.ok
        ? await attendanceMetricsResponse.json()
        : null;

    const rangeAttendanceStats = rangeDays.reduce(
      (acc, date) => {
        const day = attendanceByDate.get(date);
        if (day) {
          acc.present += day.present;
          acc.late += day.late;
          acc.absent += day.absent;
        }
        return acc;
      },
      { present: 0, late: 0, absent: 0 }
    );

    const attendanceStats = {
      present: attendanceMetrics?.present ?? rangeAttendanceStats.present,
      late: attendanceMetrics?.late ?? rangeAttendanceStats.late,
      absent: attendanceMetrics?.absent ?? rangeAttendanceStats.absent,
      total: attendanceMetrics?.total_staff || totalStaff || 0,
      trendChange: attendanceTrend,
    };

    const complianceMetrics = complianceResponse.ok
      ? await complianceResponse.json()
      : {};
    const complianceScore = complianceMetrics.overallComplianceRate || 0;
    const complianceOpenIssues =
      (complianceMetrics.atRiskPolicies || 0) +
      (complianceMetrics.nonCompliantPolicies || 0);

    const reportsRange = reportsRangeResponse.ok
      ? await reportsRangeResponse.json()
      : { days: [], totalStaff: totalStaff };
    const reportRateByDate = new Map<string, number>();
    const reportSubmittedByDate = new Map<string, number>();
    if (Array.isArray(reportsRange.days)) {
      for (const day of reportsRange.days) {
        if (day?.date) {
          reportRateByDate.set(day.date, day.submissionRate || 0);
          reportSubmittedByDate.set(day.date, day.submitted || 0);
        }
      }
    }

    const rangeReportRates = rangeDays.map(
      (date) => reportRateByDate.get(date) || 0
    );
    const compareReportRates = compareDays.map(
      (date) => reportRateByDate.get(date) || 0
    );
    const reportAvg = average(rangeReportRates);
    const reportPrevAvg = average(compareReportRates);
    const reportTrendChange =
      reportPrevAvg > 0
        ? Math.round(((reportAvg - reportPrevAvg) / reportPrevAvg) * 100)
        : 0;

    const reportSubmitted = rangeDays.reduce(
      (sum, date) => sum + (reportSubmittedByDate.get(date) || 0),
      0
    );
    const reportSubmissionScore = Math.round(reportAvg);

    const completedByDate = new Map<string, number>();
    for (const task of tasksInRange) {
      if (!isCompletedStatus(task.status)) continue;
      const timestamp = getTaskTimestamp(task);
      if (!timestamp) continue;
      const dateLabel = formatDate(timestamp);
      if (dateLabel < rangeStartLabel || dateLabel > rangeEndLabel) continue;
      completedByDate.set(dateLabel, (completedByDate.get(dateLabel) || 0) + 1);
    }

    const attendanceRateByDate = new Map<string, number>();
    for (const date of rangeDays) {
      const rate = attendanceRateForDate(date);
      attendanceRateByDate.set(date, rate);
    }

    const getTrendLabel = (date: string) => {
      if (rangeDays.length <= 7) return getWeekdayLabel(date);
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) return date;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(parsed);
    };

    const kpiTrend = rangeDays.map((date) => {
      const completedCount = completedByDate.get(date) || 0;
      const completion =
        taskStats.total > 0
          ? Math.round((completedCount / taskStats.total) * 100)
          : 0;
      const attendance = attendanceRateByDate.get(date) || 0;
      const feedback = reportRateByDate.get(date) || 0;
      const compliance = complianceScore || 0;
      const overall = Math.round(
        average([completion, attendance, compliance, feedback])
      );
      return {
        name: getTrendLabel(date),
        overall,
        completion,
        attendance,
        compliance,
        feedback,
      };
    });

    const taskCompletionScore =
      taskStats.total > 0
        ? Math.round((taskStats.completed / taskStats.total) * 100)
        : 0;

    const attendanceScore =
      rangeDays.length > 1
        ? Math.round(rangeAvg)
        : attendanceStats.total > 0
          ? Math.round(
              ((attendanceStats.present + attendanceStats.late) /
                attendanceStats.total) *
                100
            )
          : 0;

    const formatTrend = (value: number) => {
      if (value > 0) return `+${value}%`;
      if (value < 0) return `${value}%`;
      return '0%';
    };

    const overallTrend = Math.round(
      average([taskStats.trendChange || 0, attendanceTrend, reportTrendChange])
    );

    return {
      taskCompletion: {
        score: taskCompletionScore,
        total: taskStats.total,
        completed: taskStats.completed,
        pending: taskStats.pending,
        inProgress: taskStats.inProgress,
        overdue: taskStats.overdue,
        trend: formatTrend(taskStats.trendChange || 0),
      },
      attendance: {
        score: attendanceScore,
        present: attendanceStats.present,
        late: attendanceStats.late,
        absent: attendanceStats.absent,
        total: attendanceStats.total,
        trend: formatTrend(attendanceTrend),
      },
      compliance: {
        score: complianceScore,
        openIssues: complianceOpenIssues,
        trend: '0%',
      },
      feedback: {
        score: reportSubmissionScore,
        responses: reportSubmitted,
        trend: formatTrend(reportTrendChange),
      },
      overallKpi: {
        score: Math.round(
          average([
            taskCompletionScore,
            attendanceScore,
            complianceScore,
            reportSubmissionScore,
          ])
        ),
        trend: formatTrend(overallTrend),
      },
      taskDistribution: [
        { name: 'Completed', value: taskStats.completed, color: '#575ff4' },
        { name: 'In Progress', value: taskStats.inProgress, color: '#a8acf8' },
        { name: 'Pending', value: taskStats.pending, color: '#94a3b8' },
        { name: 'Overdue', value: taskStats.overdue, color: '#f59e0b' },
      ],
      kpiTrend,
      totalStaff: attendanceStats.total,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return getDefaultStats();
  }
}

function getDefaultStats(): DashboardStats {
  return {
    taskCompletion: {
      score: 0,
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      overdue: 0,
      trend: '0%',
    },
    attendance: {
      score: 0,
      present: 0,
      late: 0,
      absent: 0,
      total: 0,
      trend: '0%',
    },
    compliance: {
      score: 0,
      openIssues: 0,
      trend: '0%',
    },
    feedback: {
      score: 0,
      responses: 0,
      trend: '0',
    },
    overallKpi: {
      score: 0,
      trend: '0',
    },
    taskDistribution: [],
    kpiTrend: [],
  };
}

// ==================== STAFF WITH PERFORMANCE ====================

export interface StaffWithPerformance {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  job_title: string | null;
  status: string | null;
  avatar_url: string;
  auraScore: number | null;
  kpiScore: number | null;
  kpiImprovement: number | null;
  taskStatus: 'On Track' | 'At Risk' | 'Behind' | null;
  attendanceRate: number | null;
  tasksCompleted: number;
  tasksPending: number;
}

export async function getStaffWithPerformance(): Promise<
  StaffWithPerformance[]
> {
  const token = await getAuthToken();

  if (!token) {
    return [];
  }

  try {
    // Fetch all profiles
    const profilesResponse = await fetch(`${API_URL}/profile/all`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!profilesResponse.ok) {
      return [];
    }

    const profiles = (
      (await profilesResponse.json()) as Array<{
        id: string;
        full_name: string;
        email: string;
        department: string | null;
        job_title: string | null;
        role: string | null;
        status: string | null;
        avatar_url: string | null;
        gender: string | null;
        employee_id: string | null;
      }>
    ).filter((p) => {
      const role = p.role?.toLowerCase() || '';
      const name = p.full_name?.toLowerCase() || '';
      const title = p.job_title?.toLowerCase() || '';
      // Filter out admin users
      return (
        !role.includes('admin') &&
        !name.includes('admin') &&
        !title.includes('administrator') &&
        role !== 'super_admin'
      );
    });

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Fetch tasks for task counts
    const tasksResponse = await fetch(`${API_URL}/tasks`, {
      headers,
      cache: 'no-store',
    });

    const tasksPayload = tasksResponse.ok ? await tasksResponse.json() : [];
    const tasks = (
      Array.isArray(tasksPayload) ? tasksPayload : tasksPayload?.items || []
    ) as Array<{ assignee_id?: string; status: string }>;

    const auraResponse = await fetch(`${API_URL}/api/performance/aura`, {
      headers,
      cache: 'no-store',
    });
    const auraPayload = auraResponse.ok ? await auraResponse.json() : [];
    const auraItems = Array.isArray(auraPayload) ? auraPayload : [];
    const auraByEmployee = new Map<string, number>();
    auraItems.forEach(
      (item: {
        id?: string;
        employeeId?: string;
        aura_score?: number | null;
      }) => {
        const id = item.id || item.employeeId;
        if (id && item.aura_score != null) {
          auraByEmployee.set(id, item.aura_score);
        }
      }
    );

    const now = new Date();
    const currentWeek = getIsoWeekInfo(now);
    const previousWeek = getIsoWeekInfo(addDays(now, -7));

    const [currentWeeklyResponse, previousWeeklyResponse] = await Promise.all([
      fetch(
        `${API_URL}/api/performance/weekly?week=${currentWeek.week}&year=${currentWeek.year}`,
        {
          headers,
          cache: 'no-store',
        }
      ),
      fetch(
        `${API_URL}/api/performance/weekly?week=${previousWeek.week}&year=${previousWeek.year}`,
        {
          headers,
          cache: 'no-store',
        }
      ),
    ]);

    const currentWeeklyPayload = currentWeeklyResponse.ok
      ? await currentWeeklyResponse.json()
      : null;
    const previousWeeklyPayload = previousWeeklyResponse.ok
      ? await previousWeeklyResponse.json()
      : null;
    const currentReports = Array.isArray(currentWeeklyPayload?.reports)
      ? currentWeeklyPayload.reports
      : [];
    const previousReports = Array.isArray(previousWeeklyPayload?.reports)
      ? previousWeeklyPayload.reports
      : [];

    const currentWeeklyByEmployee = new Map<string, number>();
    currentReports.forEach(
      (report: { employeeId?: string; weeklyAura?: number | null }) => {
        if (report.employeeId && typeof report.weeklyAura === 'number') {
          currentWeeklyByEmployee.set(report.employeeId, report.weeklyAura);
        }
      }
    );

    const previousWeeklyByEmployee = new Map<string, number>();
    previousReports.forEach(
      (report: { employeeId?: string; weeklyAura?: number | null }) => {
        if (report.employeeId && typeof report.weeklyAura === 'number') {
          previousWeeklyByEmployee.set(report.employeeId, report.weeklyAura);
        }
      }
    );

    // Map profiles with performance data
    return profiles.map((profile) => {
      const userTasks = tasks.filter(
        (t: { assignee?: { id?: string }; assignee_id?: string }) =>
          t.assignee?.id === profile.id || t.assignee_id === profile.id
      );
      const completed = userTasks.filter((t: { status: string }) =>
        ['done', 'completed'].includes(t.status?.toLowerCase() || '')
      ).length;
      const pending = userTasks.filter((t: { status: string }) =>
        [
          'pending',
          'to do',
          'todo',
          'in progress',
          'in_progress',
          'review',
        ].includes(t.status?.toLowerCase() || '')
      ).length;

      // Determine task status
      let taskStatus: 'On Track' | 'At Risk' | 'Behind' | null = null;
      if (userTasks.length > 0) {
        const completionRate = completed / userTasks.length;
        if (completionRate >= 0.7) taskStatus = 'On Track';
        else if (completionRate >= 0.4) taskStatus = 'At Risk';
        else taskStatus = 'Behind';
      }

      const kpiScore = currentWeeklyByEmployee.get(profile.id) ?? null;
      const previousKpiScore = previousWeeklyByEmployee.get(profile.id);
      const kpiImprovement =
        kpiScore != null && previousKpiScore != null
          ? Math.round((kpiScore - previousKpiScore) * 10) / 10
          : null;

      return {
        id: profile.id,
        full_name: profile.full_name || 'Unknown',
        email: profile.email || '',
        department: profile.department,
        job_title: profile.job_title,
        status: profile.status,
        avatar_url: generateAvatarUrl(profile),
        auraScore: auraByEmployee.get(profile.id) ?? null,
        kpiScore,
        kpiImprovement,
        taskStatus,
        attendanceRate: null, // TODO: Calculate from attendance data
        tasksCompleted: completed,
        tasksPending: pending,
      };
    });
  } catch (error) {
    console.error('Error fetching staff with performance:', error);
    return [];
  }
}

// ==================== DEPARTMENT REPORTS ====================

export interface DepartmentReport {
  department: string;
  totalStaff: number;
  averageKpi: number;
  tasksCompleted: number;
  tasksPending: number;
  attendanceRate: number;
  topPerformer: string | null;
}

export async function getDepartmentReports(): Promise<DepartmentReport[]> {
  const token = await getAuthToken();

  if (!token) {
    return [];
  }

  try {
    const todayLabel = formatDate(new Date());
    const [profilesRes, tasksRes, attendanceRes] = await Promise.all([
      fetch(`${API_URL}/profile/all`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_URL}/tasks?size=1000`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(
        `${API_URL}/attendance/range?startDate=${todayLabel}&endDate=${todayLabel}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      ),
    ]);

    const rawProfiles = profilesRes.ok ? await profilesRes.json() : [];
    const tasksPayload = tasksRes.ok ? await tasksRes.json() : [];
    const tasks = Array.isArray(tasksPayload)
      ? tasksPayload
      : tasksPayload?.items || [];
    const attendanceRecords = attendanceRes.ok
      ? await attendanceRes.json()
      : [];

    // Filter out admin users from profiles
    const profiles = rawProfiles.filter(
      (p: { role?: string; full_name?: string; job_title?: string }) => {
        const role = p.role?.toLowerCase() || '';
        const name = p.full_name?.toLowerCase() || '';
        const title = p.job_title?.toLowerCase() || '';
        return (
          !role.includes('admin') &&
          !name.includes('admin') &&
          !title.includes('administrator') &&
          role !== 'super_admin'
        );
      }
    );

    const attendanceByDept = new Map<string, number>();
    for (const record of attendanceRecords as Array<{
      status?: string;
      user?: { department?: string | null };
    }>) {
      const status = (record.status || '').toLowerCase();
      if (status !== 'present' && status !== 'late') continue;
      const dept = record.user?.department || 'Unassigned';
      attendanceByDept.set(dept, (attendanceByDept.get(dept) || 0) + 1);
    }

    const completedByAssignee = new Map<string, number>();
    for (const task of tasks as Array<{
      status?: string;
      assignee?: { id?: string };
      assignee_id?: string;
    }>) {
      const status = (task.status || '').toLowerCase();
      if (status !== 'done' && status !== 'completed') continue;
      const assigneeId = task.assignee?.id || task.assignee_id;
      if (!assigneeId) continue;
      completedByAssignee.set(
        assigneeId,
        (completedByAssignee.get(assigneeId) || 0) + 1
      );
    }

    // Group by department
    const departments = new Map<
      string,
      {
        staff: typeof profiles;
        tasks: typeof tasks;
      }
    >();

    for (const profile of profiles) {
      const dept = profile.department || 'Unassigned';
      if (!departments.has(dept)) {
        departments.set(dept, { staff: [], tasks: [] });
      }
      departments.get(dept)!.staff.push(profile);
    }

    for (const task of tasks) {
      const assignee = profiles.find(
        (p: { id: string }) =>
          p.id === task.assignee?.id || p.id === task.assignee_id
      );
      if (assignee) {
        const dept = assignee.department || 'Unassigned';
        if (departments.has(dept)) {
          departments.get(dept)!.tasks.push(task);
        }
      }
    }

    // Build reports
    const reports: DepartmentReport[] = [];

    for (const [dept, data] of departments) {
      if (data.staff.length === 0) continue;

      const completed = data.tasks.filter((t: { status: string }) =>
        ['done', 'completed'].includes(t.status?.toLowerCase() || '')
      ).length;
      const pending = data.tasks.filter((t: { status: string }) =>
        [
          'pending',
          'to do',
          'todo',
          'in progress',
          'in_progress',
          'review',
        ].includes(t.status?.toLowerCase() || '')
      ).length;

      const checkedIn = attendanceByDept.get(dept) || 0;
      const attendanceRate =
        data.staff.length > 0
          ? Math.round((checkedIn / data.staff.length) * 100)
          : 0;

      let topPerformer: string | null = null;
      let topScore = -1;
      for (const staff of data.staff as Array<{
        id: string;
        full_name?: string | null;
      }>) {
        const score = completedByAssignee.get(staff.id) || 0;
        if (score > topScore) {
          topScore = score;
          topPerformer = staff.full_name || null;
        }
      }

      reports.push({
        department: dept,
        totalStaff: data.staff.length,
        averageKpi:
          data.tasks.length > 0
            ? Math.round((completed / data.tasks.length) * 100)
            : 0,
        tasksCompleted: completed,
        tasksPending: pending,
        attendanceRate,
        topPerformer,
      });
    }

    return reports.sort((a, b) => b.averageKpi - a.averageKpi);
  } catch (error) {
    console.error('Error fetching department reports:', error);
    return [];
  }
}

// ==================== ANALYTICS SUMMARY ====================

export interface AnalyticsSummary {
  averageAura: number | null;
  totalEmployees: number;
  highPerformers: number;
  needsAttention: number;
  departmentBreakdown: Array<{
    department: string;
    count: number;
    averageScore: number;
  }>;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const token = await getAuthToken();
  if (!token) {
    return getDefaultAnalytics();
  }

  try {
    // Fetch AURA scores for all employees
    const auraResponse = await fetch(`${API_URL}/api/performance/aura`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!auraResponse.ok) {
      return getDefaultAnalytics();
    }

    const auraData = await auraResponse.json();
    const employees = Array.isArray(auraData) ? auraData : [];

    // Calculate analytics
    const scoresWithData = employees.filter(
      (e: { aura_score?: number }) =>
        e.aura_score !== null && e.aura_score !== undefined
    );
    const averageAura =
      scoresWithData.length > 0
        ? scoresWithData.reduce(
            (sum: number, e: { aura_score: number }) => sum + e.aura_score,
            0
          ) / scoresWithData.length
        : null;

    const highPerformers = employees.filter(
      (e: { aura_score?: number }) => (e.aura_score || 0) >= 4.0
    ).length;
    const needsAttention = employees.filter(
      (e: { aura_score?: number }) =>
        (e.aura_score || 0) < 3.0 && e.aura_score !== null
    ).length;

    // Group by department
    const deptMap = new Map<string, { count: number; totalScore: number }>();
    for (const emp of employees) {
      const dept = emp.department || 'Unknown';
      const current = deptMap.get(dept) || { count: 0, totalScore: 0 };
      deptMap.set(dept, {
        count: current.count + 1,
        totalScore: current.totalScore + (emp.aura_score || 0),
      });
    }

    const departmentBreakdown = Array.from(deptMap.entries())
      .map(([department, data]) => ({
        department,
        count: data.count,
        averageScore: data.count > 0 ? data.totalScore / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      averageAura,
      totalEmployees: employees.length,
      highPerformers,
      needsAttention,
      departmentBreakdown,
    };
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return getDefaultAnalytics();
  }
}

function getDefaultAnalytics(): AnalyticsSummary {
  return {
    averageAura: null,
    totalEmployees: 0,
    highPerformers: 0,
    needsAttention: 0,
    departmentBreakdown: [],
  };
}
