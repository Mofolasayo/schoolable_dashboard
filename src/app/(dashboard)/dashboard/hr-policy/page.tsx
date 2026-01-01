'use client';

import { useState, useEffect } from 'react';
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
    Sparkles
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';

// --- MOCK DATA ---

const probationStaff = [
    { id: 1, name: 'Alice Johnson', role: 'Customer Support', startDate: '2025-10-01', appraisalDate: '2025-12-20', score: 85, status: 'Pending Confirmation' },
    { id: 2, name: 'Bob Smith', role: 'Sales Intern', startDate: '2025-11-01', appraisalDate: null, score: 45, status: 'At Risk' },
    { id: 3, name: 'Charlie Brown', role: 'Junior Dev', startDate: '2025-09-01', appraisalDate: '2025-11-30', score: 60, status: 'Extended (1mo)' },
];

const promotionsList = [
    { id: 1, name: 'David Lee', currentRole: 'Junior Exec', targetRole: 'Team Lead', cgpa: 4.7, type: 'Fast-Track', status: 'Recommended', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 2, name: 'Eva Green', currentRole: 'Support Staff', targetRole: 'Support L2', cgpa: 3.8, type: 'Horizontal', status: 'Eligible', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva' },
    { id: 3, name: 'Frank White', currentRole: 'Asst. Team Lead', targetRole: 'Team Lead', cgpa: 4.25, type: 'Vertical', status: 'Eligible', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank' },
];

const pipList = [
    { id: 1, name: 'George Black', role: 'Sales Executive', pipStart: '2025-12-01', pipEnd: '2026-03-01', reason: 'Performance < 50%', status: 'Active', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George' },
];

const teamLeads = [
    { id: 1, name: 'Helen Mirren', role: 'Engineering Lead', department: 'Engineering', cycles: 3, perks: ['Workspace', 'Data Allowance'], img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Helen', teamSize: 12 },
    { id: 2, name: 'Ian Wright', role: 'Sales Lead', department: 'Sales', cycles: 2, perks: ['Workspace', 'Retreat'], img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ian', teamSize: 8 },
    { id: 3, name: 'Sarah Connor', role: 'Ops Lead', department: 'Operations', cycles: 4, perks: ['Workspace', 'Retreat', 'Data'], img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', teamSize: 15 },
];

// Expanded for Org Chart visualization
const levels = [
    { level: 14, title: 'General Manager', count: 1, staff: [{ name: 'Sarah Connor', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' }] },
    { level: 13, title: 'Deputy GM', count: 1, staff: [{ name: 'Kyle Reese', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kyle' }] },
    { level: 12, title: 'Assistant GM', count: 2, staff: [{ name: 'John Doe', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' }, { name: 'Jane Doe', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' }] },
    { level: 11, title: 'Senior Manager', count: 3, staff: [{ name: 'Mike Ross', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' }, { name: 'Rachel Zane', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel' }, { name: 'Donna Paulsen', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Donna' }] },
    { level: 9, title: 'Manager', count: 5, staff: [{ name: 'Harvey Specter', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harvey' }, { name: 'Louis Litt', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Louis' }] }, // Truncated staff list for visuals
    { level: 7, title: 'Deputy Manager', count: 8, staff: [] },
    { level: 5, title: 'Assistant Manager', count: 10, staff: [] },
    { level: 4, title: 'Senior Executive', count: 15, staff: [] },
    { level: 3, title: 'Executive', count: 24, staff: [] },
    { level: 2, title: 'Assistant Executive', count: 18, staff: [] },
    { level: 1, title: 'Executive Trainee', count: 10, staff: [{ name: 'New Hire 1', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NH1' }, { name: 'New Hire 2', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NH2' }] },
];

// Define Grades with their Level ranges for filtering
const grades = [
    { grade: 'Grade 6', title: 'C-Suite & Directors', color: 'bg-purple-50 text-purple-700 border-purple-100 ring-purple-500/10', levelRange: [13, 14] },
    { grade: 'Grade 5', title: 'Senior Management', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/10', levelRange: [10, 12] },
    { grade: 'Grade 4', title: 'Management', color: 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/10', levelRange: [8, 9] },
    { grade: 'Grade 3', title: 'Execs & Team Leads', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/10', levelRange: [3, 7] },
    { grade: 'Grade 2', title: 'Entry Level', color: 'bg-slate-50 text-slate-700 border-slate-100 ring-slate-500/10', levelRange: [1, 2] },
    { grade: 'Grade 1', title: 'Support Staff', color: 'bg-gray-50 text-gray-700 border-gray-100 ring-gray-500/10', levelRange: [0, 0] }, // Assuming 0 or special handling
];

export default function HRPolicyPage() {
    const [activeTab, setActiveTab] = useState<'employees' | 'probation' | 'structure' | 'promotion' | 'pip' | 'team-leads' | 'certificates'>('employees');

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">HR & Policy Management</h1>
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

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${active
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
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
    const [employeeCerts, setEmployeeCerts] = useState<any[]>([]);

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
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://schoolable-backend.onrender.com'}/api/performance/aura`
            );
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (e) {
            // Mock data for development
            setEmployees([
                {
                    id: '1', full_name: 'Alice Johnson', email: 'alice@example.com', role: 'Software Engineer', department: 'Engineering',
                    aura_score: 4.2, technical_score: 4.5, behavioral_score: 4.0, culture_score: 4.1, growth_score: 4.2,
                    certificates_count: 2, status: 'active'
                },
                {
                    id: '2', full_name: 'Bob Smith', email: 'bob@example.com', role: 'Product Manager', department: 'Product',
                    aura_score: 3.8, technical_score: 3.5, behavioral_score: 4.2, culture_score: 4.0, growth_score: 3.5,
                    certificates_count: 1, status: 'active'
                },
                {
                    id: '3', full_name: 'Carol White', email: 'carol@example.com', role: 'Designer', department: 'Design',
                    aura_score: 4.5, technical_score: 4.8, behavioral_score: 4.3, culture_score: 4.5, growth_score: 4.4,
                    certificates_count: 3, status: 'active'
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeCertificates = async (employeeId: string) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://schoolable-backend.onrender.com'}/api/performance/training-records/employee/${employeeId}`
            );
            const data = await res.json();
            setEmployeeCerts(Array.isArray(data) ? data : []);
        } catch (e) {
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

    const PillarBar = ({ label, score, icon: Icon, color }: { label: string; score: number; icon: any; color: string }) => (
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
                    <h2 className="text-lg font-bold text-slate-900">All Employees</h2>
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
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id || emp.email}`} />
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
                                                <Badge className={`text-sm font-bold px-3 py-1 ${getScoreBadgeColor(emp.aura_score)}`}>
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
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee.id || selectedEmployee.email}`} />
                                    <AvatarFallback className="bg-white/20 text-white text-lg">
                                        {selectedEmployee.full_name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedEmployee.full_name}</h3>
                                    <p className="text-indigo-100">{selectedEmployee.role} • {selectedEmployee.department}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-amber-300" />
                                    <div>
                                        <div className="text-2xl font-bold">{selectedEmployee.aura_score?.toFixed(2) || '—'}</div>
                                        <div className="text-xs text-indigo-100">Aura Score</div>
                                    </div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-emerald-300" />
                                    <div>
                                        <div className="text-2xl font-bold">{employeeCerts.length}</div>
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
                                    <div className="font-bold text-slate-900">
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
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <SummaryCard title="On Probation" value={probationStaff.length.toString()} icon={Users} color="text-blue-500" bg="bg-blue-50" />
                <SummaryCard title="Due for Confirmation" value={probationStaff.filter(s => s.status === 'Pending Confirmation').length.toString()} icon={UserCheck} color="text-emerald-500" bg="bg-emerald-50" />
                <SummaryCard title="At Risk (<50%)" value={probationStaff.filter(s => s.score < 50).length.toString()} icon={AlertTriangle} color="text-rose-500" bg="bg-rose-50" />
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
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                            <UserPlus className="h-3.5 w-3.5" /> New Hire
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Timeline</th>
                                    <th className="px-6 py-3">Score</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {probationStaff.map((staff) => (
                                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs">{staff.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                {staff.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">{staff.role}</td>
                                        <td className="px-6 py-3.5 text-slate-600 text-xs">
                                            <div>Start: {staff.startDate}</div>
                                            <div className="text-slate-400 mt-0.5">Appraisal: {staff.appraisalDate || 'Pending'}</div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <Badge variant="secondary" className={`${staff.score < 50 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'} font-semibold border-0`}>
                                                {staff.score}%
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <StatusBadge status={staff.status} />
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
    const [selectedGrade, setSelectedGrade] = useState<string>('Grade 6');

    // Find the currently selected grade object
    const currentGrade = grades.find(g => g.grade === selectedGrade) || grades[0];

    // Filter levels based on the selected grade's range
    // If range is [0,0] (like for Grade 1 support), we might need custom logic or just show everything else.
    // For now, simple range check.
    const displayedLevels = levels.filter(lvl =>
        lvl.level >= currentGrade.levelRange[0] && lvl.level <= currentGrade.levelRange[1]
    );

    return (
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
            {/* Left Column: The Pyramid Navigation */}
            <div className="space-y-4">
                <div className="px-1">
                    <h3 className="font-bold text-slate-900">Organizational Structure</h3>
                    <p className="text-xs text-slate-500">Select a grade to view details.</p>
                </div>

                <div className="space-y-3">
                    {grades.map((g, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedGrade(g.grade)}
                            className={`w-full relative p-4 rounded-xl border flex flex-col items-center text-center transition-all duration-200 group ${selectedGrade === g.grade
                                ? `${g.color} ring-1 shadow-sm scale-[1.02]`
                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            {selectedGrade === g.grade && (
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-current opacity-20" />
                            )}
                            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{g.grade}</div>
                            <div className="font-bold text-sm">{g.title}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Column: Level Detail with Staff */}
            <div className="space-y-6 min-h-[500px]">
                <Card className="border-slate-200 shadow-sm overflow-hidden content-start h-full">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    {currentGrade.title}
                                    <Badge variant="secondary" className="font-normal text-xs">{selectedGrade}</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Includes Job Levels {currentGrade.levelRange[0]} - {currentGrade.levelRange[1]}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {displayedLevels.length > 0 ? (
                            <div className="space-y-6">
                                {displayedLevels.map((lvl) => (
                                    <div key={lvl.level} className="animate-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Badge variant="outline" className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-200">
                                                Level {lvl.level}
                                            </Badge>
                                            <h4 className="font-bold text-slate-800 text-sm">{lvl.title}</h4>
                                            <div className="h-px flex-1 bg-slate-100" />
                                            <span className="text-xs font-medium text-slate-400">
                                                {lvl.count} Staff
                                            </span>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                                            {lvl.staff.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {lvl.staff.map((s, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                                            <Avatar className="h-8 w-8 ring-2 ring-white">
                                                                <AvatarImage src={s.img} />
                                                                <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-700">{s.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs font-medium text-slate-700 truncate">{s.name}</span>
                                                        </div>
                                                    ))}
                                                    {lvl.count > lvl.staff.length && (
                                                        <div className="flex items-center justify-center p-2 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                                                            +{lvl.count - lvl.staff.length} more...
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-2 text-center">
                                                    <span className="text-xs text-slate-400 italic">No visible staff records for this level</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Briefcase className="h-10 w-10 mb-3 opacity-20" />
                                <p>No job levels found for this grade.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PromotionSection() {
    return (
        <div className="space-y-6">
            {/* Threshold Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-100">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <TrendingUp className="absolute right-3 top-3 h-12 w-12 text-indigo-200/50" />
                        <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">Vertical Move</div>
                        <div className="text-3xl font-bold text-indigo-900 tracking-tight">4.20 <span className="text-lg font-medium text-indigo-600/70">CGPA</span></div>
                        <p className="text-xs text-indigo-700 mt-2 font-medium">Requirement: No quarter &lt; 3.70</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <div className="absolute right-3 top-3 h-12 w-12 text-emerald-200/50 flex items-center justify-center font-black text-2xl">4.6</div>
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">Fast-Track</div>
                        <div className="text-3xl font-bold text-emerald-900 tracking-tight">4.60 <span className="text-lg font-medium text-emerald-600/70">CGPA</span></div>
                        <p className="text-xs text-emerald-700 mt-2 font-medium">Requirement: 2 consecutive quarters</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-100">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <div className="absolute right-3 top-3 h-12 w-12 text-sky-200/50 flex items-center justify-center">→</div>
                        <div className="text-xs font-bold uppercase tracking-wider text-sky-500 mb-1">Horizontal Move</div>
                        <div className="text-3xl font-bold text-sky-900 tracking-tight">3.50 <span className="text-lg font-medium text-sky-600/70">CGPA</span></div>
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
                            {promotionsList.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-3.5 font-medium text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={p.img} />
                                                <AvatarFallback>{p.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            {p.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-600">{p.currentRole}</td>
                                    <td className="px-6 py-3.5 text-slate-600 font-medium">{p.targetRole}</td>
                                    <td className="px-6 py-3.5 font-bold text-slate-800">{p.cgpa}</td>
                                    <td className="px-6 py-3.5"><Badge variant="outline" className="font-normal border-slate-200">{p.type}</Badge></td>
                                    <td className="px-6 py-3.5"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

function PIPSection() {
    return (
        <div className="space-y-6">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-5 flex items-start gap-4 shadow-sm">
                <div className="p-2 bg-rose-100 rounded-full shrink-0">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-rose-900">Immediate Action Required</h3>
                    <p className="text-sm text-rose-800/90 mt-1 leading-relaxed">
                        Employees performing below <span className="font-bold underline">50%</span> must be placed on PIP immediately.
                        The plan must not exceed <span className="font-bold">3 months</span>. Unsatisfactory performance after PIP conclusion leads to termination.
                    </p>
                </div>
            </div>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Active Performance Improvement Plans</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Employee</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Timeline</th>
                                <th className="px-6 py-3">Reason</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pipList.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-6 py-3.5 font-medium text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={p.img} />
                                                <AvatarFallback>{p.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            {p.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-600">{p.role}</td>
                                    <td className="px-6 py-3.5 text-slate-600 text-xs">
                                        <div className="text-rose-600 font-medium">Start: {p.pipStart}</div>
                                        <div className="text-slate-400">End: {p.pipEnd}</div>
                                    </td>
                                    <td className="px-6 py-3.5 text-rose-600 font-medium">{p.reason}</td>
                                    <td className="px-6 py-3.5"><Badge className="bg-rose-50 text-rose-700 border-rose-100 shadow-none hover:bg-rose-100">Active</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

function TeamLeadSection() {
    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-10 shadow-lg text-white">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="space-y-3 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-xs font-medium text-indigo-50">
                            <Crown className="h-3.5 w-3.5" /> Leadership Track
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Team Lead Designation</h2>
                        <p className="text-indigo-100 text-lg leading-relaxed">
                            A distinctive role for high-performing individuals who drive innovation and inspire their peers.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Leads */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Award className="h-5 w-5 text-indigo-500" /> Current Leaders
                    </h3>
                    <div className="grid gap-4">
                        {teamLeads.map((t) => (
                            <Card key={t.id} className="group border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-14 w-14 border-2 border-slate-100">
                                                <AvatarImage src={t.img} />
                                                <AvatarFallback>{t.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-base">{t.name}</h4>
                                                <div className="text-sm text-slate-500">{t.role}</div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Badge variant="secondary" className="bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 font-normal text-xs">
                                                        {t.department}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">• {t.teamSize} direct reports</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-lg">
                                                <Star className="h-4 w-4 fill-emerald-600" /> {t.cycles}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Perf. Cycles</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                                        {t.perks.map((p, i) => (
                                            <span key={i} className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded uppercase tracking-wide">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Requirements & Perks */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-slate-500" /> Perks & Requirements
                    </h3>

                    <div className="grid gap-4">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="p-6">
                                <h4 className="font-bold text-slate-900 mb-2">Requirements</h4>
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
                                    <div className="font-bold text-slate-900">Privileged Workspace</div>
                                    <div className="text-xs text-slate-500">Dedicated area, distinct from cubicles</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-600">
                                    <Star className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Annual Strategy Retreat</div>
                                    <div className="text-xs text-slate-500">Exclusive off-site event for leaders</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Enhanced Allowance</div>
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
        } catch (e) {
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
                    <h3 className="text-sm font-bold text-emerald-900">Certificate Approval</h3>
                    <p className="text-sm text-emerald-800/90 mt-1 leading-relaxed">
                        Employees upload training certificates each quarter. <span className="font-bold">Only approved certificates count towards their Growth & Learning pillar</span> (25% of Aura Score).
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

function SummaryCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${bg} shrink-0`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    let classes = "bg-slate-100 text-slate-700 ring-slate-600/20";
    if (status === 'Pending Confirmation') classes = "bg-blue-50 text-blue-700 ring-blue-700/10";
    if (status === 'Confirmed') classes = "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    if (status === 'At Risk') classes = "bg-rose-50 text-rose-700 ring-rose-600/10";
    if (status.includes('Extended')) classes = "bg-amber-50 text-amber-700 ring-amber-600/20";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${classes}`}>
            {status}
        </span>
    );
}

