'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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
    UserPlus,
    LayoutList,
    Shield,
    Star,
    Crown,
    FileCheck,
    Clock,
    ExternalLink,
    CheckCircle,
    X,
    Search,
    Zap,
    Brain,
    Heart,
    Sparkles,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import {
    getTeamLeads,
    getProbations,
    getProbationStats,
    getPips,
    getPromotionEligibility,
    getPromotionThresholds,
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
} from '@/app/actions/hr-management';
import { toast } from 'sonner';

// All data is now fetched dynamically from the backend API

export default function HRPolicyPage() {
    const [activeTab, setActiveTab] = useState<'employees' | 'probation' | 'structure' | 'promotion' | 'pip' | 'team-leads' | 'certificates'>('employees');

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-medium tracking-tight text-slate-900">HR & Policy Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage staff lifecycle, organizational structure, and performance policies.</p>
                </div>

                {/* Tabs - more pill shaped and detached */}
                <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200/60 overflow-x-auto">
                    <TabButton active={activeTab === 'employees'} onClick={() => setActiveTab('employees')} icon={Users} label="Employees" />
                    <TabButton active={activeTab === 'probation'} onClick={() => setActiveTab('probation')} icon={UserCheck} label="Probation" />
                    <TabButton active={activeTab === 'structure'} onClick={() => setActiveTab('structure')} icon={LayoutList} label="Structure" />
                    <TabButton active={activeTab === 'promotion'} onClick={() => setActiveTab('promotion')} icon={TrendingUp} label="Promotions" />
                    <TabButton active={activeTab === 'pip'} onClick={() => setActiveTab('pip')} icon={Shield} label="PIP" />
                    <TabButton active={activeTab === 'team-leads'} onClick={() => setActiveTab('team-leads')} icon={Award} label="Team Leads" />
                    <TabButton active={activeTab === 'certificates'} onClick={() => setActiveTab('certificates')} icon={FileCheck} label="Certificates" />
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px] animate-in fade-in-50 duration-500">
                {activeTab === 'employees' && <EmployeesSection />}
                {activeTab === 'probation' && <ProbationSection />}
                {activeTab === 'structure' && <StructureSection />}
                {activeTab === 'promotion' && <PromotionSection />}
                {activeTab === 'pip' && <PIPSection />}
                {activeTab === 'team-leads' && <TeamLeadSection />}
                {activeTab === 'certificates' && <CertificatesSection />}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${active
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
        >
            <Icon className={`h-3.5 w-3.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
            {label}
        </button>
    );
}

// Employees Section - Comprehensive view of all employees with Aura scores
function EmployeesSection() {
    const [employees, setEmployees] = useState<EmployeeWithAura[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAura | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [employeeCerts, setEmployeeCerts] = useState<any[]>([]);

    // Helper function to generate avatar URL based on gender
    const getAvatarUrl = (employee: { avatar_url?: string | null; gender?: string | null; employee_id?: string | null; id?: string; email?: string | null }) => {
        if (employee.avatar_url) return employee.avatar_url;
        // Use gender-appropriate dicebear style
        const seed = employee.employee_id || employee.id || employee.email || 'default';
        const style = employee.gender?.toLowerCase() === 'female' ? 'avataaars' : 'bottts';
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
    };

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

    const fetchEmployeeCertificates = async (_employeeId: string) => {
        try {
            // This will be handled by a server action if needed
            setEmployeeCerts([]);
        } catch {
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
        if (score >= 4.5) return 'text-emerald-600 bg-emerald-50';
        if (score >= 3.5) return 'text-blue-600 bg-blue-50';
        if (score >= 2.5) return 'text-amber-600 bg-amber-50';
        return 'text-rose-600 bg-rose-50';
    };

    const getScoreBadgeColor = (score: number) => {
        if (score >= 4.5) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (score >= 3.5) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (score >= 2.5) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-rose-100 text-rose-700 border-rose-200';
    };

    const PillarBar = ({ label, score, icon: Icon, color }: { label: string; score: number; icon: React.ComponentType<{ className?: string }>; color: string }) => (
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${color}`}>
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-800">{score?.toFixed(1) || '—'}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">All Employees</h2>
                    <p className="text-sm text-slate-500">View Aura scores, pillar breakdown, and certifications</p>
                </div>
                <div className="relative max-w-md w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search employees..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <SummaryCard title="Total Employees" value={employees.length.toString()} icon={Users} color="text-indigo-500" bg="bg-indigo-50" />
                <SummaryCard title="Avg. Aura Score" value={(employees.reduce((acc, e) => acc + (e.aura_score || 0), 0) / (employees.length || 1)).toFixed(2)} icon={Zap} color="text-amber-500" bg="bg-amber-50" />
                <SummaryCard title="High Performers" value={employees.filter(e => e.aura_score >= 4.0).length.toString()} icon={Star} color="text-emerald-500" bg="bg-emerald-50" />
                <SummaryCard title="Need Attention" value={employees.filter(e => e.aura_score < 3.0).length.toString()} icon={AlertTriangle} color="text-rose-500" bg="bg-rose-50" />
            </div>

            {/* Employee Table */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">Employee Performance Overview</CardTitle>
                    <CardDescription>Click on an employee to see detailed breakdown</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p>No employees found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3 text-center">Aura Score</th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Zap className="h-3 w-3" /> Tech
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Heart className="h-3 w-3" /> Behav
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Sparkles className="h-3 w-3" /> Culture
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Brain className="h-3 w-3" /> Growth
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center">Certs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredEmployees.map((emp) => (
                                        <tr
                                            key={emp.id}
                                            className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedEmployee(emp)}
                                        >
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={getAvatarUrl(emp)} />
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs">
                                                            {emp.full_name?.substring(0, 2).toUpperCase() || '??'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{emp.full_name}</div>
                                                        <div className="text-xs text-slate-400">{emp.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="font-medium text-slate-700">{emp.role || '—'}</div>
                                                <div className="text-xs text-slate-400">{emp.department}</div>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <Badge className={`text-sm font-semibold px-3 py-1 ${getScoreBadgeColor(emp.aura_score)}`}>
                                                    {emp.aura_score?.toFixed(2) || '—'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-medium ${getScoreColor(emp.technical_score)}`}>
                                                    {emp.technical_score?.toFixed(1) || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-medium ${getScoreColor(emp.behavioral_score)}`}>
                                                    {emp.behavioral_score?.toFixed(1) || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-medium ${getScoreColor(emp.culture_score)}`}>
                                                    {emp.culture_score?.toFixed(1) || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-medium ${getScoreColor(emp.growth_score)}`}>
                                                    {emp.growth_score?.toFixed(1) || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <Badge variant="outline" className="text-xs">
                                                    <FileCheck className="h-3 w-3 mr-1" />
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEmployee(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl text-white relative">
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-4 border-white/30">
                                    <AvatarImage src={getAvatarUrl(selectedEmployee)} />
                                    <AvatarFallback className="bg-white/20 text-white text-lg">
                                        {selectedEmployee.full_name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedEmployee.full_name}</h3>
                                    <p className="text-indigo-100">{selectedEmployee.role} • {selectedEmployee.department}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-amber-300" />
                                    <div>
                                        <div className="text-2xl font-semibold">{selectedEmployee.aura_score?.toFixed(2) || '—'}</div>
                                        <div className="text-xs text-indigo-100">Aura Score</div>
                                    </div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-emerald-300" />
                                    <div>
                                        <div className="text-2xl font-semibold">{employeeCerts.length}</div>
                                        <div className="text-xs text-indigo-100">Certificates</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Pillar Breakdown */}
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-500" />
                                    Pillar Breakdown (25% each)
                                </h4>
                                <div className="grid gap-4">
                                    <PillarBar label="Technical" score={selectedEmployee.technical_score} icon={Zap} color="bg-blue-50 text-blue-600" />
                                    <PillarBar label="Behavioral" score={selectedEmployee.behavioral_score} icon={Heart} color="bg-rose-50 text-rose-600" />
                                    <PillarBar label="Culture Fit" score={selectedEmployee.culture_score} icon={Sparkles} color="bg-purple-50 text-purple-600" />
                                    <PillarBar label="Growth & Learning" score={selectedEmployee.growth_score} icon={Brain} color="bg-emerald-50 text-emerald-600" />
                                </div>
                            </div>

                            {/* Certificates */}
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Award className="h-4 w-4 text-indigo-500" />
                                    Training Certificates
                                </h4>
                                {employeeCerts.length === 0 ? (
                                    <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500 text-sm">
                                        No certificates uploaded yet
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {employeeCerts.map((cert) => (
                                            <div key={cert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${cert.status === 'approved' ? 'bg-emerald-100' : cert.status === 'pending' ? 'bg-amber-100' : 'bg-rose-100'}`}>
                                                        {cert.status === 'approved' ? (
                                                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                        ) : cert.status === 'pending' ? (
                                                            <Clock className="h-4 w-4 text-amber-600" />
                                                        ) : (
                                                            <X className="h-4 w-4 text-rose-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-800">{cert.name}</div>
                                                        <div className="text-xs text-slate-500">{cert.quarter} {cert.year}</div>
                                                    </div>
                                                </div>
                                                <Badge className={cert.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : cert.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}>
                                                    {cert.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                                    <Badge className={selectedEmployee.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                                        {selectedEmployee.status === 'active' ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Performance Tier</div>
                                    <div className="font-semibold text-slate-900">
                                        {selectedEmployee.aura_score >= 4.5 ? '🏆 Exceptional' :
                                            selectedEmployee.aura_score >= 4.0 ? '⭐ High Performer' :
                                                selectedEmployee.aura_score >= 3.5 ? '👍 Good Standing' :
                                                    selectedEmployee.aura_score >= 3.0 ? '📈 Developing' : '⚠️ Needs Attention'}
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
    const [stats, setStats] = useState({ onProbation: 0, dueForConfirmation: 0, atRisk: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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
            return <Badge className="bg-rose-100 text-rose-700 border-rose-200">Overdue</Badge>;
        }
        if (record.isInGracePeriod) {
            return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Grace Period</Badge>;
        }
        switch (record.status) {
            case 'confirmed':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Confirmed</Badge>;
            case 'pending':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Pending</Badge>;
            case 'extension_1':
            case 'extension_2':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Extended</Badge>;
            case 'terminated':
                return <Badge className="bg-rose-100 text-rose-700 border-rose-200">Terminated</Badge>;
            default:
                return <Badge variant="secondary">{record.status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard title="On Probation" value={stats.onProbation.toString()} icon={Users} color="text-blue-500" bg="bg-blue-50" />
                <SummaryCard title="Due for Confirmation" value={stats.dueForConfirmation.toString()} icon={UserCheck} color="text-emerald-500" bg="bg-emerald-50" />
                <SummaryCard title="At Risk (<50%)" value={stats.atRisk.toString()} icon={AlertTriangle} color="text-amber-500" bg="bg-amber-50" />
                <SummaryCard title="Overdue" value={stats.overdue.toString()} icon={Clock} color="text-rose-500" bg="bg-rose-50" />
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold text-slate-900">Probation Tracker</CardTitle>
                            <CardDescription className="text-slate-500">
                                Monitor new hires and confirmation timelines.
                            </CardDescription>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={fetchData}>
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
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
                            <UserCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p>No employees on probation</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-medium">
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
                                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3.5 font-medium text-slate-900">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${record.employeeId}`} />
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs">
                                                            {record.employeeName.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div>{record.employeeName}</div>
                                                        <div className="text-xs text-slate-400">{record.employeeEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{record.employeeRole || '—'}</td>
                                            <td className="px-6 py-3.5 text-slate-600 text-xs">
                                                <div>Start: {new Date(record.startDate).toLocaleDateString()}</div>
                                                <div className="text-slate-400 mt-0.5">End: {new Date(record.endDate).toLocaleDateString()}</div>
                                                <div className={`mt-1 font-medium ${record.daysRemaining < 0 ? 'text-rose-600' : record.daysRemaining < 14 ? 'text-amber-600' : 'text-slate-500'}`}>
                                                    {record.daysRemaining < 0 ? `${Math.abs(record.daysRemaining)} days overdue` : `${record.daysRemaining} days left`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <Badge variant="secondary" className={`${(record.score || 0) < 50 ? 'bg-rose-50 text-rose-700' : (record.score || 0) >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} font-semibold border-0`}>
                                                    {record.score != null ? `${record.score}%` : '—'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="text-xs text-slate-600 max-w-[180px]">{record.policyRecommendation || '—'}</div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                {getStatusBadge(record)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                {record.status === 'pending' && (record.score || 0) >= 70 && (
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
                                                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Confirm
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                {record.status !== 'pending' && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="space-y-1">
                    <p className="font-semibold text-amber-900">Confirmation Deadline Policy</p>
                    <p className="text-amber-700/80">Failure to complete confirmation within a 4-week grace period results in delayed salary and forfeiture of shared company benefits.</p>
                </div>
            </div>
        </div>
    );
}

function StructureSection() {
    const [selectedGrade, setSelectedGrade] = useState<number>(6);
    const [structureData, setStructureData] = useState<GradeLevel[]>([]);
    const [jobLevelsData, setJobLevelsData] = useState<JobLevel[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Grade color mapping
    const gradeColors: Record<number, string> = {
        6: 'bg-purple-50 text-purple-700 border-purple-100 ring-purple-500/10',
        5: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/10',
        4: 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/10',
        3: 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10',
        2: 'bg-slate-50 text-slate-700 border-slate-100 ring-slate-500/10',
        1: 'bg-gray-50 text-gray-700 border-gray-100 ring-gray-500/10',
    };

    // Find the currently selected grade object
    const currentGrade = structureData.find(g => g.grade === selectedGrade);

    // Get job levels for the selected grade
    const gradeJobLevels = jobLevelsData.filter(jl => jl.grade === selectedGrade);

    // Helper function to generate avatar URL based on employee data
    const getStructureAvatarUrl = (emp: Employee) => {
        if (emp.avatar && emp.avatar.length > 0 && !emp.avatar.includes('placeholder')) {
            return emp.avatar;
        }
        // Use employee_id or id for seed
        const seed = emp.employeeId || emp.email || emp.id || 'default';
        const gender = emp.gender?.toLowerCase();

        // Use gender-based avatar styles
        if (gender === 'male') {
            return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&gender=male`;
        } else if (gender === 'female') {
            return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&gender=female`;
        }
        // Default: bottts for unknown gender
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    };

    // Filter out system admins from the employee list
    const filterEmployees = (employees: Employee[]) => {
        return employees.filter(emp => {
            const lowerName = emp.name?.toLowerCase() || '';
            const lowerRole = emp.role?.toLowerCase() || '';
            // Filter out system administrators
            return !lowerName.includes('schoolable admin') &&
                !lowerName.includes('system admin') &&
                !lowerRole.includes('system administrator') &&
                !lowerRole.includes('super admin');
        });
    };

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
                    {/* Left Column: Grade Navigation */}
                    <div className="space-y-4">
                        <div className="px-1">
                            <h3 className="font-semibold text-slate-900">Organizational Structure</h3>
                            <p className="text-xs text-slate-500">Select a grade to view employees and job levels.</p>
                        </div>

                        <div className="space-y-3">
                            {structureData.map((g) => (
                                <button
                                    key={g.grade}
                                    onClick={() => setSelectedGrade(g.grade)}
                                    className={`w-full relative p-4 rounded-xl border flex flex-col items-center text-center transition-all duration-200 group ${selectedGrade === g.grade
                                        ? `${gradeColors[g.grade] || 'bg-slate-50 text-slate-700'} ring-1 shadow-sm scale-[1.02]`
                                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {selectedGrade === g.grade && (
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-current opacity-20" />
                                    )}
                                    <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Grade {g.grade}</div>
                                    <div className="font-semibold text-sm">{g.title}</div>
                                    <div className="mt-1 text-xs opacity-60">{g.count} employees</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Grade Detail with Employees */}
                    <div className="space-y-6 min-h-[500px]">
                        <Card className="border-slate-200 shadow-sm overflow-hidden content-start h-full">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            {currentGrade?.title ?? 'Grade'}
                                            <Badge variant="secondary" className="font-normal text-xs">Grade {selectedGrade}</Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            {currentGrade?.roles || 'View employees in this grade'}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-semibold text-slate-800">{currentGrade?.count || 0}</div>
                                        <div className="text-xs text-slate-500">employees</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {/* Job Levels in this grade */}
                                {gradeJobLevels.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            Job Levels
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {gradeJobLevels.map((jl) => (
                                                <div key={jl.id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                                    <div className="font-medium text-slate-800">{jl.title}</div>
                                                    <div className="text-slate-500">Level {jl.levelNumber} • {jl.minYearsExperience}+ yrs exp</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Employees in this grade */}
                                {currentGrade?.employees && filterEmployees(currentGrade.employees).length > 0 ? (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Employees ({filterEmployees(currentGrade.employees).length})
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {filterEmployees(currentGrade.employees).slice(0, 12).map((emp) => (
                                                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                                    <Avatar className="h-10 w-10 ring-2 ring-white">
                                                        <AvatarImage src={getStructureAvatarUrl(emp)} />
                                                        <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                                                            {emp.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-slate-700 truncate">{emp.name}</div>
                                                        <div className="text-xs text-slate-400 truncate">{emp.role || emp.department}</div>
                                                    </div>
                                                    {emp.isTeamLead && (
                                                        <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                                                    )}
                                                </div>
                                            ))}
                                            {filterEmployees(currentGrade.employees).length > 12 && (
                                                <div className="flex items-center justify-center p-3 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                                                    +{filterEmployees(currentGrade.employees).length - 12} more employees...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                        <Users className="h-10 w-10 mb-3 opacity-20" />
                                        <p>No employees found in this grade</p>
                                        <p className="text-xs mt-1">Employees will appear here once assigned to this grade</p>
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
    const [thresholds, setThresholds] = useState<{
        vertical: { cgpaThreshold: number; quarterlyMin: number; description: string };
        horizontal: { cgpaThreshold: number; description: string };
        fastTrack: { cgpaThreshold: number; consecutiveQuarters: number; description: string };
    } | null>(null);
    const [loading, setLoading] = useState(true);

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
            case 'fast-track': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'vertical': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'horizontal': return 'bg-sky-100 text-sky-700 border-sky-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'immediate review':
            case 'recommended': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
            case 'eligible': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
            default: return 'bg-slate-50 text-slate-700 ring-slate-600/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Threshold Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-100">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <TrendingUp className="absolute right-3 top-3 h-12 w-12 text-indigo-200/50" />
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-1">Vertical Move</div>
                        <div className="text-3xl font-semibold text-indigo-900 tracking-tight">
                            {thresholds?.vertical.cgpaThreshold.toFixed(2) || '4.20'} <span className="text-lg font-medium text-indigo-600/70">CGPA</span>
                        </div>
                        <p className="text-xs text-indigo-700 mt-2 font-medium">
                            Requirement: No quarter &lt; {thresholds?.vertical.quarterlyMin.toFixed(2) || '3.70'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <div className="absolute right-3 top-3 h-12 w-12 text-emerald-200/50 flex items-center justify-center font-black text-2xl">
                            {thresholds?.fastTrack.cgpaThreshold.toFixed(1) || '4.6'}
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1">Fast-Track</div>
                        <div className="text-3xl font-semibold text-emerald-900 tracking-tight">
                            {thresholds?.fastTrack.cgpaThreshold.toFixed(2) || '4.60'} <span className="text-lg font-medium text-emerald-600/70">CGPA</span>
                        </div>
                        <p className="text-xs text-emerald-700 mt-2 font-medium">
                            Requirement: {thresholds?.fastTrack.consecutiveQuarters || 2} consecutive quarters
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-100">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <div className="absolute right-3 top-3 h-12 w-12 text-sky-200/50 flex items-center justify-center">→</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-sky-500 mb-1">Horizontal Move</div>
                        <div className="text-3xl font-semibold text-sky-900 tracking-tight">
                            {thresholds?.horizontal.cgpaThreshold.toFixed(2) || '3.50'} <span className="text-lg font-medium text-sky-600/70">CGPA</span>
                        </div>
                        <p className="text-xs text-sky-700 mt-2 font-medium">Scope change, same level</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">Promotion Eligibility</CardTitle>
                    <CardDescription className="text-slate-500">Staff qualifying based on Annual CGPA and policy thresholds.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p>No employees eligible for promotion at this time</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-medium">
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
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.id}`} />
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs">
                                                            {p.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div>{p.name}</div>
                                                        <div className="text-xs text-slate-400">{p.department || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">
                                                <div>{p.currentTitle || p.role}</div>
                                                <div className="text-xs text-slate-400">Level {p.currentLevel}</div>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600 font-medium">
                                                <div>{p.targetTitle}</div>
                                                <div className="text-xs text-slate-400">Level {p.targetLevel}</div>
                                            </td>
                                            <td className="px-6 py-3.5 font-semibold text-slate-800">{p.cgpa.toFixed(2)}</td>
                                            <td className="px-6 py-3.5">
                                                <Badge variant="outline" className={`font-normal ${getTypeColor(p.promotionType)}`}>
                                                    {p.promotionType}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ring-inset ${getStatusColor(p.status)}`}>
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
            return <Badge className="bg-rose-100 text-rose-700 border-rose-200">Overdue</Badge>;
        }
        switch (pip.status) {
            case 'active':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Active</Badge>;
            case 'completed':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Completed</Badge>;
            case 'terminated':
                return <Badge className="bg-rose-100 text-rose-700 border-rose-200">Terminated</Badge>;
            default:
                return <Badge variant="secondary">{pip.status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-5 flex items-start gap-4 shadow-sm">
                <div className="p-2 bg-rose-100 rounded-full shrink-0">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-rose-900">Immediate Action Required</h3>
                    <p className="text-sm text-rose-800/90 mt-1 leading-relaxed">
                        Employees performing below <span className="font-semibold underline">50%</span> must be placed on PIP immediately.
                        The plan must not exceed <span className="font-semibold">3 months</span>. Unsatisfactory performance after PIP conclusion leads to termination.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard title="Active PIPs" value={pips.filter(p => p.status === 'active').length.toString()} icon={Shield} color="text-amber-500" bg="bg-amber-50" />
                <SummaryCard title="At Risk" value={pips.filter(p => p.weeksRemaining <= 2).length.toString()} icon={AlertTriangle} color="text-rose-500" bg="bg-rose-50" />
                <SummaryCard title="Completed" value={pips.filter(p => p.status === 'completed').length.toString()} icon={CheckCircle} color="text-emerald-500" bg="bg-emerald-50" />
            </div>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Active Performance Improvement Plans</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : pips.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Shield className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p>No active PIPs at this time</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-medium">
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
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.employeeId}`} />
                                                        <AvatarFallback className="bg-rose-50 text-rose-600 text-xs">
                                                            {p.employeeName.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {p.employeeName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{p.employeeRole || '—'}</td>
                                            <td className="px-6 py-3.5 text-slate-600 text-xs">
                                                <div className="text-rose-600 font-medium">Start: {new Date(p.startDate).toLocaleDateString()}</div>
                                                <div className="text-slate-400">End: {new Date(p.endDate).toLocaleDateString()}</div>
                                                <div className={`mt-1 font-medium ${p.daysRemaining < 14 ? 'text-rose-600' : 'text-slate-500'}`}>
                                                    {p.weeksRemaining} weeks left
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-rose-600 font-medium max-w-[200px]">
                                                <div>{p.triggerReason}</div>
                                                {p.triggerScore && (
                                                    <div className="text-xs text-slate-400 mt-1">Score: {p.triggerScore}%</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${p.progressPercentage >= 70 ? 'bg-emerald-500' : p.progressPercentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${p.progressPercentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600">{p.progressPercentage}%</span>
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getTeamLeads();
                setLeads(data);
            } catch (error) {
                console.error('Error fetching team leads:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to generate avatar URL based on gender
    const getAvatarUrl = (lead: TeamLead): string => {
        const seed = lead.employeeId || lead.email || lead.name || 'user';
        const gender = lead.gender?.toLowerCase();

        if (gender === 'male') {
            return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&gender=male`;
        } else if (gender === 'female') {
            return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&gender=female`;
        }
        // Default: bottts for unknown gender
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    };

    const parsePerks = (perksString: string | null): string[] => {
        if (!perksString) return [];
        try {
            return JSON.parse(perksString);
        } catch {
            return perksString.split(',').map(p => p.trim());
        }
    };

    return (
        <div className="space-y-6">
            {/* Simplified Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                        <Crown className="h-5 w-5 text-indigo-500" />
                        Team Leads
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage and view team lead designations
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center min-w-[80px]">
                        <div className="text-2xl font-bold text-indigo-600">{leads.length}</div>
                        <div className="text-xs text-indigo-500">Active Leads</div>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[80px]">
                        <div className="text-2xl font-bold text-slate-700">{leads.reduce((acc, l) => acc + l.teamSize, 0)}</div>
                        <div className="text-xs text-slate-500">Total Reports</div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Leads */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Award className="h-5 w-5 text-indigo-500" /> Current Leaders
                    </h3>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl">
                            <Award className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p>No team leads appointed yet</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {leads.map((t) => (
                                <Card key={t.id} className="group border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-14 w-14 border-2 border-slate-100">
                                                    <AvatarImage src={getAvatarUrl(t)} />
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-600">
                                                        {t.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 text-base">{t.name}</h4>
                                                    <div className="text-sm text-slate-500">{t.role || t.teamName}</div>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Badge variant="secondary" className="bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 font-normal text-xs">
                                                            {t.department || 'Team'}
                                                        </Badge>
                                                        <span className="text-xs text-slate-400">• {t.teamSize} direct reports</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1 text-emerald-600 font-semibold text-lg">
                                                    <Star className="h-4 w-4 fill-emerald-600" /> {t.reviewCycles}
                                                </div>
                                                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Perf. Cycles</div>
                                                {t.monthsAsLead > 0 && (
                                                    <div className="text-xs text-slate-400 mt-1">{t.monthsAsLead} months</div>
                                                )}
                                            </div>
                                        </div>
                                        {parsePerks(t.perks).length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                                                {parsePerks(t.perks).map((p, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded uppercase tracking-wide">
                                                        {p.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {t.status === 'pending' && (
                                            <div className="mt-3">
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Awaiting Confirmation</Badge>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Requirements & Perks */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-slate-500" /> Perks & Requirements
                    </h3>

                    <div className="grid gap-4">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="p-6">
                                <h4 className="font-semibold text-slate-900 mb-2">Requirements</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                        Consistent high performance over 2–3 cycles
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                        Demonstrated leadership potential
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                        Manager recommendation & peer review
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <div className="grid gap-3">
                            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">Privileged Workspace</div>
                                    <div className="text-xs text-slate-500">Dedicated area, distinct from cubicles</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-600">
                                    <Star className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">Annual Strategy Retreat</div>
                                    <div className="text-xs text-slate-500">Exclusive off-site event for leaders</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">Enhanced Allowance</div>
                                    <div className="text-xs text-slate-500">25-30 days annual leave + data allowance</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Certificates Section for admin approval workflow
function CertificatesSection() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchCertificates();
    }, [filter]);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const statusParam = filter === 'all' ? '' : `?status=${filter}`;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://schoolable-backend.onrender.com'}/api/performance/training-records${statusParam}`
            );
            const data = await res.json();
            setCertificates(Array.isArray(data) ? data : []);
        } catch {
            setCertificates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        setActionLoading(id);
        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://schoolable-backend.onrender.com'}/api/performance/training-records/${id}/approve`,
                { method: 'POST' }
            );
            fetchCertificates();
        } catch (e) {
            console.error('Approval failed', e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        setActionLoading(id);
        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://schoolable-backend.onrender.com'}/api/performance/training-records/${id}/reject`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                }
            );
            fetchCertificates();
        } catch (e) {
            console.error('Rejection failed', e);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>;
            case 'pending':
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const pendingCount = certificates.filter(c => c.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5 flex items-start gap-4 shadow-sm">
                <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-emerald-900">Certificate Approval</h3>
                    <p className="text-sm text-emerald-800/90 mt-1 leading-relaxed">
                        Employees upload training certificates each quarter. <span className="font-semibold">Only approved certificates count towards their Growth & Learning pillar</span> (25% of Aura Score).
                    </p>
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
                    value={certificates.filter(c => c.status === 'approved').length.toString()}
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

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === f
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Certificates Table */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Training Certificates</CardTitle>
                    <CardDescription>Review and approve employee training certificates</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <FileCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p>No certificates found</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Certificate</th>
                                    <th className="px-6 py-3">Quarter</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {certificates.map((cert) => (
                                    <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${cert.employeeId}`} />
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs">
                                                        {cert.employeeId?.toString().substring(0, 2).toUpperCase() || '??'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {cert.employeeId?.toString().substring(0, 8)}...
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">{cert.name}</span>
                                                {cert.certificateUrl && (
                                                    <a
                                                        href={cert.certificateUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            {cert.quarter} {cert.year}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            {getStatusBadge(cert.status)}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            {cert.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => handleApprove(cert.id)}
                                                        disabled={actionLoading === cert.id}
                                                    >
                                                        {actionLoading === cert.id ? (
                                                            <div className="h-3 w-3 animate-spin rounded-full border border-emerald-600 border-t-transparent" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Approve
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                                                        onClick={() => handleReject(cert.id)}
                                                        disabled={actionLoading === cert.id}
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {cert.status === 'rejected' && cert.rejectionReason && (
                                                <span className="text-xs text-rose-600" title={cert.rejectionReason}>
                                                    Reason: {cert.rejectionReason.substring(0, 20)}...
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// --- UTILS ---

function SummaryCard({ title, value, icon: Icon, color, bg }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
    return (
        <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${bg} shrink-0`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-2xl font-semibold text-slate-900">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

