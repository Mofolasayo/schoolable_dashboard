'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Clock,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Users,
    Calendar,
    RefreshCw,
    Timer,
    HelpCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';

// Types
interface LateCheckIn {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    department: string;
    checkInTime: string;
    minutesLate: number;
    reason: string;
    reasonCategory: string;
    date: string;
}

interface RepeatOffender {
    id: string;
    name: string;
    avatar: string;
    department: string;
    lateCount: number;
    averageMinutesLate: number;
    trend: 'improving' | 'worsening' | 'stable';
    lastLateDate: string;
}

interface AnalyticsSummary {
    totalLateCheckIns: number;
    averageMinutesLate: number;
    onTimeRate: number;
    repeatOffenderCount: number;
    totalAttendanceRecords: number;
}

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

async function fetchLateAnalytics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${API_BASE}/api/admin/late-analytics?${params}`, {
        headers: await getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch late analytics');
    return res.json();
}

const REASON_COLORS: Record<string, string> = {
    traffic: '#f59e0b',
    health: '#ef4444',
    weather: '#3b82f6',
    family: '#8b5cf6',
    work: '#10b981',
    other: '#6b7280',
};

export default function LateAnalyticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [lateCheckIns, setLateCheckIns] = useState<LateCheckIn[]>([]);
    const [repeatOffenders, setRepeatOffenders] = useState<RepeatOffender[]>([]);
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [dailyBreakdown, setDailyBreakdown] = useState<{ name: string; late: number; onTime: number }[]>([]);
    const [reasonBreakdown, setReasonBreakdown] = useState<Record<string, number>>({});
    const [departmentBreakdown, setDepartmentBreakdown] = useState<Record<string, number>>({});
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const getDateRange = () => {
        const end = new Date();
        const start = new Date();

        switch (timeRange) {
            case 'week':
                start.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setDate(end.getDate() - 30);
                break;
            case 'quarter':
                start.setDate(end.getDate() - 90);
                break;
        }

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { startDate, endDate } = getDateRange();
            const data = await fetchLateAnalytics(startDate, endDate);

            setLateCheckIns(data.lateCheckIns || []);
            setRepeatOffenders(data.repeatOffenders || []);
            setSummary(data.summary || null);
            setReasonBreakdown(data.reasonBreakdown || {});
            setDepartmentBreakdown(data.departmentBreakdown || {});

            // Transform daily breakdown for chart
            const daily = (data.dailyBreakdown || []).map((d: { date: string; late: number; onTime: number }) => ({
                name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                late: d.late,
                onTime: d.onTime,
            }));
            setDailyBreakdown(daily);
        } catch (err) {
            console.error('Error fetching late analytics:', err);
            setError('Failed to load late analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate stats from summary or fallback
    const totalLateThisMonth = summary?.totalLateCheckIns || lateCheckIns.length;
    const avgMinutesLate = summary?.averageMinutesLate ||
        (lateCheckIns.length > 0 ? Math.round(lateCheckIns.reduce((sum, l) => sum + l.minutesLate, 0) / lateCheckIns.length) : 0);
    const uniqueLateEmployees = new Set(lateCheckIns.map(l => l.userId)).size;
    const onTimeRate = summary?.onTimeRate || 0;

    // Reason distribution for pie chart
    const reasonDistribution = Object.entries(reasonBreakdown).map(([category, count]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
        color: REASON_COLORS[category] || '#6b7280',
    }));

    // Department distribution for bar chart
    const departmentDistribution = Object.entries(departmentBreakdown)
        .map(([dept, count]) => ({ name: dept, count }))
        .sort((a, b) => b.count - a.count);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-xl font-normal text-gray-800">Late Check-in Analytics</h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Track late patterns, common reasons, and identify repeat offenders
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-md border border-border/40 bg-white p-1">
                        {(['week', 'month', 'quarter'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${timeRange === range
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-orange-100 p-2">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Late Check-ins</span>
                        </div>
                        <p className="text-3xl font-normal text-orange-600">{totalLateThisMonth}</p>
                        <p className="text-xs text-muted-foreground mt-1">This {timeRange}</p>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-red-100 p-2">
                                <Timer className="h-5 w-5 text-red-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Avg. Minutes Late</span>
                        </div>
                        <p className="text-3xl font-normal">{avgMinutesLate} <span className="text-sm text-muted-foreground">min</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Average delay</p>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-amber-100 p-2">
                                <Users className="h-5 w-5 text-amber-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Unique Late Staff</span>
                        </div>
                        <p className="text-3xl font-normal">{uniqueLateEmployees}</p>
                        <p className="text-xs text-muted-foreground mt-1">Different employees</p>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-emerald-100 p-2">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">On-Time Rate</span>
                        </div>
                        <p className="text-3xl font-normal text-emerald-600">{onTimeRate}%</p>
                        <Progress value={onTimeRate} className="h-1.5 mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="overview" className="text-xs">
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                        Trends
                    </TabsTrigger>
                    <TabsTrigger value="reasons" className="text-xs">
                        <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                        Top Reasons
                    </TabsTrigger>
                    <TabsTrigger value="offenders" className="text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        Repeat Offenders
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="text-xs">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Recent Late Check-ins
                    </TabsTrigger>
                </TabsList>

                {/* Trends Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Late Check-ins Trend */}
                        <Card className="border-border/40">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-normal">Late Check-ins Over Time</CardTitle>
                                <CardDescription className="text-xs">Weekly trend analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyBreakdown}>
                                            <defs>
                                                <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="lateCount"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                fill="url(#colorLate)"
                                                name="Late Check-ins"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* On-Time Rate Trend */}
                        <Card className="border-border/40">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-normal">On-Time Rate Improvement</CardTitle>
                                <CardDescription className="text-xs">Punctuality percentage over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyBreakdown}>
                                            <defs>
                                                <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                }}
                                                formatter={(value) => [`${value}%`, 'On-Time Rate']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="onTimeRate"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                fill="url(#colorOnTime)"
                                                name="On-Time Rate"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Reasons Tab */}
                <TabsContent value="reasons" className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Pie Chart */}
                        <Card className="border-border/40">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-normal">Late Reasons Distribution</CardTitle>
                                <CardDescription className="text-xs">Breakdown by category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={reasonDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {reasonDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {reasonDistribution.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs text-muted-foreground">{item.name}</span>
                                            <span className="text-xs font-medium ml-auto">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* By Department */}
                        <Card className="border-border/40">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-normal">Late Check-ins by Department</CardTitle>
                                <CardDescription className="text-xs">Which teams are most affected</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={departmentDistribution} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Repeat Offenders Tab */}
                <TabsContent value="offenders" className="space-y-4">
                    <Card className="border-border/40 border-red-200">
                        <CardHeader className="pb-3 bg-red-50/50 border-b border-red-100">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <div>
                                    <CardTitle className="text-sm font-normal">Repeat Late Check-ins</CardTitle>
                                    <CardDescription className="text-xs">
                                        Team members with multiple late check-ins this {timeRange}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {repeatOffenders.map((person, index) => (
                                    <div
                                        key={person.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <Avatar className="h-10 w-10 border border-border/40">
                                                <AvatarImage src={person.avatar} />
                                                <AvatarFallback>{person.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{person.name}</p>
                                                <p className="text-xs text-muted-foreground">{person.department}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-lg font-semibold text-red-600">{person.lateCount}</p>
                                                <p className="text-[10px] text-muted-foreground">Late Check-ins</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-semibold">{person.averageMinutesLate}</p>
                                                <p className="text-[10px] text-muted-foreground">Avg Minutes</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {person.trend === 'improving' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                                                        <TrendingDown className="h-3 w-3 mr-1" />
                                                        Improving
                                                    </Badge>
                                                ) : person.trend === 'worsening' ? (
                                                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                                                        <TrendingUp className="h-3 w-3 mr-1" />
                                                        Worsening
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">
                                                        Stable
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Suggestions */}
                            <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-100">
                                <h4 className="text-xs font-medium text-amber-800 mb-2">💡 Suggested Actions</h4>
                                <ul className="text-[11px] text-amber-700 space-y-1">
                                    <li>• Schedule 1-on-1 meetings with repeat offenders to understand underlying issues</li>
                                    <li>• Consider flexible work hours for staff with legitimate commute challenges</li>
                                    <li>• Implement Aura score penalties for chronic lateness ({'>'}5 times/month)</li>
                                    <li>• Recognize and reward staff with perfect attendance records</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Recent Late Check-ins Tab */}
                <TabsContent value="recent" className="space-y-4">
                    <Card className="border-border/40">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-normal">Recent Late Check-ins</CardTitle>
                            <CardDescription className="text-xs">Latest late arrivals with reasons</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-border/40">
                                {lateCheckIns.slice(0, 10).map((checkIn) => (
                                    <div key={checkIn.id} className="py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-border/40">
                                                    <AvatarImage src={checkIn.userAvatar} />
                                                    <AvatarFallback>{checkIn.userName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{checkIn.userName}</p>
                                                    <p className="text-xs text-muted-foreground">{checkIn.department}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-right">
                                                <div>
                                                    <p className="text-sm font-medium text-orange-600">{checkIn.checkInTime}</p>
                                                    <p className="text-[10px] text-muted-foreground">+{checkIn.minutesLate} min late</p>
                                                </div>
                                                <Badge
                                                    className="text-[9px]"
                                                    style={{ backgroundColor: `${REASON_COLORS[checkIn.reasonCategory]}20`, color: REASON_COLORS[checkIn.reasonCategory] }}
                                                >
                                                    {checkIn.reasonCategory}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground pl-12">&quot;{checkIn.reason}&quot;</p>
                                        <p className="text-[10px] text-muted-foreground pl-12 mt-1">{checkIn.date}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
