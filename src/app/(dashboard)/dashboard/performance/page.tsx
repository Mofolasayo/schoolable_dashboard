'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuraScoreCard, AuraScoreBadge } from '@/components/features/AuraScoreCard';
import {
    BarChart3,
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
    Calendar,
    Clock,
    ChevronRight,
    Star,
    Target,
    MessageSquare,
    FileText,
    Loader2,
    AlertCircle,
    Trash2,
} from 'lucide-react';
import {
    getAuraDashboard,
    getAllProfiles,
    deleteProfile,
    type AuraResponse,
    type StaffProfile,
    type PillarScores,
} from '@/lib/api/backend';
import { toast } from 'sonner';

// Types
interface ReviewCycle {
    quarter: string;
    year: number;
    status: 'upcoming' | 'active' | 'completed';
    startDate: string;
    endDate: string;
    completionRate: number;
}

interface TeamMemberWithAura extends StaffProfile {
    auraScore?: number;
    grade?: string;
    qgpa?: number;
    pillars?: PillarScores;
    reviewStatus: 'pending' | 'in_progress' | 'completed';
}

// Get current quarter info
function getCurrentQuarter(): { quarter: string; year: number; startDate: string; endDate: string } {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const quarterNum = Math.floor(month / 3) + 1;
    const quarterStartMonth = (quarterNum - 1) * 3;
    const quarterEndMonth = quarterStartMonth + 2;

    const startDate = new Date(year, quarterStartMonth, 1);
    const endDate = new Date(year, quarterEndMonth + 1, 0);

    return {
        quarter: `Q${quarterNum}`,
        year,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
    };
}


// Review status badge helper
function getStatusBadge(status: string) {
    switch (status) {
        case 'completed':
            return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
        case 'in_progress':
            return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
        case 'pending':
            return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
        default:
            return null;
    }
}

