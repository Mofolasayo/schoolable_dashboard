'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export interface ReferenceOption {
  value: string;
  label: string;
}

export interface ReferenceCriterion {
  key: string;
  name: string;
  description: string;
}

export interface PerformanceCriterion {
  id: string;
  name: string;
  description: string;
  pillar: 'behavioral' | 'culture_fit' | 'growth' | 'leadership';
  forTeamLeadsOnly?: boolean;
}

export interface ReferenceData {
  featureFlags: {
    messagingEnabled: boolean;
  };
  taskStatuses: ReferenceOption[];
  taskStatusFilters: ReferenceOption[];
  taskPriorities: ReferenceOption[];
  taskPriorityFilters: ReferenceOption[];
  kpiProgressSources: ReferenceOption[];
  weeklyReportCriteria: ReferenceCriterion[];
  peerFeedbackCriteria: {
    peer: ReferenceCriterion[];
    leadership: ReferenceCriterion[];
  };
  compliancePolicyTypes: ReferenceOption[];
  complianceCategories: string[];
  reportTypes: ReferenceOption[];
  auditEntityTypes: string[];
  smartReminderTypes: ReferenceOption[];
  smartReminderChannels: string[];
  smartReminderTargets: ReferenceOption[];
  performanceCriteria: PerformanceCriterion[];
  daysOfWeek: string[];
  genders: string[];
  attendanceLateReasons: string[];
}

export async function getReferenceData(): Promise<ReferenceData> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/reference-data`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load reference data: ${response.statusText}`);
  }

  return response.json();
}
