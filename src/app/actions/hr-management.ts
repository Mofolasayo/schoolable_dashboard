'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('admin-auth-token')?.value || null;
}

// =====================================================
// TYPES
// =====================================================

export interface Employee {
    id: string;
    name: string;
    email: string;
    role: string | null;
    department: string | null;
    jobLevel: number | null;
    grade: number | null;
    isTeamLead: boolean;
    status: string | null;
    avatar: string;
    employeeId?: string;
    gender?: string;
}

export interface GradeLevel {
    grade: number;
    title: string;
    roles: string;
    count: number;
    employees: Employee[];
}

export interface JobLevel {
    id: string;
    levelNumber: number;
    title: string;
    grade: number;
    gradeDescription: string;
    description: string;
    minYearsExperience: number;
    maxYearsExperience: number | null;
    isTeamLeadEligible: boolean;
}

export interface TeamLead {
    id: string;
    name: string;
    email: string;
    role: string | null;
    department: string | null;
    status: string;
    appointedAt: string | null;
    confirmedAt: string | null;
    teamName: string | null;
    teamSize: number;
    reviewCycles: number;
    perks: string | null;
    monthsAsLead: number;
    employeeId?: string;
    gender?: string;
}

export interface ProbationRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeRole: string | null;
    employeeEmail: string | null;
    startDate: string;
    endDate: string;
    appraisalDate: string | null;
    score: number | null;
    status: string;
    extensionCount: number;
    recommendation: string | null;
    policyRecommendation: string | null;
    performanceBand: string | null;
    daysRemaining: number;
    isOverdue: boolean;
    isInGracePeriod: boolean;
}

export interface PipRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeRole: string | null;
    startDate: string;
    endDate: string;
    status: string;
    triggerReason: string;
    triggerScore: number | null;
    daysRemaining: number;
    weeksRemaining: number;
    progressPercentage: number;
    isOverdue: boolean;
    goals: { id: string; description: string; status: string; progress: number }[];
}

export interface PromotionCandidate {
    id: string;
    name: string;
    email: string;
    role: string | null;
    department: string | null;
    cgpa: number;
    promotionType: string;
    status: string;
    currentLevel: number;
    currentTitle: string;
    targetLevel: number;
    targetTitle: string;
}

export interface TrainingRecord {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeDepartment: string | null;
    certificateName: string;
    provider: string | null;
    completedAt: string | null;
    expiresAt: string | null;
    quarter: string | null;
    year: number | null;
    status: string;
    fileUrl: string | null;
    reviewedAt: string | null;
    reviewNotes: string | null;
}

// =====================================================
// ORGANIZATIONAL STRUCTURE
// =====================================================

