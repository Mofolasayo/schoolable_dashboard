'use client';

import { useState } from 'react';
import {
  Download,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Plus,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';

// Mock compliance data
const complianceItems = [
  {
    id: 1,
    title: 'Data Protection Policy Compliance',
    category: 'Data Security',
    status: 'Compliant',
    department: 'IT',
    lastReview: '2024-01-05',
    nextReview: '2024-04-05',
    complianceRate: 98,
    staffCount: 45,
    nonCompliant: 1,
    description:
      'All staff members have completed data protection training and signed the updated policy agreement.',
  },
  {
    id: 2,
    title: 'Health & Safety Training Certification',
    category: 'Health & Safety',
    status: 'At Risk',
    department: 'Operations',
    lastReview: '2023-11-15',
    nextReview: '2024-02-15',
    complianceRate: 72,
    staffCount: 38,
    nonCompliant: 11,
    description:
      '11 staff members have expired certifications. Renewal training scheduled for next week.',
  },
  {
    id: 3,
    title: 'Code of Conduct Acknowledgment',
    category: 'HR Policies',
    status: 'Compliant',
    department: 'HR',
    lastReview: '2024-01-10',
    nextReview: '2024-07-10',
    complianceRate: 100,
    staffCount: 152,
    nonCompliant: 0,
    description:
      'All employees have acknowledged the updated code of conduct policy.',
  },
  {
    id: 4,
    title: 'Financial Reporting Compliance',
    category: 'Finance',
    status: 'Non-Compliant',
    department: 'Finance',
    lastReview: '2023-12-20',
    nextReview: '2024-01-20',
    complianceRate: 65,
    staffCount: 12,
    nonCompliant: 4,
    description:
      '4 finance team members need to complete updated reporting procedures training.',
  },
  {
    id: 5,
    title: 'Access Control Policy Review',
    category: 'IT Security',
    status: 'Compliant',
    department: 'IT',
    lastReview: '2024-01-08',
    nextReview: '2024-04-08',
    complianceRate: 95,
    staffCount: 89,
    nonCompliant: 4,
    description: 'Access control audit completed. Minor issues addressed.',
  },
];

const summaryMetrics = [
  {
    label: 'Overall Compliance',
    value: '92%',
    detail: '+2% vs last month',
    icon: Shield,
    iconColor: 'text-primary',
  },
  {
    label: 'Compliant Policies',
    value: '28',
    detail: 'Out of 32 active policies',
    icon: CheckCircle2,
    iconColor: 'text-primary',
  },
  {
    label: 'At Risk',
    value: '3',
    detail: 'Require attention',
    icon: AlertTriangle,
    iconColor: 'text-primary',
  },
  {
    label: 'Non-Compliant',
    value: '1',
    detail: 'Immediate action needed',
    icon: XCircle,
    iconColor: 'text-primary',
  },
];

export default function CompliancePage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<number>(
    complianceItems.length > 0 ? complianceItems[0]!.id : 0
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const categories = [
    'All',
    'Data Security',
    'Health & Safety',
    'HR Policies',
    'Finance',
    'IT Security',
  ];
  const statuses = ['All', 'Compliant', 'At Risk', 'Non-Compliant'];

  const filteredItems = complianceItems.filter((item) => {
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

  const selectedPolicy = complianceItems.find((item) => item.id === selectedId);

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
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            Export
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
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium text-gray-700">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
              No compliance items found matching your filters.
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
                  <button className="p-2 text-muted-foreground transition-colors hover:text-primary">
                    <Download className="h-4 w-4" />
                  </button>
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
                      {selectedPolicy.department}
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
                    <p className="mb-1 text-muted-foreground">Last Review</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(selectedPolicy.lastReview).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Next Review</p>
                    <p
                      className={`flex items-center gap-2 font-medium ${new Date(selectedPolicy.nextReview) < new Date() ? 'text-red-600' : 'text-gray-800'}`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(selectedPolicy.nextReview).toLocaleDateString()}
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
                  <p className="mt-4 text-sm leading-relaxed text-gray-600">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                    ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
                    Update Status
                  </button>
                  <button className="flex-1 rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                    View Audit Log
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
              <h3 className="text-lg font-medium text-gray-800">New Policy</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Close</span>
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Policy Title
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Remote Work Security Policy"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">
                    Category
                  </label>
                  <select className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20">
                    {categories
                      .filter((c) => c !== 'All')
                      .map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">
                    Department
                  </label>
                  <select className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20">
                    <option>IT</option>
                    <option>HR</option>
                    <option>Finance</option>
                    <option>Operations</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="h-24 w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="Brief description of the policy..."
                ></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Upload Document
                </label>
                <div className="flex w-full items-center justify-center">
                  <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 bg-gray-50 transition-colors hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <Download className="mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOCX (MAX. 10MB)
                      </p>
                    </div>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-border/40 bg-gray-50/50 p-4">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                Create Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
