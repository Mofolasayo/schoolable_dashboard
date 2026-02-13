'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface IndividualKpi {
  id: string;
  employeeId: string;
  setById: string;
  department: string | null;
  name: string;
  description: string | null;
  targetValue: number;
  targetUnit: string;
  weight: number;
  quarter: string;
  year: number;
  achievementPercentage?: number | null;
  status?: string | null;
  createdAt?: string | null;
}

export interface EmployeeKpiResponse {
  employeeId: string;
  quarter: string;
  year: number;
  kpis: IndividualKpi[];
  totalWeight: number;
  averageAchievement: number;
}

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export async function getEmployeeKpis(
  employeeId: string,
  quarter?: string,
  year?: number
): Promise<EmployeeKpiResponse | null> {
  if (!employeeId) return null;
  const token = await getAuthToken();
  if (!token) {
    console.warn('No auth token available for employee KPIs');
    return null;
  }

  const params = new URLSearchParams();
  if (quarter) params.set('quarter', quarter);
  if (year) params.set('year', year.toString());

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await fetch(
      `${API_URL}/api/individual-kpis/employee/${employeeId}${query}`,
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
      console.error('Error fetching employee KPIs:', response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching employee KPIs:', error);
    return null;
  }
}
