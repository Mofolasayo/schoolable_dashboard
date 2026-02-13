'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Folder,
  FolderOpen,
  File,
  Image,
  FileCheck,
  Clock,
  User,
  ChevronRight,
  Paperclip,
} from 'lucide-react';
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
  getTaskAttachmentDocuments,
  getDailyReportAttachments,
  getWeeklyTeamReportDocuments,
  type TaskAttachmentDocument,
  type DailyReportAttachmentDocument,
  type WeeklyTeamReportDocument,
} from '@/app/actions/documents';

interface Document {
  id: string;
  name: string;
  type:
    | 'policy'
    | 'certificate'
    | 'submission'
    | 'task'
    | 'daily-report'
    | 'weekly-report'
    | 'other';
  category: string;
  uploadedBy: string | null;
  uploadedAt: string;
  status: 'active' | 'archived' | 'pending';
  fileUrl?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Documents');

  const mapStatus = (status?: string | null): Document['status'] => {
    const normalized = (status || '').toLowerCase();
    if (['approved', 'compliant', 'submitted', 'active'].includes(normalized))
      return 'active';
    if (['pending', 'at risk', 'in_review'].includes(normalized))
      return 'pending';
    if (['rejected', 'non-compliant', 'archived'].includes(normalized))
      return 'archived';
    return 'pending';
  };

