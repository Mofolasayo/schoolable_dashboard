'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  Users,
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCompliancePolicies,
  getComplianceMetrics,
  createCompliancePolicy,
  deleteCompliancePolicy,
  CompliancePolicy,
  ComplianceMetrics,
} from '@/app/actions/compliance';
import {
  getReferenceData,
  type ReferenceData,
} from '@/app/actions/reference-data';

const dedupeById = <
  T extends {
    id?: string | null;
    title?: string | null;
    category?: string | null;
    department?: string | null;
    type?: string | null;
  },
>(
  items: T[]
) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const fallbackKey = [
      item.title ?? '',
      item.category ?? '',
      item.department ?? '',
      item.type ?? '',
    ]
      .join('|')
      .trim();
    const key = item.id || fallbackKey;
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const formatLabel = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function CompliancePage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );
  const [policyAttachment, setPolicyAttachment] = useState<File | null>(null);

  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const router = useRouter();

  // New policy form state
  const [newPolicy, setNewPolicy] = useState({
    title: '',
    category: 'Data Security',
    department: '',
    description: '',
    type: 'policy',
    reviewFrequencyDays: 90,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [policiesData, metricsData, refs] = await Promise.all([
        getCompliancePolicies(),
        getComplianceMetrics(),
        getReferenceData().catch((err) => {
          console.warn('Failed to load reference data:', err);
          return null;
        }),
      ]);
      const uniquePolicies = dedupeById(policiesData);
      setPolicies(uniquePolicies);
      setMetrics(metricsData);
      if (refs) {
        setReferenceData(refs);
      }

      // Select first policy if none selected
      if (uniquePolicies.length > 0 && !selectedId) {
        setSelectedId(uniquePolicies[0]?.id || null);
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = useMemo(() => {
    const fallbackCategories = [
      'Data Security',
      'Health & Safety',
      'HR Policies',
      'Finance',
      'IT Security',
      'Operations',
      'Legal',
    ];
    const referenceCategories =
      referenceData?.complianceCategories ?? fallbackCategories;
    const policyCategories = policies
      .map((policy) => policy.category)
      .filter((category) => category && category !== 'All');
    return [
      'All',
      ...Array.from(new Set([...referenceCategories, ...policyCategories])),
    ];
  }, [policies, referenceData]);
  const statuses = [
    'All',
    ...Array.from(new Set(policies.map((policy) => policy.status))).filter(
      (status) => status && status !== 'All'
    ),
  ];

  const policyTypes = useMemo(
    () => referenceData?.compliancePolicyTypes ?? [],
    [referenceData]
  );
  const createCategories = useMemo(
    () => categories.filter((c) => c !== 'All'),
    [categories]
  );
  const policyTypeLabels = useMemo(() => {
    const entries = policyTypes.map(
      (type) => [type.value, type.label] as const
    );
    return new Map(entries);
  }, [policyTypes]);

  useEffect(() => {
    if (
      createCategories.length > 0 &&
      !createCategories.includes(newPolicy.category)
    ) {
      setNewPolicy((prev) => ({
        ...prev,
        category: createCategories[0] ?? 'Data Security',
      }));
    }
  }, [createCategories, newPolicy.category]);

  const filteredItems = policies.filter((item) => {
    const matchesStatus =
      selectedStatus === 'All' || item.status === selectedStatus;
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const selectedPolicy = policies.find((item) => item.id === selectedId);

  const statusBadgeClass: Record<string, string> = {
    Compliant: 'bg-primary/10 text-primary',
    'At Risk': 'bg-amber-50 text-amber-700',
    'Non-Compliant': 'bg-rose-50 text-rose-700',
  };

  const progressClass = (status: string) => {
    if (status === 'Non-Compliant') return 'bg-rose-400';
    if (status === 'At Risk') return 'bg-primary/70';
    return 'bg-primary';
  };
  const resolvePolicyTypeLabel = (type?: string | null) => {
    if (!type) return '—';
    return policyTypeLabels.get(type) ?? formatLabel(type);
  };
  const resolveRequirementLabel = (type?: string | null) => {
    if (!type) return '—';
    if (type === 'policy') return 'Acknowledgement required';
    if (type === 'upload') return 'Signed document required';
    if (type === 'training') return 'Training completion required';
    return formatLabel(type);
  };

  const handleCreatePolicy = async () => {
    if (!newPolicy.title.trim() || !newPolicy.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (policyAttachment) {
        const maxFileSize = 10 * 1024 * 1024;
        if (policyAttachment.size > maxFileSize) {
          toast.error('Attachment exceeds the 10MB limit');
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', policyAttachment);

        const uploadRes = await fetch('/api/upload?folder=compliance', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json().catch(() => ({}));
          console.error('Attachment upload failed:', uploadError);
          toast.error(
            uploadError.error ||
              'Attachment upload failed. Saving policy without file.'
          );
        } else {
          const uploadResult = await uploadRes.json();
          fileUrl = uploadResult.url;
          fileName = policyAttachment.name;
        }
      }

      const result = await createCompliancePolicy({
        title: newPolicy.title,
        category: newPolicy.category,
        department: newPolicy.department || undefined,
        description: newPolicy.description,
        type: newPolicy.type,
        reviewFrequencyDays: newPolicy.reviewFrequencyDays,
        fileUrl,
        fileName,
      });

      if (result.success) {
        toast.success('Policy created successfully');
        setIsCreateModalOpen(false);
        setNewPolicy({
          title: '',
          category: createCategories[0] || 'Data Security',
          department: '',
          description: '',
          type: 'policy',
          reviewFrequencyDays: 90,
        });
        setPolicyAttachment(null);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to create policy');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const result = await deleteCompliancePolicy(id);
      if (result.success) {
        toast.success('Policy deleted');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to delete policy');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error('Failed to delete policy');
    }
  };

  const summaryMetrics = [
    {
      label: 'Overall Compliance',
      value: metrics ? `${metrics.overallComplianceRate}%` : '—',
      detail: 'Organization-wide rate',
      icon: Shield,
      iconColor: 'text-primary',
    },
    {
      label: 'Compliant Policies',
      value: metrics?.compliantPolicies?.toString() || '—',
      detail: `Out of ${metrics?.totalPolicies || 0} active policies`,
      icon: CheckCircle2,
      iconColor: 'text-primary',
    },
    {
      label: 'At Risk',
      value: metrics?.atRiskPolicies?.toString() || '—',
      detail: 'Require attention',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    {
      label: 'Non-Compliant',
      value: metrics?.nonCompliantPolicies?.toString() || '—',
      detail: 'Immediate action needed',
      icon: XCircle,
      iconColor: 'text-rose-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading compliance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Compliance</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track policy adherence and compliance metrics across the
            organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New Policy
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {metric.label}
                </p>
                <Icon className={`h-4 w-4 ${metric.iconColor}`} />
              </div>
              <p className="mb-1 text-3xl font-normal tracking-tight text-gray-800">
                {metric.value}
              </p>
              <p className="text-xs text-muted-foreground">{metric.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="max-w-md flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search compliance items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Status and Category Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Status:
              </span>
              <div className="flex items-center gap-1">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedStatus === status
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Category:
              </span>
              <div className="flex items-center gap-1">
                {categories.slice(0, 4).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {category.replace('All', 'All Categories')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* List */}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                selectedId === item.id
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-medium text-gray-800">
                        {item.title}
                      </h3>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusBadgeClass[item.status] ?? 'bg-muted text-gray-700'}`}
                    >
                      {item.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium text-gray-700">
                        {resolvePolicyTypeLabel(item.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium text-gray-700">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-medium text-gray-700">
                        {item.complianceRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
              {policies.length === 0
                ? 'No compliance policies yet. Create your first policy to get started.'
                : 'No compliance items found matching your filters.'}
            </div>
          )}
        </div>

        {/* Details View */}
        <div className="space-y-4">
          {selectedPolicy ? (
            <div className="sticky top-6 rounded-xl border border-border/40 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <span
                    className={`mb-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusBadgeClass[selectedPolicy.status]}`}
                  >
                    {selectedPolicy.status}
                  </span>
                  <h2 className="text-xl font-medium text-gray-800">
                    {selectedPolicy.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPolicy.fileUrl ? (
                    <a
                      href={selectedPolicy.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="p-2 text-muted-foreground/40"
                      disabled
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border/40 bg-gray-50/50 p-3">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Compliance Rate
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-normal text-gray-800">
                        {selectedPolicy.complianceRate}%
                      </span>
                      <span className="mb-1 text-xs text-muted-foreground">
                        Target: 95%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${progressClass(selectedPolicy.status)}`}
                        style={{ width: `${selectedPolicy.complianceRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-gray-50/50 p-3">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Staff Adherence
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-normal text-gray-800">
                        {selectedPolicy.staffCount -
                          selectedPolicy.nonCompliant}
                      </span>
                      <span className="mb-1 text-xs text-muted-foreground">
                        / {selectedPolicy.staffCount} Staff
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-red-600">
                      {selectedPolicy.nonCompliant} Non-compliant
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-6 text-xs">
                  <div>
                    <p className="mb-1 text-muted-foreground">Department</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <Users className="h-3.5 w-3.5" />
                      {selectedPolicy.department || 'All Departments'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Category</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <FileText className="h-3.5 w-3.5" />
                      {selectedPolicy.category}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">
                      Compliance Type
                    </p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <Shield className="h-3.5 w-3.5" />
                      {resolvePolicyTypeLabel(selectedPolicy.type)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Requirement</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {resolveRequirementLabel(selectedPolicy.type)}
                    </p>
                  </div>
                  {selectedPolicy.fileUrl && (
                    <div>
                      <p className="mb-1 text-muted-foreground">Attachment</p>
                      <a
                        href={selectedPolicy.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 font-medium text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {selectedPolicy.fileName || 'Download attachment'}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-muted-foreground">Last Review</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <Clock className="h-3.5 w-3.5" />
                      {selectedPolicy.lastReview
                        ? new Date(
                            selectedPolicy.lastReview
                          ).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Next Review</p>
                    <p
                      className={`flex items-center gap-2 font-medium ${
                        selectedPolicy.nextReview &&
                        new Date(selectedPolicy.nextReview) < new Date()
                          ? 'text-red-600'
                          : 'text-gray-800'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {selectedPolicy.nextReview
                        ? new Date(
                            selectedPolicy.nextReview
                          ).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <h3 className="mb-2 text-sm font-medium text-gray-800">
                    Description
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {selectedPolicy.description}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/compliance/${selectedPolicy.id}`)
                    }
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                  >
                    View Submissions
                  </button>
                  <button
                    onClick={() => handleDeletePolicy(selectedPolicy.id)}
                    className="flex-1 rounded-md border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete Policy
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
              Select a policy to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Policy Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 p-4">
              <h3 className="text-lg font-medium text-gray-800">
                New Compliance Policy
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setPolicyAttachment(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Close</span>
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Policy Title *
                </label>
                <input
                  type="text"
                  value={newPolicy.title}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Remote Work Security Policy"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    value={newPolicy.category}
                    onChange={(e) =>
                      setNewPolicy({ ...newPolicy, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    {createCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">
                    Policy Type *
                  </label>
                  <select
                    value={newPolicy.type}
                    onChange={(e) =>
                      setNewPolicy({ ...newPolicy, type: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    {policyTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Department (leave empty for all departments)
                </label>
                <input
                  type="text"
                  value={newPolicy.department}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, department: e.target.value })
                  }
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Engineering, HR, Finance"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  value={newPolicy.description}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, description: e.target.value })
                  }
                  className="h-24 w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="Brief description of the policy..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Attachment (optional)
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setPolicyAttachment(e.target.files?.[0] || null)
                  }
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
                {policyAttachment && (
                  <p className="text-[11px] text-muted-foreground">
                    Selected: {policyAttachment.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Review Frequency (days)
                </label>
                <input
                  type="number"
                  value={newPolicy.reviewFrequencyDays}
                  onChange={(e) =>
                    setNewPolicy({
                      ...newPolicy,
                      reviewFrequencyDays: parseInt(e.target.value) || 90,
                    })
                  }
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="90"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-border/40 bg-gray-50/50 p-4">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setPolicyAttachment(null);
                }}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePolicy}
                disabled={isSubmitting}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
