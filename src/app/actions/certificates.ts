'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface TrainingRecord {
  id: number;
  employeeId?: string;
  name: string;
  type: string;
  quarter: string;
  year: number;
  status: 'pending' | 'approved' | 'rejected';
  certificateUrl: string;
  completionDate?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export async function getEmployeeCertificates(
  employeeId: string
): Promise<TrainingRecord[]> {
  if (!employeeId) {
    return [];
  }

  const token = await getAuthToken();
  if (!token) {
    console.warn('No auth token available for certificates fetch');
    return [];
  }

  try {
    const response = await fetch(
      `${API_URL}/api/performance/training-records/employee/${employeeId}`,
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
      console.error('Error fetching employee certificates:', response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as TrainingRecord[]) : [];
  } catch (error) {
    console.error('Error fetching employee certificates:', error);
    return [];
  }
}
