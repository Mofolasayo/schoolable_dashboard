'use server';

import { cookies } from 'next/headers';
import {
  getCompliancePolicies,
  getComplianceSubmissions,
  type CompliancePolicy,
  type ComplianceSubmission,
} from '@/app/actions/compliance';
import {
  getCertificates,
  type TrainingRecord,
} from '@/app/actions/hr-management';
import {
  getWeeklyTeamReportDocuments,
  type WeeklyTeamReportDocument,
} from '@/app/actions/documents';
import {
  getRecentTeamLeadRatings,
  type RecentTeamLeadRating,
} from '@/app/actions/team-lead-ratings';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  subtitle: string;
  occurredAt: string | null;
}

export interface RecentActivityResponse {
  reports: RecentActivityItem[];
  documents: RecentActivityItem[];
  ratings: RecentActivityItem[];
}

export async function getAuditLogs(
  page: number = 0,
  size: number = 20,
  entityType?: string
): Promise<AuditLogsResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-auth-token')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  let url = `${API_URL}/api/audit/logs?page=${page}&size=${size}`;
  if (entityType && entityType !== 'All') {
    url += `&entityType=${entityType}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value);
  const time = parsed.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortRecent(items: RecentActivityItem[]) {
  return items.sort(
    (a, b) => toTimestamp(b.occurredAt) - toTimestamp(a.occurredAt)
  );
}

function formatDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0] ?? '',
    endDate: end.toISOString().split('T')[0] ?? '',
  };
}

export async function getRecentActivity(): Promise<RecentActivityResponse> {
  const { startDate, endDate } = formatDateRange(30);

  const [weeklyReports, certificates, recentRatings, policies] =
    await Promise.all([
      getWeeklyTeamReportDocuments(startDate, endDate),
      getCertificates(),
      getRecentTeamLeadRatings(),
      getCompliancePolicies(),
    ]);

  const reportItems = (weeklyReports as WeeklyTeamReportDocument[]).map(
    (report) => ({
      id: report.id,
      title: report.teamLeadName
        ? `${report.teamLeadName} submitted a weekly report`
        : 'Weekly report submitted',
      subtitle: report.department ? `${report.department} Team` : 'Team report',
      occurredAt: report.weekStartDate || report.weekEndDate || null,
    })
  );

  const submissionGroups = await Promise.all(
    (policies as CompliancePolicy[]).map(async (policy) => ({
      policy,
      submissions: await getComplianceSubmissions(policy.id),
    }))
  );

  const submissionItems = submissionGroups.flatMap(({ policy, submissions }) =>
    (submissions as ComplianceSubmission[])
      .filter((submission) => Boolean(submission.fileUrl))
      .map((submission) => ({
        id: `submission-${submission.id}`,
        title: submission.fileName || `${policy.title} submission`,
        subtitle:
          submission.userName ||
          submission.userEmail ||
          policy.category ||
          'Compliance submission',
        occurredAt: submission.submittedAt || null,
      }))
  );

  const policyItems = (policies as CompliancePolicy[])
    .filter((policy) => Boolean(policy.fileUrl))
    .map((policy) => ({
      id: `policy-${policy.id}`,
      title: policy.fileName || policy.title,
      subtitle: policy.category || 'Compliance policy',
      occurredAt: policy.lastReview || policy.nextReview || null,
    }));

  const certificateItems = (certificates as TrainingRecord[])
    .filter((certificate) => Boolean(certificate.fileUrl))
    .map((certificate) => ({
      id: `certificate-${certificate.id}`,
      title: certificate.certificateName,
      subtitle: certificate.employeeName || 'Training certificate',
      occurredAt: certificate.completedAt || certificate.reviewedAt || null,
    }));

  const ratingItems = (recentRatings as RecentTeamLeadRating[]).map(
    (rating) => ({
      id: `rating-${rating.id}`,
      title: `${rating.teamLeadName} rated ${rating.averageScore.toFixed(1)}/5`,
      subtitle: rating.department
        ? `${rating.department} Team`
        : `Week ${rating.weekNumber}`,
      occurredAt: rating.createdAt,
    })
  );

  return {
    reports: sortRecent(reportItems).slice(0, 5),
    documents: sortRecent([
      ...submissionItems,
      ...policyItems,
      ...certificateItems,
    ]).slice(0, 5),
    ratings: sortRecent(ratingItems).slice(0, 5),
  };
}
