'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Award,
  Briefcase,
  ChevronRight,
  Building2,
  Plus,
  LayoutList,
  Shield,
  Star,
  Crown,
  FileCheck,
  Clock,
  ExternalLink,
  CheckCircle,
  UserMinus,
  X,
  Search,
  Zap,
  Brain,
  Heart,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  getTeamLeads,
  getPendingTeamLeadRequests,
  approveTeamLeadRequest,
  rejectTeamLeadRequest,
  getTeams,
  createTeam,
  appointTeamLead,
  removeTeamLead,
  getProbations,
  getProbationStats,
  getPips,
  getPromotionEligibility,
  getPromotionThresholds,
  getCertificates,
  reviewCertificate,
  getTimeOffRequests,
  reviewTimeOffRequest,
  type PromotionThresholds,
  confirmProbation,
  getOrganizationalStructure,
  getJobLevels,
  getAllEmployeesWithAura,
  type TeamLead,
  type ProbationRecord,
  type PipRecord,
  type PromotionCandidate,
  type GradeLevel,
  type JobLevel,
  type EmployeeWithAura,
  type Employee,
  type TrainingRecord,
  type TimeOffRequest,
  type TeamSummary,
} from '@/app/actions/hr-management';
import { toast } from 'sonner';

// All data is now fetched dynamically from the backend API

