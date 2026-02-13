'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export interface AttendanceUser {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
}

export interface AttendanceRecord {
  id: number;
  user_id: string;
  check_in: string | null;
  check_out: string | null;
  date: string;
  status: 'present' | 'late' | 'absent';
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  photo_url: string | null;
  face_match_score: number | null;
  verification_status: 'pending' | 'verified' | 'failed' | 'flagged' | null;
  photo?: {
    url: string | null;
    verification_status: 'pending' | 'verified' | 'failed' | 'flagged' | null;
    face_match_score: number | null;
    face_match_provider: string | null;
    liveness_score: number | null;
    liveness_type: string | null;
    liveness_passed: boolean | null;
    retention_until: string | null;
  };
  note: string | null;
  user?: AttendanceUser;
}

export interface AttendanceMetrics {
  date: string;
  present: number;
  late: number;
  absent: number;
  total_checked_in: number;
  total_staff: number;
  pending: number;
  attendance_rate: number;
}

export interface HolidayCalendarItem {
  id: string;
  holiday_date: string | null;
  name: string | null;
  department: string | null;
  region: string | null;
  is_paid: boolean | null;
}

export interface TimeOffCalendarItem {
  id: string;
  employeeId: string;
  employeeName: string | null;
  department: string | null;
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  approvedAt: string | null;
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/attendance/all/today`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch attendance logs: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    throw error;
  }
}

export async function getAttendanceMetrics(): Promise<AttendanceMetrics> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/attendance/metrics/today`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch attendance metrics: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance metrics:', error);
    throw error;
  }
}

export async function getAttendanceRange(
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  if (!startDate || !endDate) throw new Error('Invalid date range');

  try {
    const response = await fetch(
      `${API_URL}/attendance/range?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch attendance range: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching attendance range:', error);
    throw error;
  }
}

export async function getHolidayCalendar(
  startDate?: string,
  endDate?: string,
  department?: string
): Promise<HolidayCalendarItem[]> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (department) params.set('department', department);

  const url = `${API_URL}/attendance/holidays${params.toString() ? `?${params.toString()}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch holidays: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching holidays:', error);
    throw error;
  }
}

export async function createHoliday(payload: {
  holidayDate?: string;
  startDate?: string;
  endDate?: string;
  name: string;
  department?: string;
  region?: string;
  isPaid?: boolean;
}): Promise<{
  created: HolidayCalendarItem[];
  skipped: string[];
  totalCreated: number;
}> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const response = await fetch(`${API_URL}/attendance/holidays`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        holiday_date: payload.holidayDate,
        start_date: payload.startDate,
        end_date: payload.endDate,
        name: payload.name,
        department: payload.department,
        region: payload.region,
        is_paid: payload.isPaid,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || 'Failed to create holiday');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }
}

export async function getTimeOffRange(
  startDate: string,
  endDate: string,
  department?: string
): Promise<TimeOffCalendarItem[]> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const params = new URLSearchParams();
  params.set('startDate', startDate);
  params.set('endDate', endDate);
  if (department) params.set('department', department);

  try {
    const response = await fetch(
      `${API_URL}/attendance/time-off?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch time off: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching time off:', error);
    throw error;
  }
}
