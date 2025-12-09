'use client';

import { useState } from 'react';
import {
  Download,
  FileText,
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  BarChart3,
} from 'lucide-react';

// Mock reports data
const reports = [
  {
    id: 1,
    title: 'Monthly Performance Report - January 2024',
    type: 'Performance',
    department: 'All Departments',
    period: 'January 2024',
    generatedBy: 'System Admin',
    generatedAt: '2024-02-01T10:30:00',
    status: 'Generated',
    fileSize: '2.4 MB',
    format: 'PDF',
    metrics: {
      overallKpi: 89,
      taskCompletion: 92,
      attendance: 88,
      compliance: 96,
    },
  },
  {
    id: 2,
    title: 'Quarterly Staff Appraisal Report - Q4 2023',
    type: 'Appraisal',
    department: 'Sales',
    period: 'Q4 2023',
    generatedBy: 'HR Manager',
    generatedAt: '2024-01-15T14:20:00',
    status: 'Generated',
    fileSize: '3.8 MB',
    format: 'Word',
    metrics: {
      overallKpi: 87,
      taskCompletion: 90,
      attendance: 91,
      compliance: 94,
    },
  },
  {
    id: 3,
    title: 'Weekly Task Summary Report',
    type: 'Task Summary',
    department: 'Engineering',
    period: 'Week 4, January 2024',
    generatedBy: 'System Auto',
    generatedAt: '2024-01-28T09:00:00',
    status: 'Generated',
    fileSize: '1.2 MB',
    format: 'PDF',
    metrics: {
      overallKpi: 85,
      taskCompletion: 88,
      attendance: 87,
      compliance: 90,
    },
  },
  {
    id: 4,
    title: 'Compliance Audit Report - Annual 2023',
    type: 'Compliance',
    department: 'All Departments',
    period: '2023',
    generatedBy: 'Compliance Officer',
    generatedAt: '2024-01-05T16:45:00',
    status: 'Generated',
    fileSize: '5.1 MB',
    format: 'PDF',
    metrics: {
      overallKpi: 92,
      taskCompletion: 94,
      attendance: 89,
      compliance: 98,
    },
  },
  {
    id: 5,
    title: 'Department Performance Comparison',
    type: 'Analytics',
    department: 'All Departments',
    period: 'Q4 2023',
    generatedBy: 'Analytics Team',
    generatedAt: '2024-01-20T11:15:00',
    status: 'Generating',
    fileSize: '-',
    format: 'PDF',
    metrics: null,
  },
];

const reportTypes = [
  'All',
  'Performance',
  'Appraisal',
  'Task Summary',
  'Compliance',
  'Analytics',
];

const summaryMetrics = [
  {
    label: 'Total Reports',
    value: '48',
    detail: '12 this month',
    icon: FileText,
    color: 'text-primary',
  },
  {
    label: 'Generated',
    value: '45',
    detail: '93% success rate',
    icon: FileText,
    color: 'text-emerald-600',
  },
  {
    label: 'Pending',
    value: '2',
    detail: 'In queue',
    icon: Calendar,
    color: 'text-orange-600',
  },
  {
    label: 'Failed',
    value: '1',
    detail: 'Requires attention',
    icon: FileText,
    color: 'text-red-600',
  },
];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const recordsPerPage = 5;

  const filteredReports = reports.filter((report) => {
    const matchesType = selectedType === 'All' || report.type === selectedType;
    const matchesSearch =
      searchQuery === '' ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.department.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Reports</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate and view performance reports across the organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            Generate Report
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
                <Icon className={`h-4 w-4 ${metric.color}`} />
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
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Type:
              </span>
              <div className="flex items-center gap-1">
                {reportTypes.slice(0, 5).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedType === type
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="border-b border-border/40 p-6">
          <div>
            <h2 className="text-sm font-normal text-gray-700">All Reports</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              View and download generated performance and compliance reports.
            </p>
          </div>
        </div>

        {/* Reports List */}
        <div className="divide-y divide-border/40">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-6 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="mb-1 text-sm font-medium text-gray-800">
                            {report.title}
                          </h3>
                          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {report.type}
                            </span>
                            <span>•</span>
                            <span>{report.department}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {report.period}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Metrics Preview */}
                      {report.metrics && (
                        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Overall KPI
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {report.metrics.overallKpi}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Tasks
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {report.metrics.taskCompletion}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Attendance
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {report.metrics.attendance}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Compliance
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {report.metrics.compliance}%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Report Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>By {report.generatedBy}</span>
                        <span>•</span>
                        <span>
                          {new Date(report.generatedAt).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                        <span>•</span>
                        <span>{report.format}</span>
                        <span>•</span>
                        <span>{report.fileSize}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {report.status === 'Generated' && (
                    <>
                      <button className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </>
                  )}
                  {report.status === 'Generating' && (
                    <div className="flex items-center gap-2 text-xs text-orange-600">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent"></div>
                      Uploading...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filteredReports.length > 0 && (
          <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * recordsPerPage + 1}-
              {Math.min(currentPage * recordsPerPage, filteredReports.length)}{' '}
              of {filteredReports.length} reports
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
                disabled={
                  currentPage * recordsPerPage >= filteredReports.length
                }
                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {filteredReports.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No reports found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