export default function PerformancePage() {
    const [_activeTab, setActiveTab] = useState('overview');
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [auraData, setAuraData] = useState<AuraResponse | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMemberWithAura[]>([]);
    const [selectedEmployeeAura, setSelectedEmployeeAura] = useState<AuraResponse | null>(null);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<TeamMemberWithAura | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle delete staff
    const handleDeleteClick = (employee: TeamMemberWithAura) => {
        setEmployeeToDelete(employee);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!employeeToDelete) return;

        setIsDeleting(true);
        try {
            await deleteProfile(employeeToDelete.id);

            // Remove from local state
            setTeamMembers(prev => prev.filter(m => m.id !== employeeToDelete.id));

            // Clear selection if deleted employee was selected
            if (selectedEmployee === employeeToDelete.id) {
                setSelectedEmployee(null);
                setSelectedEmployeeAura(null);
            }

            toast.success(`${employeeToDelete.full_name || 'Staff member'} has been deleted`);
            setShowDeleteConfirm(false);
            setEmployeeToDelete(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete staff member');
        } finally {
            setIsDeleting(false);
        }
    };

    // Get current cycle info
    const { quarter, year, startDate, endDate } = getCurrentQuarter();
    const currentCycle: ReviewCycle = {
        quarter,
        year,
        status: 'active',
        startDate,
        endDate,
        completionRate: 35, // TODO: Calculate from actual data
    };

    // Fetch initial data
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch all profiles for team list
                const profiles = await getAllProfiles();

                // Fetch Aura scores for all employees in parallel
                const auraPromises = profiles.map(async (profile) => {
                    try {
                        const aura = await getAuraDashboard(profile.id);
                        return {
                            ...profile,
                            auraScore: aura.auraScore,
                            grade: aura.grade,
                            qgpa: aura.qgpa,
                            pillars: aura.pillars,
                            reviewStatus: 'completed' as const,
                        };
                    } catch {
                        // No Aura data for this employee
                        return {
                            ...profile,
                            reviewStatus: 'pending' as const,
                        };
                    }
                });

                const membersWithAura = await Promise.all(auraPromises);
                setTeamMembers(membersWithAura);

                // Use first member with Aura data for overview
                const firstWithAura = membersWithAura.find(m => m.auraScore !== undefined);
                if (firstWithAura && firstWithAura.pillars) {
                    setAuraData({
                        employeeId: firstWithAura.id,
                        fullName: firstWithAura.full_name || 'Unknown',
                        department: firstWithAura.department || '',
                        role: firstWithAura.role || '',
                        auraScore: firstWithAura.auraScore!,
                        qgpa: firstWithAura.qgpa || 0,
                        grade: firstWithAura.grade || 'N/A',
                        pillars: firstWithAura.pillars,
                        weeksRatedThisQuarter: 0,
                        quarterStart: startDate,
                        quarterEnd: endDate,
                        lastUpdated: new Date().toISOString(),
                    });
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to load performance data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [startDate, endDate]);

    // Fetch individual employee Aura when selected
    const handleEmployeeSelect = async (employeeId: string) => {
        setSelectedEmployee(employeeId);
        try {
            const aura = await getAuraDashboard(employeeId);
            setSelectedEmployeeAura(aura);
        } catch {
            setSelectedEmployeeAura(null);
        }
    };

    // Calculate company averages from real data
    const membersWithScores = teamMembers.filter(m => m.auraScore !== undefined);
    const companyAverageScore = membersWithScores.length > 0
        ? Math.round(membersWithScores.reduce((sum, m) => sum + (m.auraScore || 0), 0) / membersWithScores.length)
        : 0;

    // Calculate pillar averages from members with full data
    const membersWithPillars = teamMembers.filter(m => m.pillars !== undefined);
    const pillarSummaries = membersWithPillars.length > 0
        ? [
            {
                name: 'Technical (25%)',
                icon: <Target className="h-4 w-4" />,
                averageScore: Math.round(membersWithPillars.reduce((sum, m) => sum + (m.pillars?.technical?.score || 0), 0) / membersWithPillars.length),
                trend: 'up' as const,
            },
            {
                name: 'Behavioral (25%)',
                icon: <Users className="h-4 w-4" />,
                averageScore: Math.round(membersWithPillars.reduce((sum, m) => sum + (m.pillars?.behavioral?.score || 0), 0) / membersWithPillars.length),
                trend: 'stable' as const,
            },
            {
                name: 'Culture Fit (25%)',
                icon: <Star className="h-4 w-4" />,
                averageScore: Math.round(membersWithPillars.reduce((sum, m) => sum + (m.pillars?.cultureFit?.score || 0), 0) / membersWithPillars.length),
                trend: 'up' as const,
            },
            {
                name: 'Growth & Learning (25%)',
                icon: <TrendingUp className="h-4 w-4" />,
                averageScore: Math.round(membersWithPillars.reduce((sum, m) => sum + (m.pillars?.growthLearning?.score || 0), 0) / membersWithPillars.length),
                trend: 'up' as const,
            },
        ]
        : [
            { name: 'Technical (25%)', icon: <Target className="h-4 w-4" />, averageScore: 0, trend: 'stable' as const },
            { name: 'Behavioral (25%)', icon: <Users className="h-4 w-4" />, averageScore: 0, trend: 'stable' as const },
            { name: 'Culture Fit (25%)', icon: <Star className="h-4 w-4" />, averageScore: 0, trend: 'stable' as const },
            { name: 'Growth & Learning (25%)', icon: <TrendingUp className="h-4 w-4" />, averageScore: 0, trend: 'stable' as const },
        ];

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading performance data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-red-800">{error}</h3>
                        <p className="text-sm text-red-600 mt-1">Please try again later</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
                    <p className="text-gray-500 mt-1">
                        Aura Score System - 5 Pillars × Weighted Contributions = 100%
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Start Weekly Rating
                    </Button>
                </div>
            </div>

            {/* Current Review Cycle Banner */}
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                <CardContent className="py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-5 w-5" />
                                <span className="text-sm font-medium opacity-90">Current Quarter</span>
                            </div>
                            <h2 className="text-3xl font-bold">{currentCycle.quarter} {currentCycle.year}</h2>
                            <p className="text-sm opacity-80 mt-1">
                                {currentCycle.startDate} - {currentCycle.endDate}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm opacity-80 mb-2">Ratings Completion</div>
                            <div className="text-4xl font-bold">{currentCycle.completionRate}%</div>
                            <Progress value={currentCycle.completionRate} className="w-48 mt-2 bg-white/20" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="employees">Employees</TabsTrigger>
                    <TabsTrigger value="peer-feedback">Peer Feedback</TabsTrigger>
                    <TabsTrigger value="weekly-ratings">Weekly Ratings</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Aura Score Card */}
                    {auraData && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">Sample Employee Aura Score</h3>
                            <AuraScoreCard data={auraData} showDetails={true} />
                        </div>
                    )}

                    {/* 5 Core Pillar Scores (Company Average) */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Company Average by Pillar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {pillarSummaries.map((pillar, index) => (
                                <Card key={index} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                                            {pillar.icon}
                                            <span className="text-xs font-medium">{pillar.name}</span>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-2xl font-bold">{Math.round(pillar.averageScore)}%</span>
                                            {pillar.trend === 'up' && (
                                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                            )}
                                            {pillar.trend === 'down' && (
                                                <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                                            )}
                                        </div>
                                        <Progress value={pillar.averageScore} className="mt-2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Quick Team Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-500">Total Employees</div>
                                <div className="text-3xl font-bold mt-1">{teamMembers.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-500">Ratings Submitted</div>
                                <div className="text-3xl font-bold mt-1 text-emerald-600">
                                    {teamMembers.filter(m => m.reviewStatus === 'completed').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-500">Pending Ratings</div>
                                <div className="text-3xl font-bold mt-1 text-amber-600">
                                    {teamMembers.filter(m => m.reviewStatus === 'pending').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-gray-500">Avg Aura Score</div>
                                <div className="text-3xl font-bold mt-1 text-indigo-600">
                                    {companyAverageScore > 0 ? companyAverageScore : '--'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Employees Tab */}
                <TabsContent value="employees" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Employee Aura Scores
                            </CardTitle>
                            <CardDescription>
                                View and manage individual employee performance scores
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {teamMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleEmployeeSelect(member.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg">
                                                {member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900">{member.full_name || 'Unknown'}</span>
                                                    {member.role === 'team_lead' && (
                                                        <Badge variant="outline" className="text-xs">Team Lead</Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">{member.job_title || 'Staff'}</div>
                                                <div className="text-xs text-gray-400">{member.department || 'No Department'} • {member.employee_id || 'N/A'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {member.auraScore && member.grade ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-gray-900">{Math.round(member.auraScore)}</div>
                                                        <div className="text-xs text-gray-500">Aura Score</div>
                                                    </div>
                                                    <AuraScoreBadge score={member.auraScore} grade={member.grade} />
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">No score yet</span>
                                            )}
                                            {getStatusBadge(member.reviewStatus)}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(member);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Employee Detail */}
                    {selectedEmployee && selectedEmployeeAura && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">
                                {selectedEmployeeAura.fullName}&apos;s Aura Score
                            </h3>
                            <AuraScoreCard data={selectedEmployeeAura} showDetails={true} />
                        </div>
                    )}
                </TabsContent>

                {/* Peer Feedback Tab */}
                <TabsContent value="peer-feedback" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Peer Feedback Management
                            </CardTitle>
                            <CardDescription>
                                Collect anonymous feedback from colleagues (5-point rating on Support, Collaboration, Communication)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-800 mb-2">Peer Feedback Criteria</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <Star className="h-4 w-4" />
                                            <span>Support Rating (1-5)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <Users className="h-4 w-4" />
                                            <span>Collaboration Rating (1-5)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>Communication Rating (1-5)</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-3">
                                        Peer feedback contributes 5% to the Collaboration pillar score
                                    </p>
                                </div>

                                {/* Pending feedback requests */}
                                <div>
                                    <h4 className="font-medium mb-3">Request Peer Feedback</h4>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Select employees to request peer feedback for their quarterly review
                                    </p>
                                    <div className="space-y-3">
                                        {teamMembers.slice(0, 5).map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-4 rounded-lg border hover:border-blue-300 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-medium">
                                                        {member.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-900">{member.full_name || 'Unknown'}</span>
                                                        <div className="text-sm text-gray-500">{member.department}</div>
                                                    </div>
                                                </div>
                                                <Button className="bg-blue-600 hover:bg-blue-700">
                                                    Request Feedback
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Weekly Ratings Tab */}
                <TabsContent value="weekly-ratings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5" />
                                Team Lead Weekly Ratings
                            </CardTitle>
                            <CardDescription>
                                Submit weekly ratings for your team members (7 ratings per employee)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h4 className="font-medium text-amber-800 mb-2">Weekly Rating Criteria (Team Lead Only)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                        <div className="space-y-2">
                                            <div className="font-medium text-amber-900">Technical (25%)</div>
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <Target className="h-4 w-4" />
                                                <span>Technical Score (1-5)</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="font-medium text-amber-900">Behavioral (25%)</div>
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <Users className="h-4 w-4" />
                                                <span>Teamwork (1-5)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <TrendingUp className="h-4 w-4" />
                                                <span>Initiative (1-5)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <Award className="h-4 w-4" />
                                                <span>Adaptability (1-5)</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="font-medium text-amber-900">Culture Fit (25%)</div>
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <Star className="h-4 w-4" />
                                                <span>Attitude (1-5)</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <Award className="h-4 w-4" />
                                                <span>Integrity (1-5)</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="font-medium text-amber-900">Growth (25%)</div>
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <TrendingUp className="h-4 w-4" />
                                                <span>Self-Initiative (1-5)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-3">
                                        These 7 ratings complement auto-calculated metrics (attendance, tasks, training, engagement)
                                    </p>
                                </div>

                                {/* Employee list for rating */}
                                <div className="space-y-3">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 rounded-lg border hover:border-indigo-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                                    {member.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900">{member.full_name || 'Unknown'}</span>
                                                    <div className="text-sm text-gray-500">{member.department}</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant={member.reviewStatus === 'completed' ? 'outline' : 'default'}
                                                className={member.reviewStatus === 'completed' ? '' : 'bg-indigo-600 hover:bg-indigo-700'}
                                            >
                                                {member.reviewStatus === 'completed' ? 'View Rating' : 'Rate Now'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="pt-6">
                                <BarChart3 className="h-8 w-8 text-indigo-600 mb-3" />
                                <h3 className="font-semibold text-lg">Department Performance</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Compare average Aura scores across departments
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="pt-6">
                                <TrendingUp className="h-8 w-8 text-emerald-600 mb-3" />
                                <h3 className="font-semibold text-lg">Promotion Eligibility</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    View employees eligible for promotions (Grade A for 2+ quarters)
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="pt-6">
                                <Award className="h-8 w-8 text-amber-600 mb-3" />
                                <h3 className="font-semibold text-lg">Top Performers</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Leaderboard of highest Aura scores
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="pt-6">
                                <Clock className="h-8 w-8 text-red-600 mb-3" />
                                <h3 className="font-semibold text-lg">PIP Dashboard</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Track employees on Performance Improvement Plans
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && employeeToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Delete Staff Member</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-800">
                                Are you sure you want to delete <strong>{employeeToDelete.full_name}</strong>?
                                This will permanently remove their profile, performance data, and all associated records.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setEmployeeToDelete(null);
                                }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Staff
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
