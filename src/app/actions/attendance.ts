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
    status: 'present' | 'late' | 'absent' | 'excused';
    location: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    photo_url: string | null;
    face_match_score: number | null;
    verification_status: 'pending' | 'verified' | 'failed' | 'flagged' | null;
    note: string | null;
    user?: AttendanceUser;
}

export interface AttendanceMetrics {
    date: string;
    present: number;
    late: number;
    absent: number;
    excused: number;
    total_checked_in: number;
    total_staff: number;
    pending: number;
    attendance_rate: number;
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    try {
        const response = await fetch(`${API_URL}/attendance/all/today`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch attendance logs: ${response.statusText}`);
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
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch attendance metrics: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching attendance metrics:', error);
        throw error;
    }
}
