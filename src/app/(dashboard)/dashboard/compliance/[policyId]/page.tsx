'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCompliancePolicies,
  getComplianceSubmissions,
  reviewComplianceSubmission,
  CompliancePolicy,
  ComplianceSubmission,
} from '@/app/actions/compliance';

const dedupeById = <T extends { id?: string | null }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id) return true;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const formatLabel = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function CompliancePolicyDetailPage() {
  const { policyId } = useParams<{ policyId: string }>();
  const router = useRouter();
  const [policy, setPolicy] = useState<CompliancePolicy | null>(null);
  const [submissions, setSubmissions] = useState<ComplianceSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [policies, submissionsData] = await Promise.all([
        getCompliancePolicies(),
        getComplianceSubmissions(policyId),
      ]);
      const selected = policies.find((item) => item.id === policyId) || null;
      setPolicy(selected);
      setSubmissions(dedupeById(submissionsData));
    } catch (error) {
      console.error('Error loading compliance details:', error);
      toast.error('Failed to load compliance details');
    } finally {
      setIsLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const total = submissions.length;
    const approved = submissions.filter(
      (sub) => sub.status === 'approved'
    ).length;
    const submitted = submissions.filter(
      (sub) => sub.status === 'submitted'
    ).length;
    const rejected = submissions.filter(
      (sub) => sub.status === 'rejected'
    ).length;
    return { total, approved, submitted, rejected };
  }, [submissions]);

  const requirementLabel = useMemo(() => {
    if (!policy?.type) return '—';
    if (policy.type === 'policy') return 'Acknowledgement required';
    if (policy.type === 'upload') return 'Signed document required';
    if (policy.type === 'training') return 'Training completion required';
    return formatLabel(policy.type);
  }, [policy?.type]);

  const handleReview = async (
    submissionId: string,
    status: 'approved' | 'rejected'
  ) => {
    const notes =
      status === 'rejected' ? prompt('Enter rejection reason:') : undefined;
    if (status === 'rejected' && !notes) {
      return;
    }

    try {
      const result = await reviewComplianceSubmission(
        submissionId,
        status,
        notes || undefined
      );
      if (result.success) {
        toast.success(`Submission ${status}`);
        loadData();
      } else {
        toast.error(result.error || 'Failed to review submission');
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to review submission');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading compliance policy...
        </p>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/compliance')}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to compliance
        </button>
        <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Compliance policy not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.push('/dashboard/compliance')}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to compliance
        </button>
        <button
          onClick={loadData}
          className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
              {policy.status}
            </span>
            <h1 className="text-xl font-medium text-gray-800">
              {policy.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {policy.description}
            </p>
          </div>
          {policy.fileUrl && (
            <a
              href={policy.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
            >
              <FileText className="h-3.5 w-3.5" />
              {policy.fileName || 'Download attachment'}
            </a>
          )}
        </div>

        <div className="mt-6 grid gap-4 border-t border-border/40 pt-6 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Compliance type</p>
              <p className="font-medium text-gray-800">
                {formatLabel(policy.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Requirement</p>
              <p className="font-medium text-gray-800">{requirementLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-medium text-gray-800">
                {policy.department || 'All Departments'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Compliance rate</p>
              <p className="font-medium text-gray-800">
                {policy.complianceRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/40 bg-white p-4 text-xs shadow-sm">
          <p className="text-muted-foreground">Total submissions</p>
          <p className="mt-1 text-xl font-medium text-gray-800">
            {summary.total}
          </p>
        </div>
        <div className="rounded-xl border border-border/40 bg-white p-4 text-xs shadow-sm">
          <p className="text-muted-foreground">Approved</p>
          <p className="mt-1 text-xl font-medium text-gray-800">
            {summary.approved}
          </p>
        </div>
        <div className="rounded-xl border border-border/40 bg-white p-4 text-xs shadow-sm">
          <p className="text-muted-foreground">Pending review</p>
          <p className="mt-1 text-xl font-medium text-gray-800">
            {summary.submitted}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-gray-800">Submissions</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Review acknowledgements and document uploads from staff.
        </p>

        {submissions.length == 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No submissions yet for this policy.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border border-border/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {sub.userName?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {sub.userName || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.userEmail}
                      </p>
                      {sub.userDepartment && (
                        <p className="text-xs text-muted-foreground">
                          {sub.userDepartment}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        sub.status === 'approved'
                          ? 'bg-primary/10 text-primary'
                          : sub.status === 'submitted'
                            ? 'bg-amber-50 text-amber-700'
                            : sub.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {formatLabel(sub.status)}
                    </span>
                    {sub.submittedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border/40 pt-3 text-xs">
                  {policy.type === 'upload' &&
                    (sub.fileUrl ? (
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Signed document
                      </a>
                    ) : (
                      <span className="text-muted-foreground">
                        No signed document
                      </span>
                    ))}
                  {policy.type === 'policy' && (
                    <span
                      className={
                        sub.acknowledged
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }
                    >
                      {sub.acknowledged ? 'Acknowledged' : 'Not acknowledged'}
                    </span>
                  )}
                  {policy.type === 'training' && (
                    <span className="text-muted-foreground">
                      {sub.status === 'approved'
                        ? 'Training approved'
                        : 'Training submitted'}
                    </span>
                  )}
                </div>

                {sub.status === 'submitted' && (
                  <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
                    <button
                      onClick={() => handleReview(sub.id, 'approved')}
                      className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(sub.id, 'rejected')}
                      className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <XCircle className="mr-1 inline h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}

                {sub.reviewNotes && (
                  <div className="mt-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    <strong>Review notes:</strong> {sub.reviewNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
