'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

type BasicActionResponse = {
  success?: boolean;
  error?: string;
  message?: string;
} & Record<string, unknown>;

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
  teamScore?: number | null;
  employeeId?: string;
  gender?: string;
  requestStatus?: string | null;
  requestedAt?: string | null;
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
  isDueForConfirmation?: boolean;
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
  placedOn?: string;
  overdueDays?: number;
  goals: {
    id: string;
    description: string;
    status: string;
    progress: number;
  }[];
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

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName: string | null;
  department: string | null;
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  createdAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
}

// =====================================================
// ORGANIZATIONAL STRUCTURE
// =====================================================

export async function getOrganizationalStructure(): Promise<GradeLevel[]> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token available');
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/api/hr/structure`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching structure:', response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching structure:', error);
    return [];
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
        Authorization: `Bearer ${token}`,
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
        Authorization: `Bearer ${token}`,
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
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const auraData: Record<
      string,
      {
        aura_score?: number;
        technical_score?: number;
        behavioral_score?: number;
        culture_score?: number;
        growth_score?: number;
      }
    > = {};
    if (auraRes.ok) {
      const auraList = await auraRes.json();
      // Index by employee ID for quick lookup
      if (Array.isArray(auraList)) {
        auraList.forEach(
          (a: {
            id?: string;
            employeeId?: string;
            aura_score?: number;
            technical_score?: number;
            behavioral_score?: number;
            culture_score?: number;
            growth_score?: number;
          }) => {
            const id = a.id || a.employeeId;
            if (id) auraData[id] = a;
          }
        );
      }
    }

    // Merge profiles with AURA data
    return profiles
      .map(
        (p: {
          id: string;
          full_name?: string;
          email?: string;
          role?: string;
          job_title?: string;
          department?: string;
          employee_id?: string;
          status?: string;
          gender?: string;
          avatar_url?: string;
        }) => {
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
        }
      )
      .filter((e: EmployeeWithAura) => {
        // Exclude super admin from employees list
        const role = e.role?.toLowerCase();
        return (
          role !== 'admin' && role !== 'super_admin' && role !== 'superadmin'
        );
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

  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/api/hr/team-leads`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Error fetching team leads:', error);
    return [];
  }
}

export async function appointTeamLead(
  employeeId: string,
  teamName: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(`${API_URL}/api/hr/team-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ employeeId, teamName }),
    });

    const raw = await response.text();
    let data: BasicActionResponse = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }
    if (!response.ok) {
      console.error('Team lead appointment failed:', response.status, data);
      return {
        success: false,
        error:
          data.error || data.message || `Request failed (${response.status})`,
      };
    }
    if (typeof data?.success === 'boolean') {
      return data;
    }
    return { success: true };
  } catch (error) {
    console.error('Error appointing team lead:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function removeTeamLead(
  employeeId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `${API_URL}/api/hr/team-leads/${employeeId}/remove`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reason ? { reason } : {}),
      }
    );

    const raw = await response.text();
    let data: BasicActionResponse = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }
    if (!response.ok) {
      console.error('Team lead removal failed:', response.status, data);
      return {
        success: false,
        error:
          data.error || data.message || `Request failed (${response.status})`,
      };
    }
    if (typeof data?.success === 'boolean') {
      return data;
    }
    return { success: true };
  } catch (error) {
    console.error('Error removing team lead:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getPendingTeamLeadRequests(): Promise<TeamLead[]> {
  const token = await getAuthToken();

  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/api/hr/team-leads/requests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Error fetching pending team leads:', error);
    return [];
  }
}

export async function approveTeamLeadRequest(
  employeeId: string,
  teamName?: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `${API_URL}/api/hr/team-leads/requests/${employeeId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(teamName ? { teamName } : {}),
      }
    );

    return response.json();
  } catch (error) {
    console.error('Error approving team lead request:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function rejectTeamLeadRequest(
  employeeId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `${API_URL}/api/hr/team-leads/requests/${employeeId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reason ? { reason } : {}),
      }
    );

    return response.json();
  } catch (error) {
    console.error('Error rejecting team lead request:', error);
    return { success: false, error: 'Network error' };
  }
}

// =====================================================
// TEAMS
// =====================================================

export interface TeamSummary {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  memberCount: number;
  managed: boolean;
  createdAt?: string | null;
}

export async function getTeams(): Promise<TeamSummary[]> {
  const token = await getAuthToken();

  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/api/hr/teams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

export async function createTeam(
  name: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(`${API_URL}/api/hr/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    const raw = await response.text();
    let data: BasicActionResponse = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }
    if (!response.ok) {
      console.error('Create team failed:', response.status, data);
      return {
        success: false,
        error:
          data.error || data.message || `Request failed (${response.status})`,
      };
    }
    if (typeof data?.success === 'boolean') {
      return data;
    }
    return { success: true };
  } catch (error) {
    console.error('Error creating team:', error);
    return { success: false, error: 'Network error' };
  }
}

