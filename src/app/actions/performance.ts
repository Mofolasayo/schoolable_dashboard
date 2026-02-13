'use server';

import { cookies } from 'next/headers';
import type {
  AuraResponse,
  AuraTrendHistory,
  AuraTrendPoint,
  PillarScores,
} from '@/lib/api/backend';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

function extractErrorMessage(payload: unknown): string {
  if (!payload) return 'An error occurred';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    const direct = data.error ?? data.message ?? data.detail;
    if (typeof direct === 'string') return direct;
  }
  return 'An error occurred';
}

export type { AuraResponse, AuraTrendHistory, AuraTrendPoint, PillarScores };

export async function getAuraDashboard(
  employeeId: string
): Promise<AuraResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${API_URL}/api/performance/aura/dashboard?employeeId=${encodeURIComponent(employeeId)}`,
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
    throw new Error(extractErrorMessage(error));
  }

  return response.json();
}

export async function getEmployeeAuraTrend(
  employeeId: string,
  limit = 12
): Promise<AuraTrendHistory> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${API_URL}/api/performance/employee/${encodeURIComponent(employeeId)}/trend?limit=${limit}`,
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
    throw new Error(extractErrorMessage(error));
  }

  return response.json();
}
