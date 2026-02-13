'use server';

import { cookies } from 'next/headers';
import { getStaffProfiles, type StaffProfile } from '@/app/actions/staff';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export interface TeamLeadForRating {
  id: string;
  name: string;
  email: string;
  department: string;
  avatarUrl: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  employee_id?: string | null;
  employeeId?: string | null;
  role?: string | null;
  ratedThisWeek: boolean;
  teamSize: number;
  lastRatingAvg: number | null;
  lastRatingWeek: number | null;
}

export interface AuraAlert {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string | null;
  alertType: string;
  previousScore: number;
  currentScore: number;
  changePercentage: number;
  message: string;
  weeksTrending: number;
  createdAt: string;
  isRead: boolean;
}

export interface AlertSummary {
  total: number;
  scoreDrops: number;
  consistentDeclines: number;
  improvements: number;
}

export interface RecentTeamLeadRating {
  id: number;
  teamLeadId: string;
  teamLeadName: string;
  department: string | null;
  averageScore: number;
  weekNumber: number;
  year: number;
  createdAt: string;
}

export interface TeamLeadRatingHistoryItem {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  leadershipScore: number;
  teamManagementScore: number;
  communicationScore: number;
  resultsDeliveryScore: number;
  cultureChampionScore: number;
  averageScore: number | null;
  leadershipNotes: string | null;
  areasOfStrength: string | null;
  areasForImprovement: string | null;
}

export interface TeamLeadRatingHistoryResponse {
  teamLead: {
    id: string;
    name: string;
    department: string | null;
  };
  ratings: TeamLeadRatingHistoryItem[];
  quarter: string;
  year: number;
}

export interface RatingFormData {
  leadershipScore: number;
  teamManagementScore: number;
  communicationScore: number;
  resultsDeliveryScore: number;
  cultureChampionScore: number;
  leadershipNotes: string;
  areasOfStrength: string;
  areasForImprovement: string;
}

export async function getTeamLeadsForRating(): Promise<{
  teamLeads: TeamLeadForRating[];
  currentWeek: number;
  currentYear: number;
  totalTeamLeads: number;
}> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for team lead ratings');
    return {
      teamLeads: [],
      currentWeek: 0,
      currentYear: new Date().getFullYear(),
      totalTeamLeads: 0,
    };
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/ratings/team-leads`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching team leads for rating:', response.status);
      return {
        teamLeads: [],
        currentWeek: 0,
        currentYear: new Date().getFullYear(),
        totalTeamLeads: 0,
      };
    }

    const data = (await response.json()) as {
      teamLeads?: TeamLeadForRating[];
      currentWeek?: number;
      currentYear?: number;
      totalTeamLeads?: number;
    };

    const rawTeamLeads = Array.isArray(data.teamLeads) ? data.teamLeads : [];

    let staffProfiles: StaffProfile[] = [];
    try {
      staffProfiles = await getStaffProfiles();
    } catch (error) {
      console.warn('Failed to load staff profiles for avatars:', error);
    }

    const staffById = new Map<string, StaffProfile>();
    const staffByEmail = new Map<string, StaffProfile>();
    const staffByEmployeeId = new Map<string, StaffProfile>();

    staffProfiles.forEach((profile) => {
      if (profile.id) staffById.set(profile.id, profile);
      if (profile.email) staffByEmail.set(profile.email.toLowerCase(), profile);
      if (profile.employee_id)
        staffByEmployeeId.set(profile.employee_id, profile);
    });

    const teamLeads = rawTeamLeads.map((lead) => {
      const profile =
        staffById.get(lead.id) ||
        (lead.email ? staffByEmail.get(lead.email.toLowerCase()) : undefined) ||
        (lead.employee_id
          ? staffByEmployeeId.get(lead.employee_id)
          : undefined) ||
        (lead.employeeId ? staffByEmployeeId.get(lead.employeeId) : undefined);

      const avatarUrl =
        profile?.avatar_url ?? lead.avatar_url ?? lead.avatarUrl ?? null;
      const employeeId =
        lead.employee_id ?? lead.employeeId ?? profile?.employee_id ?? null;
      const gender = lead.gender ?? profile?.gender ?? null;
      const role = lead.role ?? profile?.role ?? null;

      return {
        ...lead,
        avatar_url: avatarUrl,
        avatarUrl,
        employee_id: employeeId,
        employeeId,
        gender,
        role,
      };
    });

    return {
      teamLeads,
      currentWeek: data.currentWeek ?? 0,
      currentYear: data.currentYear ?? new Date().getFullYear(),
      totalTeamLeads: data.totalTeamLeads ?? teamLeads.length,
    };
  } catch (error) {
    console.error('Error fetching team leads for rating:', error);
    return {
      teamLeads: [],
      currentWeek: 0,
      currentYear: new Date().getFullYear(),
      totalTeamLeads: 0,
    };
  }
}

export async function getAuraAlerts(): Promise<{
  alerts: AuraAlert[];
  summary: AlertSummary | null;
}> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for aura alerts');
    return { alerts: [], summary: null };
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/ratings/alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching aura alerts:', response.status);
      return { alerts: [], summary: null };
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching aura alerts:', error);
    return { alerts: [], summary: null };
  }
}

export async function getRecentTeamLeadRatings(): Promise<
  RecentTeamLeadRating[]
> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for recent team lead ratings');
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/ratings/recent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        'Error fetching recent team lead ratings:',
        response.status
      );
      return [];
    }

    const data = await response.json();
    return Array.isArray(data?.ratings) ? data.ratings : [];
  } catch (error) {
    console.error('Error fetching recent team lead ratings:', error);
    return [];
  }
}

export async function getTeamLeadRatingHistory(
  teamLeadId: string
): Promise<TeamLeadRatingHistoryResponse | null> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for team lead rating history');
    return null;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/ratings/team-leads/${teamLeadId}/history`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(
        'Error fetching team lead rating history:',
        response.status
      );
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching team lead rating history:', error);
    return null;
  }
}

export async function submitTeamLeadRating(
  teamLeadId: string,
  data: RatingFormData
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/ratings/team-leads/${teamLeadId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || error.message || 'Failed to submit rating',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting team lead rating:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function acknowledgeAuraAlert(
  alertId: number
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/ratings/alerts/${alertId}/acknowledge`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || error.message || 'Failed to acknowledge alert',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return { success: false, error: 'Network error' };
  }
}
