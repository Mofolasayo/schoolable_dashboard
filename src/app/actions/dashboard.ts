'use server';

import { cookies } from 'next/headers';

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
}): string {
    if (profile.avatar_url) return profile.avatar_url;

    const gender = profile.gender?.toLowerCase();
    let style = 'bottts';
    if (gender === 'male') style = 'adventurer';
    else if (gender === 'female') style = 'adventurer-neutral';

    const seed = profile.employee_id || profile.email || profile.full_name || 'User';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
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
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const token = await getAuthToken();

    if (!token) {
        console.warn('No auth token for dashboard stats');
        return getDefaultStats();
    }

    try {
        // Fetch tasks
        const tasksResponse = await fetch(`${API_URL}/tasks`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        const taskStats = { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 };

        if (tasksResponse.ok) {
            const tasks = await tasksResponse.json() as Array<{ status: string; due_date: string }>;
            const now = new Date();

            taskStats.total = tasks.length;
            taskStats.completed = tasks.filter(t =>
                t.status?.toLowerCase() === 'completed'
            ).length;
            taskStats.pending = tasks.filter(t =>
                ['pending', 'to do'].includes(t.status?.toLowerCase() || '')
            ).length;
            taskStats.inProgress = tasks.filter(t =>
                t.status?.toLowerCase() === 'in progress'
            ).length;
            taskStats.overdue = tasks.filter(t => {
                if (!t.due_date) return false;
                return new Date(t.due_date) < now && t.status?.toLowerCase() !== 'completed';
            }).length;
        }

        // Fetch attendance metrics
        const attendanceResponse = await fetch(`${API_URL}/attendance/metrics`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        let attendanceStats = { present: 0, late: 0, absent: 0, total: 0 };

        if (attendanceResponse.ok) {
            const metrics = await attendanceResponse.json();
            attendanceStats = {
                present: metrics.present || 0,
                late: metrics.late || 0,
                absent: metrics.absent || 0,
                total: metrics.total_staff || 0,
            };
        }

        // Calculate scores
        const taskCompletionScore = taskStats.total > 0
            ? Math.round((taskStats.completed / taskStats.total) * 100)
            : 0;

        const attendanceScore = attendanceStats.total > 0
            ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
            : 0;

        // Build response
        return {
            taskCompletion: {
                score: taskCompletionScore,
                total: taskStats.total,
                completed: taskStats.completed,
                pending: taskStats.pending,
                inProgress: taskStats.inProgress,
                overdue: taskStats.overdue,
                trend: '+5%', // TODO: Calculate from historical data
            },
            attendance: {
                score: attendanceScore,
                present: attendanceStats.present,
                late: attendanceStats.late,
                absent: attendanceStats.absent,
                total: attendanceStats.total,
                trend: '+2%',
            },
            compliance: {
                score: 96, // TODO: Integrate with compliance module
                openIssues: 12,
                trend: '+1%',
            },
            feedback: {
                score: 4.6, // TODO: Integrate with feedback module
                responses: 284,
                trend: '+0.3',
            },
            overallKpi: {
                score: Math.round((taskCompletionScore + attendanceScore + 96 + 92) / 4),
                trend: '+3',
            },
            taskDistribution: [
                { name: 'Completed', value: taskStats.completed, color: '#575ff4' },
                { name: 'In Progress', value: taskStats.inProgress, color: '#a8acf8' },
                { name: 'Pending', value: taskStats.pending, color: '#94a3b8' },
                { name: 'Overdue', value: taskStats.overdue, color: '#f59e0b' },
            ],
            kpiTrend: generateKpiTrend(taskCompletionScore, attendanceScore),
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return getDefaultStats();
    }
}

function generateKpiTrend(taskScore: number, attendanceScore: number) {
    // Generate trend data for the last 7 days with slight variations
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => {
        const variation = (Math.random() - 0.5) * 10; // ±5% variation
        return {
            name: day,
            overall: Math.min(100, Math.max(0, Math.round(taskScore + variation))),
            completion: Math.min(100, Math.max(0, Math.round(taskScore + variation * 0.8))),
            attendance: Math.min(100, Math.max(0, Math.round(attendanceScore + variation * 0.5))),
            compliance: Math.min(100, Math.max(0, 96 + Math.round(variation * 0.3))),
            feedback: Math.min(100, Math.max(0, 85 + Math.round(variation * 0.4))),
        };
    });
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
    weeklyKpi: number | null;
    taskStatus: 'On Track' | 'At Risk' | 'Behind' | null;
    attendanceRate: number | null;
    tasksCompleted: number;
    tasksPending: number;
}

export async function getStaffWithPerformance(): Promise<StaffWithPerformance[]> {
    const token = await getAuthToken();

    if (!token) {
        return [];
    }

    try {
        // Fetch all profiles
        const profilesResponse = await fetch(`${API_URL}/profile/all`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!profilesResponse.ok) {
            return [];
        }

        const profiles = (await profilesResponse.json() as Array<{
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
        }>).filter(p => {
            const role = p.role?.toLowerCase() || '';
            const name = p.full_name?.toLowerCase() || '';
            const title = p.job_title?.toLowerCase() || '';
            // Filter out admin users
            return !role.includes('admin') &&
                !name.includes('admin') &&
                !title.includes('administrator') &&
                role !== 'super_admin';
        });

        // Fetch tasks for task counts
        const tasksResponse = await fetch(`${API_URL}/tasks`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        const tasks = tasksResponse.ok
            ? await tasksResponse.json() as Array<{ assignee_id?: string; status: string }>
            : [];

        // Map profiles with performance data
        return profiles.map(profile => {
            const userTasks = tasks.filter((t: { assignee?: { id?: string }; assignee_id?: string }) =>
                (t.assignee?.id === profile.id) || (t.assignee_id === profile.id)
            );
            const completed = userTasks.filter((t: { status: string }) => t.status?.toLowerCase() === 'completed').length;
            const pending = userTasks.filter((t: { status: string }) =>
                ['pending', 'to do', 'in progress'].includes(t.status?.toLowerCase() || '')
            ).length;

            // Determine task status
            let taskStatus: 'On Track' | 'At Risk' | 'Behind' | null = null;
            if (userTasks.length > 0) {
                const completionRate = completed / userTasks.length;
                if (completionRate >= 0.7) taskStatus = 'On Track';
                else if (completionRate >= 0.4) taskStatus = 'At Risk';
                else taskStatus = 'Behind';
            }

            return {
                id: profile.id,
                full_name: profile.full_name || 'Unknown',
                email: profile.email || '',
                department: profile.department,
                job_title: profile.job_title,
                status: profile.status,
                avatar_url: generateAvatarUrl(profile),
                weeklyKpi: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : null,
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
        const [profilesRes, tasksRes] = await Promise.all([
            fetch(`${API_URL}/profile/all`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch(`${API_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
            }),
        ]);

        const rawProfiles = profilesRes.ok ? await profilesRes.json() : [];
        const tasks = tasksRes.ok ? await tasksRes.json() : [];

        // Filter out admin users from profiles
        const profiles = rawProfiles.filter((p: { role?: string; full_name?: string; job_title?: string }) => {
            const role = p.role?.toLowerCase() || '';
            const name = p.full_name?.toLowerCase() || '';
            const title = p.job_title?.toLowerCase() || '';
            return !role.includes('admin') &&
                !name.includes('admin') &&
                !title.includes('administrator') &&
                role !== 'super_admin';
        });

        // Group by department
        const departments = new Map<string, {
            staff: typeof profiles;
            tasks: typeof tasks;
        }>();

        for (const profile of profiles) {
            const dept = profile.department || 'Unassigned';
            if (!departments.has(dept)) {
                departments.set(dept, { staff: [], tasks: [] });
            }
            departments.get(dept)!.staff.push(profile);
        }

        for (const task of tasks) {
            const assignee = profiles.find((p: { id: string }) =>
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
                t.status?.toLowerCase() === 'completed'
            ).length;
            const pending = data.tasks.filter((t: { status: string }) =>
                ['pending', 'to do', 'in progress'].includes(t.status?.toLowerCase() || '')
            ).length;

            reports.push({
                department: dept,
                totalStaff: data.staff.length,
                averageKpi: data.tasks.length > 0
                    ? Math.round((completed / data.tasks.length) * 100)
                    : 0,
                tasksCompleted: completed,
                tasksPending: pending,
                attendanceRate: 85 + Math.floor(Math.random() * 15), // TODO: Real data
                topPerformer: data.staff[0]?.full_name || null,
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
        const scoresWithData = employees.filter((e: { aura_score?: number }) => e.aura_score !== null && e.aura_score !== undefined);
        const averageAura = scoresWithData.length > 0
            ? scoresWithData.reduce((sum: number, e: { aura_score: number }) => sum + e.aura_score, 0) / scoresWithData.length
            : null;

        const highPerformers = employees.filter((e: { aura_score?: number }) => (e.aura_score || 0) >= 4.0).length;
        const needsAttention = employees.filter((e: { aura_score?: number }) => (e.aura_score || 0) < 3.0 && e.aura_score !== null).length;

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

        const departmentBreakdown = Array.from(deptMap.entries()).map(([department, data]) => ({
            department,
            count: data.count,
            averageScore: data.count > 0 ? data.totalScore / data.count : 0,
        })).sort((a, b) => b.count - a.count);

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