  const getFolderIcon = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes('compliance')) return FileCheck;
    if (normalized.includes('certificate') || normalized.includes('training'))
      return FileText;
    if (normalized.includes('task')) return Paperclip;
    if (normalized.includes('daily')) return FileText;
    if (normalized.includes('weekly')) return FileText;
    if (normalized.includes('hr') || normalized.includes('human')) return User;
    return Folder;
  };

  const categoryCounts = documents.reduce<Record<string, number>>(
    (acc, doc) => {
      const key = doc.category;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );

  const folderCategories = [
    {
      name: 'All Documents',
      icon: Folder,
      count: documents.length,
    },
    ...Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      icon: getFolderIcon(name),
      count,
    })),
  ];

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        policies,
        certificates,
        taskAttachments,
        dailyReportAttachments,
        weeklyTeamReports,
      ] = await Promise.all([
        getCompliancePolicies(),
        getCertificates(),
        getTaskAttachmentDocuments(),
        getDailyReportAttachments(),
        getWeeklyTeamReportDocuments(),
      ]);

      const policyDocuments: Document[] = policies
        .filter((policy) => Boolean(policy.fileUrl))
        .map((policy: CompliancePolicy) => ({
          id: `policy-${policy.id}`,
          name: policy.fileName || policy.title,
          type: 'policy',
          category: 'Compliance Policies',
          uploadedBy: null,
          uploadedAt: policy.lastReview || policy.nextReview || '',
          status: mapStatus(policy.status),
          fileUrl: policy.fileUrl || undefined,
        }));

      const submissionsByPolicy = await Promise.all(
        policies.map(async (policy) => {
          const submissions = await getComplianceSubmissions(policy.id);
          return submissions.map((submission) => ({ submission, policy }));
        })
      );

      const submissionDocuments: Document[] = submissionsByPolicy
        .flat()
        .filter(({ submission }) => Boolean(submission.fileUrl))
        .map(
          ({
            submission,
            policy,
          }: {
            submission: ComplianceSubmission;
            policy: CompliancePolicy;
          }) => ({
            id: `submission-${submission.id}`,
            name: submission.fileName || `${policy.title} submission`,
            type: 'submission',
            category: 'Compliance Submissions',
            uploadedBy: submission.userName || submission.userEmail || null,
            uploadedAt: submission.submittedAt || '',
            status: mapStatus(submission.status),
            fileUrl: submission.fileUrl || undefined,
          })
        );

      const certificateDocuments: Document[] = certificates
        .filter((certificate: TrainingRecord) => Boolean(certificate.fileUrl))
        .map((certificate: TrainingRecord) => ({
          id: `certificate-${certificate.id}`,
          name: certificate.certificateName,
          type: 'certificate',
          category: 'Training Certificates',
          uploadedBy: certificate.employeeName || null,
          uploadedAt: certificate.completedAt || certificate.reviewedAt || '',
          status: mapStatus(certificate.status),
          fileUrl: certificate.fileUrl || undefined,
        }));

      const taskDocuments: Document[] = (
        taskAttachments as TaskAttachmentDocument[]
      ).map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        type: 'task',
        category: 'Task Attachments',
        uploadedBy: attachment.uploadedBy,
        uploadedAt: attachment.uploadedAt || '',
        status: 'active',
        fileUrl: attachment.url,
      }));

      const dailyReportDocuments: Document[] = (
        dailyReportAttachments as DailyReportAttachmentDocument[]
      ).map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        type: 'daily-report',
        category: 'Daily Reports',
        uploadedBy: attachment.employeeName,
        uploadedAt: attachment.reportDate || attachment.uploadedAt || '',
        status: 'active',
        fileUrl: attachment.url,
      }));

      const weeklyReportDocuments: Document[] = (
        weeklyTeamReports as WeeklyTeamReportDocument[]
      ).map((report) => ({
        id: report.id,
        name: report.teamLeadName
          ? `Weekly report - ${report.teamLeadName} (W${report.weekNumber ?? ''})`
          : `Weekly report (W${report.weekNumber ?? ''})`,
        type: 'weekly-report',
        category: 'Weekly Team Reports',
        uploadedBy: report.teamLeadName,
        uploadedAt: report.weekStartDate || '',
        status: 'active',
        fileUrl: report.url,
      }));

      setDocuments([
        ...policyDocuments,
        ...submissionDocuments,
        ...certificateDocuments,
        ...taskDocuments,
        ...dailyReportDocuments,
        ...weeklyReportDocuments,
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch documents'
      );
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchQuery === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All Documents' || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'policy':
        return FileCheck;
      case 'certificate':
        return FileText;
      case 'submission':
        return Image;
      case 'task':
        return Paperclip;
      case 'daily-report':
        return FileText;
      case 'weekly-report':
        return FileText;
      default:
        return File;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'archived':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const openDocument = (doc: Document) => {
    if (!doc.fileUrl) return;
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadDocument = (doc: Document) => {
    if (!doc.fileUrl) return;
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.name || 'document';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            Document Repository
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage and access organizational documents, policies, and
            certificates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDocuments}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchDocuments}
            className="ml-auto text-sm font-medium text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar - Folders */}
        <div className="h-fit rounded-xl border border-border/40 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </h3>
          <div className="space-y-1">
            {folderCategories.map((folder) => {
              const FolderIcon =
                selectedCategory === folder.name ? FolderOpen : folder.icon;
              return (
                <button
                  key={folder.name}
                  onClick={() => setSelectedCategory(folder.name)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedCategory === folder.name
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4" />
                    <span>{folder.name}</span>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {folder.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 border-t border-border/40 pt-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Storage Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Documents</span>
                <span className="font-medium">{documents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium text-emerald-600">
                  {documents.filter((d) => d.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Archived</span>
                <span className="font-medium text-gray-500">
                  {documents.filter((d) => d.status === 'archived').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Documents List */}
        <div className="space-y-4">
          {/* Search */}
          <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Documents Grid/List */}
          <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
            <div className="border-b border-border/40 p-4">
              <h2 className="text-sm font-medium text-gray-700">
                {selectedCategory}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {filteredDocuments.length} document
                {filteredDocuments.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading documents...
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredDocuments.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="mb-4 rounded-full bg-muted/50 p-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-sm font-medium text-gray-800">
                  No documents found
                </h3>
                <p className="max-w-sm text-center text-xs text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search query.'
                    : 'No documents available yet.'}
                </p>
              </div>
            )}

            {/* Documents List */}
            {!isLoading && filteredDocuments.length > 0 && (
              <div className="divide-y divide-border/40">
                {filteredDocuments.map((doc) => {
                  const FileIcon = getFileIcon(doc.type);
                  const hasFile = Boolean(doc.fileUrl);
                  return (
                    <div
                      key={doc.id}
                      className="cursor-pointer p-4 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-4">
                        {/* File Icon */}
                        <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
                          <FileIcon className="h-5 w-5 text-primary" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="truncate text-sm font-normal text-slate-800">
                              {doc.name}
                            </h3>
                            {doc.status !== 'archived' && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadge(doc.status)}`}
                              >
                                {doc.status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Folder className="h-3 w-3" />
                              {doc.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(doc.uploadedAt)}
                            </span>
                            {doc.uploadedBy && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {doc.uploadedBy}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDocument(doc);
                            }}
                            disabled={!hasFile}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadDocument(doc);
                            }}
                            disabled={!hasFile}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