// =====================================================
// PROBATION
// =====================================================

export async function getProbations(): Promise<ProbationRecord[]> {
  const token = await getAuthToken();

  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/api/hr/probation`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Error fetching probations:', error);
    return [];
  }
}

export async function getProbationStats(): Promise<{
  onProbation: number;
  dueForConfirmation: number;
  atRisk: number;
  overdue: number;
}> {
  const token = await getAuthToken();

  if (!token)
    return { onProbation: 3, dueForConfirmation: 1, atRisk: 1, overdue: 0 };

  try {
    const response = await fetch(`${API_URL}/api/hr/probation/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok)
      return { onProbation: 0, dueForConfirmation: 0, atRisk: 0, overdue: 0 };
    return response.json();
  } catch (error) {
    console.error('Error fetching probation stats:', error);
    return { onProbation: 0, dueForConfirmation: 0, atRisk: 0, overdue: 0 };
  }
}

export async function confirmProbation(
  probationId: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `${API_URL}/api/hr/probation/${probationId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

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

  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/api/hr/pip`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Error fetching PIPs:', error);
    return [];
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
        Authorization: `Bearer ${token}`,
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

  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/api/hr/promotions/eligible`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }
}

export interface PromotionThresholds {
  vertical: {
    cgpaThreshold: number;
    quarterlyMin: number;
    description: string;
  };
  horizontal: { cgpaThreshold: number; description: string };
  fastTrack: {
    cgpaThreshold: number;
    consecutiveQuarters: number;
    description: string;
  };
}

export async function getPromotionThresholds(): Promise<PromotionThresholds | null> {
  const token = await getAuthToken();

  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/hr/promotions/thresholds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching promotion thresholds:', error);
    return null;
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
        Authorization: `Bearer ${token}`,
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

export async function getCertificateStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  const token = await getAuthToken();

  if (!token) return { total: 0, pending: 0, approved: 0, rejected: 0 };

  try {
    const response = await fetch(`${API_URL}/api/hr/certificates/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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

export async function reviewCertificate(
  id: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `${API_URL}/api/hr/certificates/${id}/review`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error('Error reviewing certificate:', error);
    return { success: false, error: 'Network error' };
  }
}

// =====================================================
// TIME OFF / LEAVE REQUESTS
// =====================================================

export async function getTimeOffRequests(
  status?: 'pending' | 'approved' | 'rejected',
  department?: string,
  startDate?: string,
  endDate?: string
): Promise<TimeOffRequest[]> {
  const token = await getAuthToken();

  if (!token) return [];

  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (department) params.set('department', department);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const url = `${API_URL}/attendance/time-off/requests/all${params.toString() ? `?${params.toString()}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Error fetching time off requests:', error);
    return [];
  }
}

export async function reviewTimeOffRequest(
  id: string,
  status: 'approved' | 'rejected',
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `${API_URL}/attendance/time-off/requests/${id}/decision`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reviewNotes }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return { success: false, error: errorBody.error || 'Request failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error reviewing time off request:', error);
    return { success: false, error: 'Network error' };
  }
}
