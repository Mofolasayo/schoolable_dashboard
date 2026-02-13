'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

type TaskAttachment = {
  id: number;
  file_name?: string;
  file_url?: string;
};

type TaskItem = {
  id: number;
  title?: string;
  organization?: string | null;
  created_at?: string;
  assignee?: { full_name?: string | null };
  attachments?: TaskAttachment[];
};

export type TaskAttachmentDocument = {
  id: string;
  name: string;
  url: string;
  taskId: number;
  taskTitle: string | null;
  department: string | null;
  uploadedAt: string | null;
  uploadedBy: string | null;
};

export type DailyReportAttachmentDocument = {
  id: string;
  name: string;
  url: string;
  reportDate: string | null;
  employeeName: string | null;
  department: string | null;
  uploadedAt: string | null;
};

export type WeeklyTeamReportDocument = {
  id: string;
  teamLeadName: string | null;
  department: string | null;
  weekNumber: number | null;
  year: number | null;
  weekStartDate: string | null;
  weekEndDate: string | null;
  url: string;
};

async function fetchTasksPage(page: number, size: number, token: string) {
  const response = await fetch(`${API_URL}/tasks?page=${page}&size=${size}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error(
      'Error fetching tasks for documents:',
      response.status,
      error
    );
    return { items: [], total: 0 };
  }

  const data = await response.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  const total = typeof data?.total === 'number' ? data.total : items.length;
  return { items, total };
}

export async function getTaskAttachmentDocuments(): Promise<
  TaskAttachmentDocument[]
> {
  const token = await getAuthToken();
  if (!token) {
    console.warn('No auth token for task documents');
    return [];
  }

  const results: TaskAttachmentDocument[] = [];
  const size = 200;
  const maxPages = 50;
  let page = 0;
  let total = 0;

  while (page < maxPages) {
    const { items, total: totalItems } = await fetchTasksPage(
      page,
      size,
      token
    );
    if (page === 0) {
      total = totalItems;
    }

    for (const raw of items as TaskItem[]) {
      const attachments = Array.isArray(raw.attachments) ? raw.attachments : [];
      for (const attachment of attachments) {
        const url = attachment?.file_url || '';
        if (!url) continue;
        results.push({
          id: `task-${raw.id}-${attachment.id}`,
          name: attachment.file_name || raw.title || 'Task attachment',
          url,
          taskId: raw.id,
          taskTitle: raw.title || null,
          department: raw.organization || null,
          uploadedAt: raw.created_at || null,
          uploadedBy: null,
        });
      }
    }

    page += 1;
    if (!items.length) {
      break;
    }
    if (total > 0 && page * size >= total) {
      break;
    }
  }

  return results;
}

export async function getDailyReportAttachments(
  startDate?: string,
  endDate?: string
): Promise<DailyReportAttachmentDocument[]> {
  const token = await getAuthToken();
  if (!token) {
    console.warn('No auth token for daily report attachments');
    return [];
  }

  try {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const url = params.toString()
      ? `${API_URL}/api/daily-reports/attachments?${params.toString()}`
      : `${API_URL}/api/daily-reports/attachments`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(
        'Error fetching daily report attachments:',
        response.status,
        error
      );
      return [];
    }

    const data = await response.json();
    const attachments = Array.isArray(data?.attachments)
      ? data.attachments
      : [];
    return attachments
      .map((item: Record<string, unknown>) => ({
        id: `daily-report-${item.id}`,
        name: (item.attachmentName as string) || 'Daily report attachment',
        url: (item.attachmentUrl as string) || '',
        reportDate: (item.reportDate as string) || null,
        employeeName: (item.employeeName as string) || null,
        department: (item.department as string) || null,
        uploadedAt: (item.createdAt as string) || null,
      }))
      .filter((doc: DailyReportAttachmentDocument) => Boolean(doc.url));
  } catch (error) {
    console.error('Error fetching daily report attachments:', error);
    return [];
  }
}

export async function getWeeklyTeamReportDocuments(
  startDate?: string,
  endDate?: string
): Promise<WeeklyTeamReportDocument[]> {
  const token = await getAuthToken();
  if (!token) {
    console.warn('No auth token for weekly team reports');
    return [];
  }

  try {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const url = params.toString()
      ? `${API_URL}/api/performance/weekly/team-reports?${params.toString()}`
      : `${API_URL}/api/performance/weekly/team-reports`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(
        'Error fetching weekly team reports:',
        response.status,
        error
      );
      return [];
    }

    const data = await response.json();
    const documents = Array.isArray(data?.documents) ? data.documents : [];
    return documents
      .map((item: Record<string, unknown>) => ({
        id: `weekly-team-report-${item.id}`,
        teamLeadName: (item.teamLeadName as string) || null,
        department: (item.department as string) || null,
        weekNumber:
          typeof item.weekNumber === 'number' ? item.weekNumber : null,
        year: typeof item.year === 'number' ? item.year : null,
        weekStartDate: (item.weekStartDate as string) || null,
        weekEndDate: (item.weekEndDate as string) || null,
        url: (item.teamReportUrl as string) || '',
      }))
      .filter((doc: WeeklyTeamReportDocument) => Boolean(doc.url));
  } catch (error) {
    console.error('Error fetching weekly team reports:', error);
    return [];
  }
}