export async function getOrganizationalStructure(): Promise<GradeLevel[]> {
    const token = await getAuthToken();

    if (!token) {
        console.warn('No auth token available');
        return getMockStructure();
    }

    try {
        const response = await fetch(`${API_URL}/api/hr/structure`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Error fetching structure:', response.status);
            return getMockStructure();
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching structure:', error);
        return getMockStructure();
    }
}

export async function getJobLevels(): Promise<JobLevel[]> {
    const token = await getAuthToken();

    if (!token) return [];

    try {
        const response = await fetch(`${API_URL}/api/hr/job-levels`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return [];
        return response.json();
    } catch (error) {
        console.error('Error fetching job levels:', error);
        return [];
    }
}

// =====================================================
// ALL EMPLOYEES WITH AURA SCORES
// =====================================================

export interface EmployeeWithAura {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
    job_title: string | null;
    department: string | null;
    employee_id: string | null;
    status: string | null;
    gender: string | null;
    avatar_url: string | null;
    aura_score: number;
    technical_score: number;
    behavioral_score: number;
    culture_score: number;
    growth_score: number;
    certificates_count: number;
}

export async function getAllEmployeesWithAura(): Promise<EmployeeWithAura[]> {
    const token = await getAuthToken();

    if (!token) {
        console.warn('No auth token available');
        return [];
    }

    try {
        // Fetch profiles
        const profilesRes = await fetch(`${API_URL}/profile/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!profilesRes.ok) {
            console.error('Error fetching profiles:', profilesRes.status);
            return [];
        }

        const profiles = await profilesRes.json();

        // Fetch AURA scores for all employees
        const auraRes = await fetch(`${API_URL}/api/performance/aura`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        const auraData: Record<string, { aura_score?: number; technical_score?: number; behavioral_score?: number; culture_score?: number; growth_score?: number }> = {};
        if (auraRes.ok) {
            const auraList = await auraRes.json();
            // Index by employee ID for quick lookup
            if (Array.isArray(auraList)) {
                auraList.forEach((a: { id?: string; employeeId?: string; aura_score?: number; technical_score?: number; behavioral_score?: number; culture_score?: number; growth_score?: number }) => {
                    const id = a.id || a.employeeId;
                    if (id) auraData[id] = a;
                });
            }
        }

        // Merge profiles with AURA data
        return profiles.map((p: { id: string; full_name?: string; email?: string; role?: string; job_title?: string; department?: string; employee_id?: string; status?: string; gender?: string; avatar_url?: string }) => {
            const aura = auraData[p.id] || {};
            return {
                id: p.id,
                full_name: p.full_name || null,
                email: p.email || null,
                role: p.role || null,
                job_title: p.job_title || null,
                department: p.department || null,
                employee_id: p.employee_id || null,
                status: p.status || null,
                gender: p.gender || null,
                avatar_url: p.avatar_url || null,
                aura_score: aura.aura_score || 0,
                technical_score: aura.technical_score || 0,
                behavioral_score: aura.behavioral_score || 0,
                culture_score: aura.culture_score || 0,
                growth_score: aura.growth_score || 0,
                certificates_count: 0, // Will need separate fetch if needed
            };
        }).filter((e: EmployeeWithAura) => {
            // Exclude super admin from employees list
            const role = e.role?.toLowerCase();
            return role !== 'admin' && role !== 'super_admin' && role !== 'superadmin';
        });
    } catch (error) {
        console.error('Error fetching employees with AURA:', error);
        return [];
    }
}

// =====================================================
// TEAM LEADS
// =====================================================

export async function getTeamLeads(): Promise<TeamLead[]> {
    const token = await getAuthToken();

    if (!token) return getMockTeamLeads();

    try {
        const response = await fetch(`${API_URL}/api/hr/team-leads`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return getMockTeamLeads();
        return response.json();
    } catch (error) {
        console.error('Error fetching team leads:', error);
        return getMockTeamLeads();
    }
}

export async function appointTeamLead(employeeId: string, teamName: string): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();

    if (!token) return { success: false, error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_URL}/api/hr/team-leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ employeeId, teamName }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error appointing team lead:', error);
        return { success: false, error: 'Network error' };
    }
}

// =====================================================
// PROBATION
// =====================================================

export async function getProbations(): Promise<ProbationRecord[]> {
    const token = await getAuthToken();

    if (!token) return getMockProbations();

    try {
        const response = await fetch(`${API_URL}/api/hr/probation`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return getMockProbations();
        return response.json();
    } catch (error) {
        console.error('Error fetching probations:', error);
        return getMockProbations();
    }
}

export async function getProbationStats(): Promise<{ onProbation: number; dueForConfirmation: number; atRisk: number; overdue: number }> {
    const token = await getAuthToken();

    if (!token) return { onProbation: 3, dueForConfirmation: 1, atRisk: 1, overdue: 0 };

    try {
        const response = await fetch(`${API_URL}/api/hr/probation/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return { onProbation: 0, dueForConfirmation: 0, atRisk: 0, overdue: 0 };
        return response.json();
    } catch (error) {
        console.error('Error fetching probation stats:', error);
        return { onProbation: 0, dueForConfirmation: 0, atRisk: 0, overdue: 0 };
    }
}

export async function confirmProbation(probationId: string): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();

    if (!token) return { success: false, error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_URL}/api/hr/probation/${probationId}/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error confirming probation:', error);
        return { success: false, error: 'Network error' };
    }
}

// =====================================================
// PIP
// =====================================================

export async function getPips(): Promise<PipRecord[]> {
    const token = await getAuthToken();

    if (!token) return getMockPips();

    try {
        const response = await fetch(`${API_URL}/api/hr/pip`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return getMockPips();
        return response.json();
    } catch (error) {
        console.error('Error fetching PIPs:', error);
        return getMockPips();
    }
}

export async function createPip(data: {
    employeeId: string;
    reason: string;
    triggerScore?: number;
    quarter?: string;
    year?: number;
    supervisorId?: string;
}): Promise<{ success: boolean; error?: string; pipId?: string }> {
    const token = await getAuthToken();

    if (!token) return { success: false, error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_URL}/api/hr/pip`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        return await response.json();
    } catch (error) {
        console.error('Error creating PIP:', error);
        return { success: false, error: 'Network error' };
    }
}

// =====================================================
// PROMOTIONS
// =====================================================

export async function getPromotionEligibility(): Promise<PromotionCandidate[]> {
    const token = await getAuthToken();

    if (!token) return getMockPromotions();

    try {
        const response = await fetch(`${API_URL}/api/hr/promotions/eligible`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return getMockPromotions();
        return response.json();
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return getMockPromotions();
    }
}

export async function getPromotionThresholds(): Promise<{
    vertical: { cgpaThreshold: number; quarterlyMin: number; description: string };
    horizontal: { cgpaThreshold: number; description: string };
    fastTrack: { cgpaThreshold: number; consecutiveQuarters: number; description: string };
}> {
    const token = await getAuthToken();

    const defaults = {
        vertical: { cgpaThreshold: 4.20, quarterlyMin: 3.70, description: 'Move to a higher level job with more authority' },
        horizontal: { cgpaThreshold: 3.50, description: 'Move to different role at same level with wider skills/scope' },
        fastTrack: { cgpaThreshold: 4.60, consecutiveQuarters: 2, description: 'Immediate promotion review for exceptional performance' },
    };

    if (!token) return defaults;

    try {
        const response = await fetch(`${API_URL}/api/hr/promotions/thresholds`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return defaults;
        return response.json();
    } catch (error) {
        console.error('Error fetching promotion thresholds:', error);
        return defaults;
    }
}

// =====================================================
// CERTIFICATES
// =====================================================

export async function getCertificates(): Promise<TrainingRecord[]> {
    const token = await getAuthToken();

    if (!token) return [];

    try {
        const response = await fetch(`${API_URL}/api/hr/certificates`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return [];
        return response.json();
    } catch (error) {
        console.error('Error fetching certificates:', error);
        return [];
    }
}

export async function getCertificateStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    const token = await getAuthToken();

    if (!token) return { total: 0, pending: 0, approved: 0, rejected: 0 };

    try {
        const response = await fetch(`${API_URL}/api/hr/certificates/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) return { total: 0, pending: 0, approved: 0, rejected: 0 };
        return response.json();
    } catch (error) {
        console.error('Error fetching certificate stats:', error);
        return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
}

export async function reviewCertificate(id: string, status: 'approved' | 'rejected', notes?: string): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();

    if (!token) return { success: false, error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_URL}/api/hr/certificates/${id}/review`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status, notes }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error reviewing certificate:', error);
        return { success: false, error: 'Network error' };
    }
}

// =====================================================
// MOCK DATA (fallback when API unavailable)
// =====================================================

function getMockStructure(): GradeLevel[] {
    return [
        { grade: 6, title: 'Directors', roles: 'General Manager', count: 1, employees: [] },
        { grade: 5, title: 'C-Suite Executives', roles: 'Deputy GM, Asst GM', count: 2, employees: [] },
        { grade: 4, title: 'Senior Executives, Senior Managers, Managers', roles: 'Principal Manager, Senior Manager, Manager, Asst Manager', count: 5, employees: [] },
        { grade: 3, title: 'Junior Executives, Asst. Team Leads, Team Leads', roles: 'Senior Associate, Associate, Senior Analyst, Analyst, Senior Officer', count: 15, employees: [] },
        { grade: 2, title: 'NYSC, Internship, Mgt Trainees', roles: 'Officer, Executive Trainee', count: 8, employees: [] },
        { grade: 1, title: 'Auxiliary & Contract Staff', roles: 'Contract Staff, SIWES, IT', count: 3, employees: [] },
    ];
}

function getMockTeamLeads(): TeamLead[] {
    return [
        { id: '1', name: 'Helen Mirren', email: 'helen@allpro.com', role: 'Engineering Lead', department: 'Engineering', status: 'confirmed', appointedAt: '2024-06-01', confirmedAt: '2024-09-01', teamName: 'Platform Team', teamSize: 12, reviewCycles: 3, perks: '["workspace", "data_allowance", "retreat"]', monthsAsLead: 8 },
        { id: '2', name: 'Ian Wright', email: 'ian@allpro.com', role: 'Sales Lead', department: 'Sales', status: 'confirmed', appointedAt: '2024-08-01', confirmedAt: null, teamName: 'Enterprise Sales', teamSize: 8, reviewCycles: 2, perks: '["workspace", "retreat"]', monthsAsLead: 5 },
    ];
}

function getMockProbations(): ProbationRecord[] {
    return [
        { id: '1', employeeId: 'e1', employeeName: 'Alice Johnson', employeeRole: 'Customer Support', employeeEmail: 'alice@allpro.com', startDate: '2025-10-01', endDate: '2025-12-31', appraisalDate: '2025-12-20', score: 85, status: 'pending', extensionCount: 0, recommendation: null, policyRecommendation: 'Confirmation recommended', performanceBand: 'B', daysRemaining: -3, isOverdue: false, isInGracePeriod: true },
        { id: '2', employeeId: 'e2', employeeName: 'Bob Smith', employeeRole: 'Sales Intern', employeeEmail: 'bob@allpro.com', startDate: '2025-11-01', endDate: '2026-02-01', appraisalDate: null, score: 45, status: 'pending', extensionCount: 0, recommendation: null, policyRecommendation: 'Contract termination', performanceBand: 'F', daysRemaining: 29, isOverdue: false, isInGracePeriod: false },
        { id: '3', employeeId: 'e3', employeeName: 'Charlie Brown', employeeRole: 'Junior Dev', employeeEmail: 'charlie@allpro.com', startDate: '2025-09-01', endDate: '2026-01-15', appraisalDate: '2025-11-30', score: 60, status: 'extension_1', extensionCount: 1, recommendation: 'extend', policyRecommendation: 'Extension of probation (1 month)', performanceBand: 'D', daysRemaining: 12, isOverdue: false, isInGracePeriod: false },
    ];
}

function getMockPips(): PipRecord[] {
    return [
        { id: '1', employeeId: 'e1', employeeName: 'George Black', employeeRole: 'Sales Executive', startDate: '2025-12-01', endDate: '2026-03-01', status: 'active', triggerReason: 'Performance below 50%', triggerScore: 45, daysRemaining: 57, weeksRemaining: 8, progressPercentage: 35, isOverdue: false, goals: [{ id: 'g1', description: 'Improve call conversion rate to 15%', status: 'in_progress', progress: 40 }, { id: 'g2', description: 'Complete sales training module', status: 'met', progress: 100 }] },
    ];
}

function getMockPromotions(): PromotionCandidate[] {
    return [
        { id: '1', name: 'David Lee', email: 'david@allpro.com', role: 'Junior Exec', department: 'Operations', cgpa: 4.7, promotionType: 'Fast-Track', status: 'Immediate Review', currentLevel: 4, currentTitle: 'Analyst', targetLevel: 5, targetTitle: 'Senior Analyst' },
        { id: '2', name: 'Eva Green', email: 'eva@allpro.com', role: 'Support Staff', department: 'Customer Success', cgpa: 3.8, promotionType: 'Horizontal', status: 'Eligible', currentLevel: 3, currentTitle: 'Senior Officer', targetLevel: 3, targetTitle: 'Senior Officer (Team Lead)' },
        { id: '3', name: 'Frank White', email: 'frank@allpro.com', role: 'Asst. Team Lead', department: 'Engineering', cgpa: 4.25, promotionType: 'Vertical', status: 'Eligible', currentLevel: 6, currentTitle: 'Associate', targetLevel: 7, targetTitle: 'Senior Associate' },
    ];
}