export default function HRPolicyPage() {
  const [activeTab, setActiveTab] = useState<
    | 'employees'
    | 'probation'
    | 'structure'
    | 'promotion'
    | 'pip'
    | 'team-leads'
    | 'teams'
    | 'leave'
    | 'certificates'
  >('employees');

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-900">
            HR & Policy Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage staff lifecycle, organizational structure, and performance
            policies.
          </p>
        </div>

        {/* Tabs - more pill shaped and detached */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border/40 bg-white p-1 shadow-sm">
          <TabButton
            active={activeTab === 'employees'}
            onClick={() => setActiveTab('employees')}
            icon={Users}
            label="Employees"
          />
          <TabButton
            active={activeTab === 'probation'}
            onClick={() => setActiveTab('probation')}
            icon={UserCheck}
            label="Probation"
          />
          <TabButton
            active={activeTab === 'structure'}
            onClick={() => setActiveTab('structure')}
            icon={LayoutList}
            label="Structure"
          />
          <TabButton
            active={activeTab === 'promotion'}
            onClick={() => setActiveTab('promotion')}
            icon={TrendingUp}
            label="Promotions"
          />
          <TabButton
            active={activeTab === 'pip'}
            onClick={() => setActiveTab('pip')}
            icon={Shield}
            label="PIP"
          />
          <TabButton
            active={activeTab === 'team-leads'}
            onClick={() => setActiveTab('team-leads')}
            icon={Award}
            label="Team Leads"
          />
          <TabButton
            active={activeTab === 'teams'}
            onClick={() => setActiveTab('teams')}
            icon={Building2}
            label="Teams"
          />
          <TabButton
            active={activeTab === 'leave'}
            onClick={() => setActiveTab('leave')}
            icon={Clock}
            label="Leave"
          />
          <TabButton
            active={activeTab === 'certificates'}
            onClick={() => setActiveTab('certificates')}
            icon={FileCheck}
            label="Certificates"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px] duration-500 animate-in fade-in-50">
        {activeTab === 'employees' && <EmployeesSection />}
        {activeTab === 'probation' && <ProbationSection />}
        {activeTab === 'structure' && <StructureSection />}
        {activeTab === 'promotion' && <PromotionSection />}
        {activeTab === 'pip' && <PIPSection />}
        {activeTab === 'team-leads' && <TeamLeadSection />}
        {activeTab === 'teams' && <TeamsSection />}
        {activeTab === 'leave' && <LeaveSection />}
        {activeTab === 'certificates' && <CertificatesSection />}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

type AvatarSource = {
  avatar_url?: string | null;
  avatar?: string | null;
  gender?: string | null;
  employee_id?: string | null;
  employeeId?: string | null;
  id?: string | null;
  email?: string | null;
  full_name?: string | null;
  name?: string | null;
};

function resolveAvatarUrl(person: AvatarSource): string {
  const direct = person.avatar_url || person.avatar;
  if (
    typeof direct === 'string' &&
    direct.length > 0 &&
    !direct.includes('placeholder')
  ) {
    return direct;
  }
  const seed =
    person.employee_id ||
    person.employeeId ||
    person.email ||
    person.full_name ||
    person.name ||
    person.id ||
    'user';
  const style =
    person.gender?.toLowerCase() === 'female' ? 'avataaars' : 'bottts';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

type EmployeeDirectory = Record<string, EmployeeWithAura>;

function buildEmployeeDirectory(
  employees: EmployeeWithAura[]
): EmployeeDirectory {
  const directory: EmployeeDirectory = {};
  employees.forEach((emp) => {
    directory[String(emp.id)] = emp;
    if (emp.employee_id) {
      directory[String(emp.employee_id)] = emp;
    }
    if (emp.email) {
      directory[emp.email.toLowerCase()] = emp;
    }
  });
  return directory;
}

function useEmployeeDirectory() {
  const [directory, setDirectory] = useState<EmployeeDirectory>({});

  useEffect(() => {
    let isMounted = true;
    const loadEmployees = async () => {
      try {
        const employees = await getAllEmployeesWithAura();
        if (!isMounted) return;
        setDirectory(
          buildEmployeeDirectory(Array.isArray(employees) ? employees : [])
        );
      } catch (error) {
        console.error('Error fetching employees for avatars:', error);
      }
    };
    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, []);

  return directory;
}

function resolveDirectoryAvatar(
  person: AvatarSource,
  directory: EmployeeDirectory
): string {
  const candidateKeys = [
    person.employee_id,
    person.employeeId,
    person.id,
    person.email?.toLowerCase(),
  ].filter(Boolean) as string[];

  const profile = candidateKeys.reduce<EmployeeWithAura | null>((acc, key) => {
    if (acc) return acc;
    return directory[key] || null;
  }, null);

  return resolveAvatarUrl({
    avatar_url: profile?.avatar_url ?? person.avatar_url ?? null,
    avatar: person.avatar ?? null,
    gender: profile?.gender ?? person.gender ?? null,
    employee_id: profile?.employee_id ?? person.employee_id ?? null,
    employeeId: profile?.id ?? person.employeeId ?? null,
    email: profile?.email ?? person.email ?? null,
    full_name: profile?.full_name ?? person.full_name ?? person.name ?? null,
    name: person.name ?? profile?.full_name ?? null,
    id: person.id ?? profile?.id ?? null,
  });
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border border-primary bg-primary text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-400'}`}
      />
      {label}
    </button>
  );
}

function LeaveSection() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTimeOffRequests(
        filter === 'all' ? undefined : filter
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    const reviewNotes =
      status === 'rejected'
        ? prompt('Add a rejection note (optional):') || undefined
        : undefined;
    setActionLoading(id);
    try {
      const result = await reviewTimeOffRequest(id, status, reviewNotes);
      if (!result.success) {
        toast.error(result.error || 'Update failed');
      } else {
        toast.success(`Leave ${status}`);
        fetchRequests();
      }
    } catch (error) {
      console.error('Leave update failed:', error);
      toast.error('Update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const formatRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return '—';
    if (start && end) return `${start} → ${end}`;
    return start || end || '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Leave requests
          </h3>
          <p className="text-sm text-slate-500">
            Review and approve employee leave requests.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
          <Button
            key={item}
            variant={filter === item ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(item)}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading leave requests...
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="p-6 text-center text-sm text-slate-500">
            No leave requests found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="rounded-xl border border-border/40 bg-white shadow-sm"
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {request.employeeName || 'Employee'} ·{' '}
                      {request.department || '—'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {request.type || 'Leave'} ·{' '}
                      {formatRange(request.startDate, request.endDate)}
                    </div>
                  </div>
                  <Badge
                    className={`${statusStyles[request.status] || 'border-border/40 bg-slate-100 text-slate-600'}`}
                  >
                    {request.status || 'pending'}
                  </Badge>
                </div>

                {request.notes && (
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                    {request.notes}
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReview(request.id, 'approved')}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? 'Updating...' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(request.id, 'rejected')}
                      disabled={actionLoading === request.id}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Employees Section - Comprehensive view of all employees with Aura scores
function EmployeesSection() {
  const [employees, setEmployees] = useState<EmployeeWithAura[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithAura | null>(null);
  const [employeeCerts, setEmployeeCerts] = useState<TrainingRecord[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee?.id) {
      fetchEmployeeCertificates(selectedEmployee.id);
    }
  }, [selectedEmployee?.id]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Use server action to fetch employees with AURA scores
      const data = await getAllEmployeesWithAura();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeCertificates = async (employeeId: string) => {
    try {
      const data = await getCertificates();
      const records = Array.isArray(data) ? data : [];
      setEmployeeCerts(
        records.filter((cert) => String(cert.employeeId) === employeeId)
      );
    } catch (error) {
      console.error('Error fetching employee certificates:', error);
      setEmployeeCerts([]);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-emerald-700 bg-emerald-50';
    if (score >= 3.5) return 'text-blue-700 bg-blue-50';
    if (score >= 2.5) return 'text-amber-700 bg-amber-50';
    return 'text-rose-700 bg-rose-50';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 4.5)
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 3.5) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 2.5) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const PillarBar = ({
    label,
    score,
    icon: Icon,
    color,
  }: {
    label: string;
    score: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }) => (
    <div className="flex items-center gap-3">
      <div className={`rounded-lg p-1.5 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex justify-between text-[11px]">
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-800">
            {score?.toFixed(1) || '—'}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${score >= 4.5 ? 'bg-emerald-500' : score >= 3.5 ? 'bg-blue-500' : score >= 2.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            All Employees
          </h2>
          <p className="text-xs text-slate-500">
            View Aura scores, pillar breakdown, and certifications
          </p>
        </div>
        <div className="relative w-full max-w-md md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search employees..."
            className="h-9 bg-white pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Total Employees"
          value={employees.length.toString()}
          icon={Users}
          color="text-indigo-500"
          bg="bg-indigo-50"
        />
        <SummaryCard
          title="Avg. Aura Score"
          value={(
            employees.reduce((acc, e) => acc + (e.aura_score || 0), 0) /
            (employees.length || 1)
          ).toFixed(2)}
          icon={Zap}
          color="text-amber-500"
          bg="bg-amber-50"
        />
        <SummaryCard
          title="High Performers"
          value={employees.filter((e) => e.aura_score >= 4.0).length.toString()}
          icon={Star}
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
        <SummaryCard
          title="Need Attention"
          value={employees.filter((e) => e.aura_score < 3.0).length.toString()}
          icon={AlertTriangle}
          color="text-rose-500"
          bg="bg-rose-50"
        />
      </div>

      {/* Employee Table */}
      <Card className="overflow-hidden rounded-xl border-border/40 bg-white shadow-sm">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-base font-semibold">
            Employee Performance Overview
          </CardTitle>
          <CardDescription>
            Click on an employee to see a detailed breakdown.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p>No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border/40 bg-slate-50/60 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-2.5">Employee</th>
                    <th className="px-6 py-2.5">Role</th>
                    <th className="px-6 py-2.5 text-center">Aura Score</th>
                    <th className="px-6 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Zap className="h-3 w-3" /> Tech
                      </div>
                    </th>
                    <th className="px-6 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Heart className="h-3 w-3" /> Behav
                      </div>
                    </th>
                    <th className="px-6 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Sparkles className="h-3 w-3" /> Culture
                      </div>
                    </th>
                    <th className="px-6 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Brain className="h-3 w-3" /> Growth
                      </div>
                    </th>
                    <th className="px-6 py-2.5 text-center">Certs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="cursor-pointer transition-colors hover:bg-slate-50/50"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={resolveAvatarUrl(emp)} />
                            <AvatarFallback className="bg-indigo-50 text-xs text-indigo-600">
                              {emp.full_name?.substring(0, 2).toUpperCase() ||
                                '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {emp.full_name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-700">
                          {emp.role || '—'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {emp.department}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge
                          className={`px-2.5 py-0.5 text-xs font-semibold ${getScoreBadgeColor(emp.aura_score)}`}
                        >
                          {emp.aura_score != null
                            ? emp.aura_score.toFixed(2)
                            : '—'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex h-6 w-9 items-center justify-center rounded text-xs font-medium ${getScoreColor(emp.technical_score)}`}
                        >
                          {emp.technical_score?.toFixed(1) || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex h-6 w-9 items-center justify-center rounded text-xs font-medium ${getScoreColor(emp.behavioral_score)}`}
                        >
                          {emp.behavioral_score?.toFixed(1) || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex h-6 w-9 items-center justify-center rounded text-xs font-medium ${getScoreColor(emp.culture_score)}`}
                        >
                          {emp.culture_score?.toFixed(1) || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex h-6 w-9 items-center justify-center rounded text-xs font-medium ${getScoreColor(emp.growth_score)}`}
                        >
                          {emp.growth_score?.toFixed(1) || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge variant="outline" className="text-xs">
                          <FileCheck className="mr-1 h-3 w-3" />
                          {emp.certificates_count || 0}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative border-b border-slate-100 p-6">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-border/40">
                  <AvatarImage src={resolveAvatarUrl(selectedEmployee)} />
                  <AvatarFallback className="bg-slate-100 text-lg text-slate-700">
                    {selectedEmployee.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedEmployee.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedEmployee.role} • {selectedEmployee.department}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-slate-50 px-4 py-3">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      {selectedEmployee.aura_score != null
                        ? selectedEmployee.aura_score.toFixed(2)
                        : '—'}
                    </div>
                    <div className="text-xs text-slate-500">Aura Score</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-slate-50 px-4 py-3">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      {employeeCerts.length}
                    </div>
                    <div className="text-xs text-slate-500">Certificates</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 p-6">
              {/* Pillar Breakdown */}
              <div>
                <h4 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Pillar Breakdown (25% each)
                </h4>
                <div className="grid gap-4">
                  <PillarBar
                    label="Technical"
                    score={selectedEmployee.technical_score}
                    icon={Zap}
                    color="bg-slate-100 text-slate-600"
                  />
                  <PillarBar
                    label="Behavioral"
                    score={selectedEmployee.behavioral_score}
                    icon={Heart}
                    color="bg-slate-100 text-slate-600"
                  />
                  <PillarBar
                    label="Culture Fit"
                    score={selectedEmployee.culture_score}
                    icon={Sparkles}
                    color="bg-slate-100 text-slate-600"
                  />
                  <PillarBar
                    label="Growth & Learning"
                    score={selectedEmployee.growth_score}
                    icon={Brain}
                    color="bg-slate-100 text-slate-600"
                  />
                </div>
              </div>

              {/* Certificates */}
              <div>
                <h4 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                  <Award className="h-4 w-4 text-indigo-500" />
                  Training Certificates
                </h4>
                {employeeCerts.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
                    No certificates uploaded yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employeeCerts.map((cert) => {
                      const status = (cert.status || '').toLowerCase();
                      const certificateName =
                        cert.certificateName || 'Certificate';
                      const quarterLabel = cert.quarter || '';
                      const yearLabel = cert.year ? ` ${cert.year}` : '';

                      return (
                        <div
                          key={cert.id}
                          className="flex items-center justify-between rounded-lg border border-border/40 bg-white p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-slate-100 p-2">
                              {status === 'approved' ? (
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              ) : status === 'pending' ? (
                                <Clock className="h-4 w-4 text-amber-600" />
                              ) : (
                                <X className="h-4 w-4 text-rose-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {certificateName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {quarterLabel || yearLabel
                                  ? `${quarterLabel}${yearLabel}`
                                  : '—'}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={
                              status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : status === 'pending'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                            }
                          >
                            {status || 'pending'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                    Status
                  </div>
                  <Badge
                    className={
                      selectedEmployee.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }
                  >
                    {selectedEmployee.status === 'active'
                      ? 'Active'
                      : 'Inactive'}
                  </Badge>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                    Performance Tier
                  </div>
                  <div className="font-semibold text-slate-900">
                    {selectedEmployee.aura_score >= 4.5
                      ? '🏆 Exceptional'
                      : selectedEmployee.aura_score >= 4.0
                        ? '⭐ High Performer'
                        : selectedEmployee.aura_score >= 3.5
                          ? '👍 Good Standing'
                          : selectedEmployee.aura_score >= 3.0
                            ? '📈 Developing'
                            : '⚠️ Needs Attention'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProbationSection() {
  const [probations, setProbations] = useState<ProbationRecord[]>([]);
  const [stats, setStats] = useState({
    onProbation: 0,
    dueForConfirmation: 0,
    atRisk: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const employeeDirectory = useEmployeeDirectory();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [probData, statsData] = await Promise.all([
        getProbations(),
        getProbationStats(),
      ]);
      setProbations(probData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching probation data:', error);
      toast.error('Failed to load probation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirm = async (probationId: string) => {
    setActionLoading(probationId);
    try {
      const result = await confirmProbation(probationId);
      if (result.success) {
        toast.success('Employee confirmed!');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to confirm');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (record: ProbationRecord) => {
    if (record.isOverdue) {
      return (
        <Badge className="border-rose-200 bg-rose-100 text-rose-700">
          Overdue
        </Badge>
      );
    }
    if (record.isDueForConfirmation) {
      return (
        <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700">
          Due for Confirmation
        </Badge>
      );
    }
    if (record.isInGracePeriod) {
      return (
        <Badge className="border-amber-200 bg-amber-100 text-amber-700">
          Grace Period
        </Badge>
      );
    }
    switch (record.status) {
      case 'confirmed':
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-700">
            Pending
          </Badge>
        );
      case 'extension_1':
      case 'extension_2':
        return (
          <Badge className="border-amber-200 bg-amber-100 text-amber-700">
            Extended
          </Badge>
        );
      case 'terminated':
        return (
          <Badge className="border-rose-200 bg-rose-100 text-rose-700">
            Terminated
          </Badge>
        );
      default:
        return <Badge variant="secondary">{record.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="On Probation"
          value={stats.onProbation.toString()}
          icon={Users}
          color="text-blue-500"
          bg="bg-blue-50"
        />
        <SummaryCard
          title="Due for Confirmation"
          value={stats.dueForConfirmation.toString()}
          icon={UserCheck}
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
        <SummaryCard
          title="At Risk (<50%)"
          value={stats.atRisk.toString()}
          icon={AlertTriangle}
          color="text-amber-500"
          bg="bg-amber-50"
        />
        <SummaryCard
          title="Overdue"
          value={stats.overdue.toString()}
          icon={Clock}
          color="text-rose-500"
          bg="bg-rose-50"
        />
      </div>

      <Card className="overflow-hidden rounded-xl border-border/40 bg-white shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-basex text-slate-900">
                Probation Tracker
              </CardTitle>
              <CardDescription className="text-slate-500">
                Monitor new hires and confirmation timelines.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={fetchData}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              />{' '}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : probations.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <UserCheck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p>No employees on probation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border/40 bg-slate-50/60 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Timeline</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Policy Recommendation</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {probations.map((record) => (
                    <tr
                      key={record.id}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={resolveDirectoryAvatar(
                                {
                                  employeeId: record.employeeId,
                                  name: record.employeeName,
                                  email: record.employeeEmail,
                                },
                                employeeDirectory
                              )}
                            />
                            <AvatarFallback className="bg-indigo-50 text-xs text-indigo-600">
                              {record.employeeName
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{record.employeeName}</div>
                            <div className="text-xs text-slate-400">
                              {record.employeeEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {record.employeeRole || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        <div>
                          Start:{' '}
                          {new Date(record.startDate).toLocaleDateString()}
                        </div>
                        <div className="mt-0.5 text-slate-400">
                          End: {new Date(record.endDate).toLocaleDateString()}
                        </div>
                        <div
                          className={`mt-1 font-medium ${record.isDueForConfirmation ? 'text-indigo-600' : record.daysRemaining < 0 ? 'text-rose-600' : record.daysRemaining < 14 ? 'text-amber-600' : 'text-slate-500'}`}
                        >
                          {record.isDueForConfirmation
                            ? 'Due for confirmation'
                            : record.daysRemaining < 0
                              ? `${Math.abs(record.daysRemaining)} days overdue`
                              : `${record.daysRemaining} days left`}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          variant="secondary"
                          className={`${(record.score || 0) < 50 ? 'bg-rose-50 text-rose-700' : (record.score || 0) >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} border-0 font-semibold`}
                        >
                          {record.score != null ? `${record.score}%` : '—'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="max-w-[180px] text-xs text-slate-600">
                          {record.policyRecommendation || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">{getStatusBadge(record)}</td>
                      <td className="px-6 py-3.5 text-right">
                        {record.status === 'pending' &&
                          (record.score || 0) >= 70 && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs"
                              onClick={() => handleConfirm(record.id)}
                              disabled={actionLoading === record.id}
                            >
                              {actionLoading === record.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="mr-1 h-3.5 w-3.5" />{' '}
                                  Confirm
                                </>
                              )}
                            </Button>
                          )}
                        {record.status !== 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* <div className="bg-slate-50/70 border border-border/40 rounded-xl p-4 flex gap-3 text-sm text-slate-700">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                <div className="space-y-1">
                    <p className="font-semibold text-slate-900">Confirmation Deadline Policy</p>
                    <p className="text-slate-600">Failure to complete confirmation within a 4-week grace period results in delayed salary and forfeiture of shared company benefits.</p>
                </div>
            </div> */}
    </div>
  );
}

function StructureSection() {
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [structureData, setStructureData] = useState<GradeLevel[]>([]);
  const [jobLevelsData, setJobLevelsData] = useState<JobLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const employeeDirectory = useEmployeeDirectory();

  // Fetch structure data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [structure, jobLevels] = await Promise.all([
          getOrganizationalStructure(),
          getJobLevels(),
        ]);
        setStructureData(structure);
        setJobLevelsData(jobLevels);
      } catch (error) {
        console.error('Error fetching structure data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeGradeStyles = 'bg-primary text-primary-foreground border-primary';

  // Find the currently selected grade object
  const currentGrade = structureData.find((g) => g.grade === selectedGrade);

  // Get job levels for the selected grade
  const gradeJobLevels = jobLevelsData.filter(
    (jl) => jl.grade === selectedGrade
  );

  // Filter out system admins from the employee list
  const filterEmployees = (employees: Employee[]) => {
    return employees.filter((emp) => {
      const lowerName = emp.name?.toLowerCase() || '';
      const lowerRole = emp.role?.toLowerCase() || '';
      // Filter out system administrators
      return (
        !lowerName.includes('schoolable admin') &&
        !lowerName.includes('system admin') &&
        !lowerRole.includes('system administrator') &&
        !lowerRole.includes('super admin')
      );
    });
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[320px_1fr]">
          {/* Left Column: Grade Navigation */}
          <div className="space-y-4">
            <div className="px-1">
              <h3 className="font-semibold text-slate-900">
                Organizational Structure
              </h3>
              <p className="text-xs text-slate-500">
                Select a grade to view employees and job levels.
              </p>
            </div>

            <div className="space-y-3">
              {structureData.map((g) => (
                <button
                  key={g.grade}
                  onClick={() => setSelectedGrade(g.grade)}
                  className={`relative flex w-full flex-col items-center rounded-xl border p-4 text-center transition-all duration-200 ${
                    selectedGrade === g.grade
                      ? `${activeGradeStyles} shadow-sm ring-1 ring-primary/20`
                      : 'border-border/40 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-70">
                    Grade {g.grade}
                  </div>
                  <div className="text-sm font-semibold">{g.title}</div>
                  <div className="mt-1 text-xs opacity-60">
                    {g.count} employees
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Grade Detail with Employees */}
          <div className="min-h-[500px] space-y-6">
            <Card className="h-full content-start overflow-hidden rounded-xl border-border/40 bg-white shadow-sm">
              <CardHeader className="border-b border-border/40 bg-slate-50/50 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      {currentGrade?.title ?? 'Grade'}
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        Grade {selectedGrade}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {currentGrade?.roles || 'View employees in this grade'}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-slate-800">
                      {currentGrade?.count || 0}
                    </div>
                    <div className="text-xs text-slate-500">employees</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Job Levels in this grade */}
                {gradeJobLevels.length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Briefcase className="h-4 w-4" />
                      Job Levels
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {gradeJobLevels.map((jl) => (
                        <div
                          key={jl.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                        >
                          <div className="font-medium text-slate-800">
                            {jl.title}
                          </div>
                          <div className="text-slate-500">
                            Level {jl.levelNumber} • {jl.minYearsExperience}+
                            yrs exp
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employees in this grade */}
                {currentGrade?.employees &&
                filterEmployees(currentGrade.employees).length > 0 ? (
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Users className="h-4 w-4" />
                      Employees (
                      {filterEmployees(currentGrade.employees).length})
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filterEmployees(currentGrade.employees)
                        .slice(0, 12)
                        .map((emp) => (
                          <div
                            key={emp.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <Avatar className="h-10 w-10 ring-2 ring-white">
                              <AvatarImage
                                src={resolveDirectoryAvatar(
                                  {
                                    avatar: emp.avatar,
                                    employeeId: emp.employeeId,
                                    email: emp.email,
                                    name: emp.name,
                                    gender: emp.gender,
                                    id: emp.id,
                                  },
                                  employeeDirectory
                                )}
                              />
                              <AvatarFallback className="bg-indigo-50 text-xs text-indigo-700">
                                {emp.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-slate-700">
                                {emp.name}
                              </div>
                              <div className="truncate text-xs text-slate-400">
                                {emp.role || emp.department}
                              </div>
                            </div>
                            {emp.isTeamLead && (
                              <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                            )}
                          </div>
                        ))}
                      {filterEmployees(currentGrade.employees).length > 12 && (
                        <div className="flex items-center justify-center rounded-lg border border-dashed border-border/40 p-3 text-xs text-slate-400">
                          +{filterEmployees(currentGrade.employees).length - 12}{' '}
                          more employees...
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center text-slate-400">
                    <Users className="mb-3 h-10 w-10 opacity-20" />
                    <p>No employees found in this grade</p>
                    <p className="mt-1 text-xs">
                      Employees will appear here once assigned to this grade
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function PromotionSection() {
  const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);
  const [thresholds, setThresholds] = useState<PromotionThresholds | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const employeeDirectory = useEmployeeDirectory();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesData, thresholdsData] = await Promise.all([
          getPromotionEligibility(),
          getPromotionThresholds(),
        ]);
        setCandidates(candidatesData);
        setThresholds(thresholdsData);
      } catch (error) {
        console.error('Error fetching promotion data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fast-track':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'vertical':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'horizontal':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'immediate review':
      case 'recommended':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'eligible':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Threshold Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-border/40 bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Vertical Move
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {thresholds
                    ? thresholds.vertical.cgpaThreshold.toFixed(2)
                    : '—'}{' '}
                  <span className="text-sm font-medium text-slate-500">
                    CGPA
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Requirement: No quarter &lt;{' '}
                  {thresholds
                    ? thresholds.vertical.quarterlyMin.toFixed(2)
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/40 bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Fast-Track
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {thresholds
                    ? thresholds.fastTrack.cgpaThreshold.toFixed(2)
                    : '—'}{' '}
                  <span className="text-sm font-medium text-slate-500">
                    CGPA
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Requirement:{' '}
                  {thresholds ? thresholds.fastTrack.consecutiveQuarters : '—'}{' '}
                  consecutive quarters
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/40 bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Horizontal Move
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {thresholds
                    ? thresholds.horizontal.cgpaThreshold.toFixed(2)
                    : '—'}{' '}
                  <span className="text-sm font-medium text-slate-500">
                    CGPA
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Scope change, same level
                </p>
              </div>
              <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-xl border-border/40 bg-white shadow-sm">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-base font-semibold text-slate-900">
            Promotion Eligibility
          </CardTitle>
          <CardDescription className="text-slate-500">
            Staff qualifying based on Annual CGPA and policy thresholds.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <TrendingUp className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p>No employees eligible for promotion at this time</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border/40 bg-slate-50/60 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Current Role</th>
                    <th className="px-6 py-3">Target Role</th>
                    <th className="px-6 py-3">CGPA</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={resolveDirectoryAvatar(
                                { id: p.id, name: p.name, email: p.email },
                                employeeDirectory
                              )}
                            />
                            <AvatarFallback className="bg-indigo-50 text-xs text-indigo-600">
                              {p.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{p.name}</div>
                            <div className="text-xs text-slate-400">
                              {p.department || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        <div>{p.currentTitle || p.role}</div>
                        <div className="text-xs text-slate-400">
                          Level {p.currentLevel}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-600">
                        <div>{p.targetTitle}</div>
                        <div className="text-xs text-slate-400">
                          Level {p.targetLevel}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">
                        {p.cgpa.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          variant="outline"
                          className={`font-normal ${getTypeColor(p.promotionType)}`}
                        >
                          {p.promotionType}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(p.status)}`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PIPSection() {
  const [pips, setPips] = useState<PipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const employeeDirectory = useEmployeeDirectory();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getPips();
        setPips(data);
      } catch (error) {
        console.error('Error fetching PIP data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (pip: PipRecord) => {
    if (pip.isOverdue) {
      return (
        <Badge className="border-rose-200 bg-rose-100 text-rose-700">
          Overdue
        </Badge>
      );
    }
    switch (pip.status) {
      case 'active':
        return (
          <Badge className="border-amber-200 bg-amber-100 text-amber-700">
            Active
          </Badge>
        );
      case 'completed_success':
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
            Completed
          </Badge>
        );
      case 'completed_fail':
        return (
          <Badge className="border-rose-200 bg-rose-100 text-rose-700">
            Failed
          </Badge>
        );
      case 'terminated':
        return (
          <Badge className="border-rose-200 bg-rose-100 text-rose-700">
            Terminated
          </Badge>
        );
      default:
        return <Badge variant="secondary">{pip.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border border-border/40 bg-slate-50/70 p-5 shadow-sm">
        <div className="shrink-0 rounded-full border border-border/40 bg-white p-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Immediate Action Required
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Employees performing below{' '}
            <span className="font-semibold underline">50%</span> must be placed
            on PIP immediately. The plan must not exceed{' '}
            <span className="font-semibold">3 months</span>. Unsatisfactory
            performance after PIP conclusion leads to termination.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Active PIPs"
          value={pips.filter((p) => p.status === 'active').length.toString()}
          icon={Shield}
          color="text-amber-500"
          bg="bg-amber-50"
        />
        <SummaryCard
          title="At Risk"
          value={pips
            .filter((p) => p.isOverdue || p.weeksRemaining <= 2)
            .length.toString()}
          icon={AlertTriangle}
          color="text-rose-500"
          bg="bg-rose-50"
        />
        <SummaryCard
          title="Completed"
          value={pips
            .filter((p) => p.status.startsWith('completed'))
            .length.toString()}
          icon={CheckCircle}
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
      </div>

      <Card className="overflow-hidden rounded-xl border-border/40 bg-white shadow-sm">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-base font-semibold">
            Active Performance Improvement Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : pips.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Shield className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p>No active PIPs at this time</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border/40 bg-slate-50/60 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Timeline</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Progress</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pips.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={resolveDirectoryAvatar(
                                {
                                  employeeId: p.employeeId,
                                  name: p.employeeName,
                                  email: p.employeeEmail,
                                },
                                employeeDirectory
                              )}
                            />
                            <AvatarFallback className="bg-rose-50 text-xs text-rose-600">
                              {p.employeeName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {p.employeeName}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {p.employeeRole || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        <div className="font-medium text-rose-600">
                          Placed: {new Date(p.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-slate-400">
                          End: {new Date(p.endDate).toLocaleDateString()}
                        </div>
                        <div
                          className={`mt-1 font-medium ${p.isOverdue ? 'text-rose-600' : p.daysRemaining < 14 ? 'text-amber-600' : 'text-slate-500'}`}
                        >
                          {p.isOverdue
                            ? `${p.overdueDays ?? 0} days overdue`
                            : `${p.weeksRemaining} weeks left`}
                        </div>
                      </td>
                      <td className="max-w-[200px] px-6 py-3.5 font-medium text-rose-600">
                        <div>{p.triggerReason}</div>
                        {p.triggerScore && (
                          <div className="mt-1 text-xs text-slate-400">
                            Score: {p.triggerScore}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all ${p.progressPercentage >= 70 ? 'bg-emerald-500' : p.progressPercentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${p.progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {p.progressPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">{getStatusBadge(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamLeadSection() {
  const [leads, setLeads] = useState<TeamLead[]>([]);
  const [pending, setPending] = useState<TeamLead[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithAura[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [teamName, setTeamName] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [activeLeads, pendingRequests, allEmployees] = await Promise.all([
        getTeamLeads(),
        getPendingTeamLeadRequests(),
        getAllEmployeesWithAura(),
      ]);
      setLeads(activeLeads);
      setPending(pendingRequests);
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error fetching team leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (
    employeeId: string,
    department?: string | null
  ) => {
    setActionLoading(employeeId);
    try {
      const result = await approveTeamLeadRequest(
        employeeId,
        department || teamName || undefined
      );
      if (result.success) {
        toast.success('Team lead request approved');
        fetchData();
      } else {
        toast.error(result.error || 'Approval failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (employeeId: string) => {
    const reason = prompt('Provide rejection reason (optional):');
    setActionLoading(employeeId);
    try {
      const result = await rejectTeamLeadRequest(
        employeeId,
        reason || undefined
      );
      if (result.success) {
        toast.success('Team lead request rejected');
        fetchData();
      } else {
        toast.error(result.error || 'Rejection failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAppointment = async () => {
    if (!selectedEmployeeId) {
      toast.error('Select an employee to appoint');
      return;
    }
    if (!teamName.trim()) {
      toast.error('Provide a team name');
      return;
    }

    setActionLoading(selectedEmployeeId);
    try {
      const result = await appointTeamLead(selectedEmployeeId, teamName.trim());
      if (result.success) {
        toast.success('Team lead appointed');
        setSelectedEmployeeId('');
        setTeamName('');
        fetchData();
      } else {
        console.error('Team lead appointment failed:', result);
        toast.error(result.error || 'Appointment failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveLead = async (employeeId: string, name?: string | null) => {
    const confirmed = window.confirm(
      `Remove ${name || 'this team lead'} from their role?`
    );
    if (!confirmed) return;
    const reason = prompt('Reason for removal (optional):') || undefined;

    setActionLoading(employeeId);
    try {
      const result = await removeTeamLead(employeeId, reason);
      if (result.success) {
        toast.success('Team lead removed');
        fetchData();
      } else {
        toast.error(result.error || 'Removal failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const excludedIds = new Set([
    ...leads.map((l) => l.id),
    ...pending.map((p) => p.id),
  ]);
  const availableEmployees = employees.filter((e) => {
    const role = (e.role || '').toLowerCase();
    const isAdmin = [
      'admin',
      'super_admin',
      'super admin',
      'superadmin',
    ].includes(role);
    return !excludedIds.has(e.id) && !isAdmin;
  });

  const employeeDirectory = useMemo(
    () => buildEmployeeDirectory(employees),
    [employees]
  );

  const resolveLeadAvatar = (lead: TeamLead) =>
    resolveDirectoryAvatar(
      {
        employeeId: lead.employeeId,
        id: lead.id,
        name: lead.name,
        email: lead.email,
        gender: lead.gender,
      },
      employeeDirectory
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Crown className="h-4 w-4 text-indigo-500" />
            Team Leads
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage approvals, appointments, and leadership performance.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="min-w-[90px] rounded-lg border border-border/40 bg-white px-4 py-2 text-center">
            <div className="text-lg font-semibold text-slate-900">
              {leads.length}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">
              Active Leads
            </div>
          </div>
          <div className="min-w-[90px] rounded-lg border border-border/40 bg-white px-4 py-2 text-center">
            <div className="text-lg font-semibold text-slate-900">
              {pending.length}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">
              Pending Requests
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-xl border-border/40 bg-white shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Award className="h-4 w-4 text-indigo-500" />
                    Active Team Leads
                  </CardTitle>
                  <CardDescription>
                    Leadership roster with team context and performance signals.
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="border-border/40 bg-slate-100 text-slate-600"
                >
                  {leads.length} leads
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : leads.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Award className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p>No team leads appointed yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-y border-border/40 bg-slate-50/60 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Team Lead</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Team</th>
                        <th className="px-6 py-3 text-center">Reports</th>
                        <th className="px-6 py-3 text-center">Perf. Cycles</th>
                        <th className="px-6 py-3 text-center">Team Score</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((t) => {
                        return (
                          <tr
                            key={t.id}
                            className="transition-colors hover:bg-slate-50/50"
                          >
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={resolveLeadAvatar(t)} />
                                  <AvatarFallback className="bg-indigo-50 text-xs text-indigo-600">
                                    {t.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-slate-900">
                                    {t.name}
                                  </div>
                                  <div className="truncate text-xs text-slate-500">
                                    {t.email || '—'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="font-medium text-slate-700">
                                {t.role || 'Team Lead'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {t.department || '—'}
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="font-medium text-slate-700">
                                {t.teamName || '—'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {t.department || 'Team'}
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-center font-medium text-slate-700">
                              {t.teamSize || 0}
                            </td>
                            <td className="px-6 py-3.5 text-center font-medium text-slate-700">
                              {t.reviewCycles || 0}
                            </td>
                            <td className="px-6 py-3.5 text-center font-medium text-slate-700">
                              {t.teamScore != null
                                ? `${t.teamScore.toFixed(1)}%`
                                : '—'}
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-border/40 text-xs text-slate-600 hover:bg-slate-50"
                                onClick={() => handleRemoveLead(t.id, t.name)}
                                disabled={actionLoading === t.id}
                              >
                                {actionLoading === t.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserMinus className="mr-1 h-3.5 w-3.5" />
                                )}
                                Remove
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-xl border-border/40 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Appoint Team Lead
              </CardTitle>
              <CardDescription>
                Select an employee and assign a team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">
                  Employee
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(event) =>
                    setSelectedEmployeeId(event.target.value)
                  }
                  className="w-full rounded-md border border-border/40 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">Select employee</option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name || employee.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">
                  Team Name
                </label>
                <Input
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="e.g. Sales Team"
                />
              </div>
              <Button
                onClick={handleAppointment}
                className="w-full gap-2"
                disabled={actionLoading === selectedEmployeeId}
              >
                {actionLoading === selectedEmployeeId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Appoint Team Lead
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/40 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Pending Requests
              </CardTitle>
              <CardDescription>
                Approve or reject team lead requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : pending.length === 0 ? (
                <p className="text-sm text-slate-500">No pending requests.</p>
              ) : (
                pending.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={resolveLeadAvatar(request)} />
                        <AvatarFallback className="bg-indigo-50 text-xs text-indigo-600">
                          {request.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {request.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {request.department || 'No team yet'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border/40 text-xs text-slate-600 hover:bg-slate-50"
                        onClick={() => handleReject(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                        onClick={() =>
                          handleApprove(request.id, request.department)
                        }
                        disabled={actionLoading === request.id}
                      >
                        {actionLoading === request.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Approve'
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TeamsSection() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Team name is required');
      return;
    }
    setActionLoading(true);
    try {
      const result = await createTeam(
        name.trim(),
        description.trim() || undefined
      );
      if (result.success) {
        toast.success('Team created successfully');
        setName('');
        setDescription('');
        fetchData();
      } else {
        console.error('Team creation failed:', result);
        toast.error(result.error || 'Failed to create team');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Building2 className="h-4 w-4 text-indigo-500" />
            Teams Directory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage teams across the organization.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="border-border/40 bg-slate-100 text-slate-600"
        >
          {teams.length} teams
        </Badge>
      </div>

      <Card className="rounded-xl border-border/40 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Create Team</CardTitle>
          <CardDescription>
            Add a new team to the organization directory.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Team Name
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Growth Team"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Description
            </label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={handleCreate}
              className="gap-2"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Team
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/40 bg-white shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-semibold">All Teams</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : teams.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Building2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p>No teams found yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border/40 bg-slate-50/60 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Team</th>
                    <th className="px-6 py-3">Members</th>
                    {/* <th className="px-6 py-3">Source</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teams.map((team) => (
                    <tr
                      key={team.id}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {team.name}
                        </div>
                        {team.description && (
                          <div className="text-xs text-slate-500">
                            {team.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {team.memberCount} members
                      </td>
                      {/* <td className="px-6 py-3.5">
                                                {team.managed ? (
                                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Managed</Badge>
                                                ) : (
                                                    <Badge className="bg-slate-100 text-slate-600 border-border/40">Directory</Badge>
                                                )}
                                            </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Certificates Section for admin approval workflow
function CertificatesSection() {
  const [certificates, setCertificates] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [employeeDirectory, setEmployeeDirectory] = useState<
    Record<string, EmployeeWithAura>
  >({});

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const [certificateResult, employeeResult] = await Promise.allSettled([
        getCertificates(),
        getAllEmployeesWithAura(),
      ]);

      if (certificateResult.status === 'fulfilled') {
        const data = certificateResult.value;
        setCertificates(Array.isArray(data) ? data : []);
      } else {
        console.error('Error fetching certificates:', certificateResult.reason);
        setCertificates([]);
      }

      if (employeeResult.status === 'fulfilled') {
        const directory: Record<string, EmployeeWithAura> = {};
        (Array.isArray(employeeResult.value)
          ? employeeResult.value
          : []
        ).forEach((emp) => {
          directory[String(emp.id)] = emp;
        });
        setEmployeeDirectory(directory);
      } else {
        console.error(
          'Error fetching employees for avatars:',
          employeeResult.reason
        );
        setEmployeeDirectory({});
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
      setEmployeeDirectory({});
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const result = await reviewCertificate(id, 'approved');
      if (!result.success) {
        toast.error(result.error || 'Approval failed');
      } else {
        toast.success('Certificate approved');
      }
      fetchCertificates();
    } catch (e) {
      console.error('Approval failed', e);
      toast.error('Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setActionLoading(id);
    try {
      const result = await reviewCertificate(id, 'rejected', reason);
      if (!result.success) {
        toast.error(result.error || 'Rejection failed');
      } else {
        toast.success('Certificate rejected');
      }
      fetchCertificates();
    } catch (e) {
      console.error('Rejection failed', e);
      toast.error('Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const normalizeStatus = (status?: string | null) =>
    (status || '').toLowerCase();

  const formatQuarterLabel = (quarter: string | null, year: number | null) => {
    if (quarter && year) return `${quarter} ${year}`;
    if (quarter) return quarter;
    if (year) return year.toString();
    return '—';
  };

  const getStatusBadge = (status?: string | null) => {
    switch (normalizeStatus(status)) {
      case 'approved':
        return (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="border-rose-200 bg-rose-50 text-rose-700">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const filteredCertificates =
    filter === 'all'
      ? certificates
      : certificates.filter((c) => normalizeStatus(c.status) === filter);
  const pendingCount = certificates.filter(
    (c) => normalizeStatus(c.status) === 'pending'
  ).length;

  const resolveCertificateAvatar = (
    employeeId?: string | null,
    employeeName?: string | null
  ) => {
    const profile = employeeId
      ? employeeDirectory[String(employeeId)]
      : undefined;
    return resolveAvatarUrl({
      avatar_url: profile?.avatar_url ?? null,
      gender: profile?.gender ?? null,
      employee_id: profile?.employee_id ?? null,
      employeeId: profile?.id ?? employeeId ?? null,
      email: profile?.email ?? null,
      full_name: profile?.full_name ?? employeeName ?? null,
      name: employeeName ?? profile?.full_name ?? null,
      id: profile?.id ?? employeeId ?? null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Training Certificates
          </h2>
          <p className="max-w-xl text-xs text-slate-500">
            Review training certificates submitted each quarter. Only approved
            certificates count toward the Growth &amp; Learning pillar (25% of
            Aura Score).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f
                  ? 'border-primary bg-primary text-white'
                  : 'border-border/40 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Pending Approval"
          value={pendingCount.toString()}
          icon={Clock}
          color="text-amber-500"
          bg="bg-amber-50"
        />
        <SummaryCard
          title="Approved This Quarter"
          value={certificates
            .filter((c) => normalizeStatus(c.status) === 'approved')
            .length.toString()}
          icon={CheckCircle}
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
        <SummaryCard
          title="Total Submissions"
          value={certificates.length.toString()}
          icon={FileCheck}
          color="text-indigo-500"
          bg="bg-indigo-50"
        />
      </div>

      {/* Certificates Table */}
      <Card className="overflow-hidden rounded-xl border-border/40 bg-white shadow-sm">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-base font-semibold">
            Training Certificates
          </CardTitle>
          <CardDescription>
            Review and approve employee training certificates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <FileCheck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p>No certificates found</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border/40 bg-slate-50/60 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Certificate</th>
                  <th className="px-6 py-3">Quarter</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCertificates.map((cert) => {
                  const status = normalizeStatus(cert.status);
                  const certificateId = String(cert.id);
                  const certificateName = cert.certificateName || 'Certificate';
                  const fileUrl = cert.fileUrl;
                  const reviewNotes = cert.reviewNotes;
                  const employeeName = cert.employeeName || 'Employee';
                  const employeeDepartment = cert.employeeDepartment;
                  const employeeId = cert.employeeId?.toString();
                  const employeeIdShort = employeeId
                    ? `${employeeId.substring(0, 8)}...`
                    : '—';

                  return (
                    <tr
                      key={certificateId}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={resolveCertificateAvatar(
                                employeeId,
                                employeeName
                              )}
                            />
                            <AvatarFallback className="bg-indigo-50 text-xs text-indigo-600">
                              {(employeeId || employeeName)
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">
                              {employeeName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {employeeDepartment
                                ? `${employeeDepartment} • ${employeeIdShort}`
                                : employeeIdShort}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {certificateName}
                          </span>
                          {fileUrl && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {cert.provider && (
                          <div className="text-xs text-slate-500">
                            {cert.provider}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {formatQuarterLabel(cert.quarter, cert.year)}
                      </td>
                      <td className="px-6 py-3.5">
                        {getStatusBadge(cert.status)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="h-7 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                              onClick={() => handleApprove(certificateId)}
                              disabled={actionLoading === certificateId}
                            >
                              {actionLoading === certificateId ? (
                                <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                              ) : (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-border/40 text-xs text-slate-600 hover:bg-slate-50"
                              onClick={() => handleReject(certificateId)}
                              disabled={actionLoading === certificateId}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {status === 'rejected' && reviewNotes && (
                          <span
                            className="text-xs text-rose-600"
                            title={reviewNotes}
                          >
                            Reason: {reviewNotes.substring(0, 20)}...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- UTILS ---

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <Card className="rounded-xl border-border/40 bg-white shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2.5 ${bg} shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
