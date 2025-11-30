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
  ChevronLeft,
  ChevronRight,
  Filter,
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const recordsPerPage = 5;

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
    <div className="space-y-6">
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

      {/* Compliance Items Table */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="border-b border-border/40 p-6">
          <div>
            <h2 className="text-sm font-normal text-gray-700">
              Compliance Policies
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Track and monitor compliance status across all organizational
              policies.
            </p>
          </div>
        </div>

        {/* Compliance Items List */}
        <div className="divide-y divide-border/40">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-6 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-start gap-4">
                    <div className="flex-1">
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

                      {/* Meta Information */}
                      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Category:
                          </span>
                          <span className="font-medium text-gray-700">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Department:
                          </span>
                          <span className="font-medium text-gray-700">
                            {item.department}
                          </span>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusBadgeClass[item.status] ?? 'bg-muted text-gray-700'}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Compliance Rate and Staff Info */}
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Compliance Rate
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {item.complianceRate}%
                            </span>
                          </div>
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${progressClass(item.status)}`}
                              style={{ width: `${item.complianceRate}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              Staff:
                            </span>
                            <span className="ml-1 font-medium text-gray-700">
                              {item.staffCount}
                            </span>
                          </div>
                          {item.nonCompliant > 0 && (
                            <div>
                              <span className="text-red-600">
                                Non-compliant:
                              </span>
                              <span className="ml-1 font-medium text-red-600">
                                {item.nonCompliant}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Review Dates */}
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Last review:
                          </span>
                          <span className="text-gray-700">
                            {new Date(item.lastReview).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Next review:
                          </span>
                          <span
                            className={`font-medium ${new Date(item.nextReview) < new Date() ? 'text-red-600' : 'text-gray-700'}`}
                          >
                            {new Date(item.nextReview).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * recordsPerPage + 1}-
              {Math.min(currentPage * recordsPerPage, filteredItems.length)} of{' '}
              {filteredItems.length} items
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage * recordsPerPage >= filteredItems.length}
                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No compliance items found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
