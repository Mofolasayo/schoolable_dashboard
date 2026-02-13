'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export interface TeamKpi {
  id: string;
  teamLeadId: string;
  department: string;
  name: string;
  description: string;
  targetValue: number;
  targetUnit: string;
  weight: number;
  quarter: string;
  year: number;
  isActive: boolean;
  createdAt: string;
}

export interface AiInsightItem {
  id: string;
  department: string;
  weekNumber: number;
  quarter: string;
  year: number;
  kpiScore: number;
  summary: string;
  scoreBreakdown?: Record<string, unknown> | null;
  rawAiResponse?: Record<string, unknown> | null;
  insights: Record<string, unknown>;
  recommendations: Record<string, unknown>;
  riskAlerts: Record<string, unknown>;
  generatedAt: string;
  generationStatus?: string;
}

export interface TeamQuarterlyScore {
  id: string;
  teamLeadId?: string | null;
  teamName: string;
  department: string;
  quarter: string;
  year: number;
  kpiAchievementScore: number;
  individualAvgScore?: number;
  overallTeamScore: number;
  grade: string;
  aiSummary: string;
  scoreBreakdown?: Record<string, unknown> | null;
  createdAt?: string;
}

export interface TeamScoresResponse {
  quarter: string;
  year: number;
  teams: TeamQuarterlyScore[];
  totalTeams: number;
  averageScore: number;
}

export interface TeamKpisResponse {
  kpis: TeamKpi[];
  quarter: string;
  year: number;
}

export interface WeeklyInsightsResponse {
  insights: AiInsightItem[];
  weekNumber: number;
  year: number;
}

export interface PersonalAiInsights {
  overallAssessment?: string;
  performanceScore?: number;
  keyStrengths?: string[];
  improvementAreas?: string[];
  actionableRecommendations?: string[];
  skillsToFocus?: string[];
  motivationalMessage?: string;
  [key: string]: unknown;
}

export interface PersonalInsightsResponse {
  employeeId: string;
  employeeName?: string;
  department?: string | null;
  generatedAt?: string;
  performanceData?: Record<string, unknown>;
  aiInsights?: PersonalAiInsights;
  aiError?: string;
}

function getDefaultScores(quarter?: string, year?: number): TeamScoresResponse {
  return {
    quarter: quarter ?? '',
    year: year ?? new Date().getFullYear(),
    teams: [],
    totalTeams: 0,
    averageScore: 0,
  };
}

function getDefaultKpis(quarter?: string, year?: number): TeamKpisResponse {
  return {
    kpis: [],
    quarter: quarter ?? '',
    year: year ?? new Date().getFullYear(),
  };
}

export async function getAllTeamScores(
  quarter?: string,
  year?: number
): Promise<TeamScoresResponse> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for team scores');
    return getDefaultScores(quarter, year);
  }

  try {
    const params = new URLSearchParams();
    if (quarter) params.set('quarter', quarter);
    if (year) params.set('year', year.toString());

    const response = await fetch(
      `${API_URL}/api/kpi/score/all-teams?${params.toString()}`,
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
      console.error('Error fetching team scores:', response.status);
      return getDefaultScores(quarter, year);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching team scores:', error);
    return getDefaultScores(quarter, year);
  }
}

export async function getAllTeamKpis(
  quarter?: string,
  year?: number
): Promise<TeamKpisResponse> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for team KPIs');
    return getDefaultKpis(quarter, year);
  }

  try {
    const params = new URLSearchParams();
    if (quarter) params.set('quarter', quarter);
    if (year) params.set('year', year.toString());

    const response = await fetch(
      `${API_URL}/api/kpi/all-kpis?${params.toString()}`,
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
      console.error('Error fetching team KPIs:', response.status);
      return getDefaultKpis(quarter, year);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching team KPIs:', error);
    return getDefaultKpis(quarter, year);
  }
}

export async function getAllWeeklyInsights(
  weekNumber: number,
  year: number
): Promise<WeeklyInsightsResponse> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for AI insights');
    return {
      insights: [],
      weekNumber,
      year,
    };
  }

  try {
    const response = await fetch(
      `${API_URL}/api/kpi/insights/all?weekNumber=${weekNumber}&year=${year}`,
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
      console.error('Error fetching insights:', response.status);
      return { insights: [], weekNumber, year };
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching insights:', error);
    return { insights: [], weekNumber, year };
  }
}

export async function getEmployeeInsights(
  employeeId: string
): Promise<PersonalInsightsResponse | null> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for employee insights');
    return null;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/kpi/insights/employee/${employeeId}`,
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
      const error = await response.json().catch(() => ({}));
      console.error(
        'Error fetching employee insights:',
        response.status,
        error
      );
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching employee insights:', error);
    return null;
  }
}
