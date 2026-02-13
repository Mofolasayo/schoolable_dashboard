'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export type LateAnalyticsResponse = {
  summary?: {
    totalLateCheckIns: number;
    averageMinutesLate: number;
    onTimeRate: number;
    repeatOffenderCount: number;
    totalAttendanceRecords: number;
  };
  lateCheckIns?: unknown[];
  repeatOffenders?: unknown[];
  reasonBreakdown?: Record<string, number>;
  dailyBreakdown?: { date: string; late: number; onTime: number }[];
  departmentBreakdown?: Record<string, number>;
  dateRange?: { start: string; end: string };
};

export async function getLateAnalytics(
  startDate?: string,
  endDate?: string
): Promise<LateAnalyticsResponse> {
  const token = await getAuthToken();
  if (!token) {
    console.warn('No auth token for late analytics');
    return {};
  }

  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  try {
    const response = await fetch(
      `${API_URL}/api/admin/late-analytics?${params.toString()}`,
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
      console.error('Error fetching late analytics:', response.status, error);
      return {};
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching late analytics:', error);
    return {};
  }
}
