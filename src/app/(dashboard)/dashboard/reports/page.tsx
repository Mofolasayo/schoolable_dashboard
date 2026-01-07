'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  CheckCircle,
  Clock,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  FileDown,
  X,
  TrendingUp,
  Star,
  Target,
  Award,
  Zap,
  Info,
} from 'lucide-react';
import { getDepartmentReports, type DepartmentReport } from '@/app/actions/dashboard';
import { getAllTeamScores, getAllTeamKpis, type TeamQuarterlyScore, type TeamKpi } from '@/lib/api/backend';

const reportTypes = [
  'All',
  'Department',
  'Performance',
  'Compliance',
];

// Types for extended department data
interface DepartmentDetail extends DepartmentReport {
  teamScore: TeamQuarterlyScore | null;
  kpis: TeamKpi[];
}

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [departmentReports, setDepartmentReports] = useState<DepartmentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recordsPerPage = 5;

  // Department detail modal state
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  // Get current quarter
  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  };
  const currentQuarter = getCurrentQuarter();
  const currentYear = new Date().getFullYear();

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const reports = await getDepartmentReports();
      setDepartmentReports(reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Fetch department detail including team score and KPIs
  const handleDepartmentClick = async (dept: DepartmentReport) => {
    setIsLoadingDetail(true);
    try {
      const [scoresData, kpisData] = await Promise.all([
        getAllTeamScores(currentQuarter, currentYear),
        getAllTeamKpis(currentQuarter, currentYear),
      ]);

      // Find team score for this department
      const teamScore = scoresData.teams.find(
        (t) => t.department.toLowerCase() === dept.department.toLowerCase()
      ) || null;

      // Find KPIs for this department
      const departmentKpis = kpisData.kpis.filter(
        (kpi) => kpi.department.toLowerCase() === dept.department.toLowerCase()
      );

      setSelectedDepartment({
        ...dept,
        teamScore,
        kpis: departmentKpis,
      });
    } catch (err) {
      console.error('Failed to fetch department detail:', err);
      // Still show the basic info even if extended data fails
      setSelectedDepartment({
        ...dept,
        teamScore: null,
        kpis: [],
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Export to CSV/Excel
  const exportToCSV = () => {
    if (departmentReports.length === 0) return;

    const headers = ['Department', 'Total Staff', 'Avg KPI %', 'Tasks Completed', 'Tasks Pending', 'Attendance Rate', 'Top Performer'];
    const rows = departmentReports.map(dept => [
      dept.department,
      dept.totalStaff,
      dept.averageKpi,
      dept.tasksCompleted,
      dept.tasksPending,
      dept.attendanceRate,
      dept.topPerformer || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `department_reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export to PDF (creates printable HTML)
  const exportToPDF = () => {
    if (departmentReports.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Department Performance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1f2937; font-size: 24px; margin-bottom: 8px; }
          .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
          .summary { display: flex; gap: 20px; margin-bottom: 32px; }
          .metric { padding: 16px; background: #f9fafb; border-radius: 8px; flex: 1; }
          .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
          td { font-size: 14px; color: #1f2937; }
          .kpi-good { color: #059669; }
          .kpi-ok { color: #d97706; }
          .kpi-bad { color: #dc2626; }
          .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Department Performance Report</h1>
        <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
        
        <div class="summary">
          <div class="metric">
            <div class="metric-label">Departments</div>
            <div class="metric-value">${departmentReports.length}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Total Staff</div>
            <div class="metric-value">${totalStaff}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Avg KPI</div>
            <div class="metric-value">${avgKpi}%</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Staff</th>
              <th>Avg KPI</th>
              <th>Tasks Done</th>
              <th>Pending</th>
              <th>Attendance</th>
              <th>Top Performer</th>
            </tr>
          </thead>
          <tbody>
            ${departmentReports.map(dept => `
              <tr>
                <td><strong>${dept.department}</strong></td>
                <td>${dept.totalStaff}</td>
                <td class="${dept.averageKpi >= 70 ? 'kpi-good' : dept.averageKpi >= 50 ? 'kpi-ok' : 'kpi-bad'}">${dept.averageKpi}%</td>
                <td>${dept.tasksCompleted}</td>
                <td>${dept.tasksPending}</td>
                <td>${dept.attendanceRate}%</td>
                <td>${dept.topPerformer || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p class="footer">Schoolable Platform • ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter departments based on search
  const filteredDepartments = departmentReports.filter((dept) => {
    const matchesSearch =
      searchQuery === '' ||
      dept.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate summary metrics
  const totalStaff = departmentReports.reduce((sum, d) => sum + d.totalStaff, 0);
  const totalTasksCompleted = departmentReports.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const totalTasksPending = departmentReports.reduce((sum, d) => sum + d.tasksPending, 0);
  const avgKpi = departmentReports.length > 0
    ? Math.round(departmentReports.reduce((sum, d) => sum + d.averageKpi, 0) / departmentReports.length)
    : 0;

  const summaryMetrics = [
    {
      label: 'Total Departments',
      value: departmentReports.length.toString(),
      detail: 'Active departments',
      icon: Building2,
      color: 'text-primary',
    },
    {
      label: 'Total Staff',
      value: totalStaff.toString(),
      detail: 'Across all departments',
      icon: Users,
      color: 'text-emerald-600',
    },
    {
      label: 'Tasks Completed',
      value: totalTasksCompleted.toString(),
      detail: `${totalTasksPending} pending`,
      icon: CheckCircle,
      color: 'text-blue-600',
    },
    {
      label: 'Average KPI',
      value: `${avgKpi}%`,
      detail: 'Organization-wide',
      icon: BarChart3,
      color: 'text-purple-600',
    },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / recordsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Helper functions for grades
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'A-':
      case 'B+':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'B':
      case 'B-':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'C+':
      case 'C':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Reports</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            View performance reports by department. Click on a department for detailed analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
              <FileDown className="h-3.5 w-3.5" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-white border border-border/40 rounded-lg shadow-lg py-1 min-w-[140px]">
              <button
                onClick={exportToCSV}
                disabled={departmentReports.length === 0}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted/50 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Export as CSV
              </button>
              <button
                onClick={exportToPDF}
                disabled={departmentReports.length === 0}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted/50 disabled:opacity-50"
              >
                <FileText className="h-3.5 w-3.5 text-red-600" />
                Export as PDF
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchReports}
            className="ml-auto text-sm font-medium text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

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
                {isLoading ? '—' : metric.value}
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
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
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
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedType === type
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

      {/* Department Reports Table */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="border-b border-border/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-normal text-gray-700">Department Performance Reports</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Click on any department to view detailed team scores, KPIs, and AI insights.
              </p>
            </div>
            <button
              onClick={() => setShowScoringInfo(true)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Info className="h-3.5 w-3.5" />
              How scoring works
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading reports...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDepartments.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="rounded-full bg-muted/50 p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-gray-800 mb-1">No reports found</h3>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? 'No departments match your search. Try a different search term.'
                : 'No department data available. Reports will appear here once there are staff and tasks in the system.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Department Reports List */}
        {!isLoading && paginatedDepartments.length > 0 && (
          <div className="divide-y divide-border/40">
            {paginatedDepartments.map((dept) => (
              <div
                key={dept.department}
                onClick={() => handleDepartmentClick(dept)}
                className="p-6 transition-colors hover:bg-muted/20 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="mb-1 text-sm font-medium text-gray-800">
                              {dept.department}
                            </h3>
                            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {dept.totalStaff} staff
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {currentQuarter} {currentYear}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Metrics Preview */}
                        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Average KPI
                            </p>
                            <p className={`text-sm font-medium ${dept.averageKpi >= 70 ? 'text-emerald-600' :
                              dept.averageKpi >= 50 ? 'text-amber-600' :
                                'text-red-600'
                              }`}>
                              {dept.averageKpi}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Tasks Done
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {dept.tasksCompleted}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Tasks Pending
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {dept.tasksPending}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Attendance
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {dept.attendanceRate}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="mb-0.5 text-[10px] text-muted-foreground">
                              Top Performer
                            </p>
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {dept.topPerformer || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Report Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated just now
                          </span>
                          <span className="text-primary font-medium">
                            Click to view details →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredDepartments.length > recordsPerPage && (
          <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * recordsPerPage + 1}-
              {Math.min(currentPage * recordsPerPage, filteredDepartments.length)}{' '}
              of {filteredDepartments.length} departments
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
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Department Detail Modal */}
      {selectedDepartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedDepartment(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl">
                  <button
                    onClick={() => setSelectedDepartment(null)}
                    className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedDepartment.department}</h2>
                      <p className="text-indigo-100">{selectedDepartment.totalStaff} employees • {currentQuarter} {currentYear}</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-white/20 backdrop-blur px-4 py-3">
                      <p className="text-2xl font-bold">{selectedDepartment.averageKpi}%</p>
                      <p className="text-xs text-indigo-100">Average KPI</p>
                    </div>
                    <div className="rounded-xl bg-white/20 backdrop-blur px-4 py-3">
                      <p className="text-2xl font-bold">{selectedDepartment.attendanceRate}%</p>
                      <p className="text-xs text-indigo-100">Attendance</p>
                    </div>
                    <div className="rounded-xl bg-white/20 backdrop-blur px-4 py-3">
                      <p className="text-2xl font-bold">{selectedDepartment.tasksCompleted}</p>
                      <p className="text-xs text-indigo-100">Tasks Done</p>
                    </div>
                    <div className="rounded-xl bg-white/20 backdrop-blur px-4 py-3">
                      <p className="text-2xl font-bold">{selectedDepartment.tasksPending}</p>
                      <p className="text-xs text-indigo-100">Pending</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Team Score Section */}
                  {selectedDepartment.teamScore && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                        Team Performance Score
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl border border-border/40 bg-gradient-to-br from-indigo-50 to-white p-4 text-center">
                          <p className="text-3xl font-bold text-indigo-600">
                            {selectedDepartment.teamScore.overallTeamScore.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Overall Score</p>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-gradient-to-br from-emerald-50 to-white p-4 text-center">
                          <p className="text-3xl font-bold text-emerald-600">
                            {selectedDepartment.teamScore.kpiAchievementScore.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">KPI Achievement</p>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-gray-50 p-4 text-center">
                          <div className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xl font-bold border ${getGradeColor(selectedDepartment.teamScore.grade)}`}>
                            {selectedDepartment.teamScore.grade}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Team Grade</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  {selectedDepartment.teamScore?.aiSummary && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <div className="flex items-center gap-2 text-amber-600 mb-2">
                        <Star className="h-5 w-5" />
                        <span className="text-sm font-semibold">AI Performance Summary</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedDepartment.teamScore.aiSummary}
                      </p>
                    </div>
                  )}

                  {/* KPIs Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Department KPIs ({selectedDepartment.kpis.length})
                    </h3>
                    {selectedDepartment.kpis.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDepartment.kpis.map((kpi) => (
                          <div
                            key={kpi.id}
                            className="flex items-center justify-between rounded-lg border border-border/40 bg-gray-50 p-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{kpi.name}</p>
                              <p className="text-xs text-gray-500">
                                Target: {kpi.targetValue} {kpi.targetUnit} • Weight: {kpi.weight}%
                              </p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${kpi.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                              }`}>
                              {kpi.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-500 text-sm">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>No KPIs defined for this department yet</p>
                      </div>
                    )}
                  </div>

                  {/* Top Performer */}
                  {selectedDepartment.topPerformer && (
                    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                          <Award className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-amber-600 font-medium">Top Performer</p>
                          <p className="text-lg font-bold text-gray-800">{selectedDepartment.topPerformer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border/40 p-4">
                  <button
                    onClick={() => setSelectedDepartment(null)}
                    className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Scoring Info Modal */}
      {showScoringInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowScoringInfo(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Understanding Performance Scores
                </h2>
                <button
                  onClick={() => setShowScoringInfo(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6 text-sm text-gray-600">
                {/* KPI Score */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    KPI Score (Department Level)
                  </h3>
                  <p className="mb-2">
                    The <strong>KPI Score</strong> measures how well a team achieves its Key Performance Indicators. These are specific, measurable targets set for each department.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Each KPI has a target value and weight</li>
                    <li>Achievement is calculated as (Actual / Target × 100)</li>
                    <li>Weighted average of all KPIs = Final KPI Score</li>
                  </ul>
                </div>

                {/* Team Score */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Team Score
                  </h3>
                  <p className="mb-2">
                    The <strong>Team Score</strong> is a comprehensive metric that combines multiple factors:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-indigo-700">
                    <li><strong>KPI Achievement (40%)</strong> - How well team KPIs are met</li>
                    <li><strong>Task Completion (30%)</strong> - Ratio of completed vs assigned tasks</li>
                    <li><strong>Attendance (15%)</strong> - Team member attendance rate</li>
                    <li><strong>Quality Rating (15%)</strong> - Average quality score on completed tasks</li>
                  </ul>
                </div>

                {/* AURA Score */}
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                  <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AURA Score (Individual Level)
                  </h3>
                  <p className="mb-2">
                    The <strong>AURA Score</strong> (Automated Universal Rating Assessment) is an individual performance metric based on 5 pillars:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-purple-700">
                    <li><strong>Technical (25%)</strong> - Skills and task quality</li>
                    <li><strong>Behavioral (25%)</strong> - Attendance, teamwork, adaptability</li>
                    <li><strong>Culture Fit (25%)</strong> - Values alignment, attitude, integrity</li>
                    <li><strong>Growth & Learning (25%)</strong> - Training, certifications, improvement</li>
                  </ul>
                </div>

                {/* Grade System */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Grade System
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-6 rounded bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">A</span>
                      <span>90%+ (Exceptional)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">B</span>
                      <span>80-89% (High Performer)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-6 rounded bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">C</span>
                      <span>70-79% (Good Standing)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-6 rounded bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">D</span>
                      <span>60-69% (Needs Improvement)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-6 rounded bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">F</span>
                      <span>&lt;60% (Performance Alert)</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowScoringInfo(false)}
                className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
