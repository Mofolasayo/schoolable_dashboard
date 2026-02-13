'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { getLateAnalytics } from '@/app/actions/late-analytics';
import {
  TimeRangeSelector,
  CustomDateRangePicker,
  type TimeRange,
} from '@/components/filters/TimeRangeSelector';

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
  const [dailyBreakdown, setDailyBreakdown] = useState<
    {
      name: string;
      lateCount: number;
      onTimeRate: number;
      late: number;
      onTime: number;
      total: number;
    }[]
  >([]);
  const [reasonBreakdown, setReasonBreakdown] = useState<
    Record<string, number>
  >({});
  const [departmentBreakdown, setDepartmentBreakdown] = useState<
    Record<string, number>
  >({});
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [timeRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case 'today':
        break;
      case 'week':
        start.setDate(end.getDate() - 6);
        break;
      case 'month':
        start.setDate(end.getDate() - 29);
        break;
      case 'custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };
      default:
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const fetchData = async () => {
    if (timeRange === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const data = await getLateAnalytics(startDate, endDate);

      const late = Array.isArray(data.lateCheckIns)
        ? (data.lateCheckIns as LateCheckIn[])
        : [];
      const offenders = Array.isArray(data.repeatOffenders)
        ? (data.repeatOffenders as RepeatOffender[])
        : [];
      setLateCheckIns(late);
      setRepeatOffenders(offenders);
      setSummary(data.summary || null);
      setReasonBreakdown(data.reasonBreakdown || {});
      setDepartmentBreakdown(data.departmentBreakdown || {});

      // Transform daily breakdown for chart
      const daily = (data.dailyBreakdown || []).map(
        (d: { date: string; late: number; onTime: number }) => {
          const late = Number(d.late || 0);
          const onTime = Number(d.onTime || 0);
          const total = late + onTime;
          const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

          return {
            name: new Date(d.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            lateCount: late,
            onTimeRate,
            late,
            onTime,
            total,
          };
        }
      );
      setDailyBreakdown(daily);
    } catch (err) {
      console.error('Error fetching late analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from summary or fallback
  const totalLateThisMonth = summary?.totalLateCheckIns || lateCheckIns.length;
  const avgMinutesLate =
    summary?.averageMinutesLate ||
    (lateCheckIns.length > 0
      ? Math.round(
          lateCheckIns.reduce((sum, l) => sum + l.minutesLate, 0) /
            lateCheckIns.length
        )
      : 0);
  const uniqueLateEmployees = new Set(lateCheckIns.map((l) => l.userId)).size;
  const onTimeRate = summary?.onTimeRate || 0;

  const effectiveReasonBreakdown = useMemo(() => {
    if (Object.keys(reasonBreakdown).length > 0) return reasonBreakdown;
    if (lateCheckIns.length === 0) return {};

    return lateCheckIns.reduce<Record<string, number>>((acc, item) => {
      const category = (item.reasonCategory || 'other').toLowerCase();
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }, [reasonBreakdown, lateCheckIns]);

  const effectiveRepeatOffenders = useMemo(() => {
    if (repeatOffenders.length > 0) return repeatOffenders;
    if (lateCheckIns.length === 0) return [];

    const stats = new Map<
      string,
      {
        id: string;
        name: string;
        avatar: string;
        department: string;
        lateCount: number;
        totalMinutes: number;
        lastLateDate: string;
      }
    >();

    lateCheckIns.forEach((checkIn) => {
      const key = checkIn.userId || checkIn.id;
      if (!key) return;

      const existing = stats.get(key);
      const nextDate = checkIn.date || existing?.lastLateDate || '';

      if (existing) {
        existing.lateCount += 1;
        existing.totalMinutes += checkIn.minutesLate || 0;
        existing.lastLateDate =
          nextDate > existing.lastLateDate ? nextDate : existing.lastLateDate;
      } else {
        stats.set(key, {
          id: key,
          name: checkIn.userName,
          avatar: checkIn.userAvatar,
          department: checkIn.department,
          lateCount: 1,
          totalMinutes: checkIn.minutesLate || 0,
          lastLateDate: nextDate,
        });
      }
    });

    return Array.from(stats.values())
      .filter((item) => item.lateCount >= 3)
      .map((item) => ({
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        department: item.department,
        lateCount: item.lateCount,
        averageMinutesLate: Math.round(item.totalMinutes / item.lateCount),
        trend: 'stable' as const,
        lastLateDate: item.lastLateDate,
      }))
      .sort((a, b) => b.lateCount - a.lateCount);
  }, [repeatOffenders, lateCheckIns]);

  // Reason distribution for pie chart
  const reasonDistribution = Object.entries(effectiveReasonBreakdown).map(
    ([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count,
      color: REASON_COLORS[category] || '#6b7280',
    })
  );

  // Department distribution for bar chart
  const departmentDistribution = Object.entries(departmentBreakdown)
    .map(([dept, count]) => ({ name: dept, count }))
    .sort((a, b) => b.count - a.count);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const rangeLabel =
    timeRange === 'custom'
      ? customStartDate && customEndDate
        ? `${customStartDate} - ${customEndDate}`
        : 'Custom'
      : timeRange;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            Late Check-in Analytics
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track late patterns, common reasons, and identify repeat offenders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {timeRange === 'custom' && (
        <CustomDateRangePicker
          startDate={customStartDate}
          endDate={customEndDate}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          onApply={fetchData}
          onReset={() => {
            setTimeRange('today');
            setCustomStartDate('');
            setCustomEndDate('');
          }}
          applyDisabled={!customStartDate || !customEndDate}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-orange-100 p-2">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Late Check-ins
              </span>
            </div>
            <p className="text-3xl font-normal text-orange-600">
              {totalLateThisMonth}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This {rangeLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <Timer className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Avg. Minutes Late
              </span>
            </div>
            <p className="text-3xl font-normal">
              {avgMinutesLate}{' '}
              <span className="text-sm text-muted-foreground">min</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Average delay</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Unique Late Staff
              </span>
            </div>
            <p className="text-3xl font-normal">{uniqueLateEmployees}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Different employees
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                On-Time Rate
              </span>
            </div>
            <p className="text-3xl font-normal text-emerald-600">
              {onTimeRate}%
            </p>
            <Progress value={onTimeRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="text-xs">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="reasons" className="text-xs">
            <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
            Top Reasons
          </TabsTrigger>
          <TabsTrigger value="offenders" className="text-xs">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Repeat Offenders
          </TabsTrigger>
          <TabsTrigger value="recent" className="text-xs">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Recent Late Check-ins
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Late Check-ins Trend */}
            <Card className="border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-normal">
                  Late Check-ins Over Time
                </CardTitle>
                <CardDescription className="text-xs">
                  Weekly trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {dailyBreakdown.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No late check-in trends for this period.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyBreakdown}>
                        <defs>
                          <linearGradient
                            id="colorLate"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#f59e0b"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f59e0b"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
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
                  )}
                </div>
              </CardContent>
            </Card>

            {/* On-Time Rate Trend */}
            <Card className="border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-normal">
                  On-Time Rate Improvement
                </CardTitle>
                <CardDescription className="text-xs">
                  Punctuality percentage over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {dailyBreakdown.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No on-time rate data yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyBreakdown}>
                        <defs>
                          <linearGradient
                            id="colorOnTime"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                        />
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
                  )}
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
                <CardTitle className="text-sm font-normal">
                  Late Reasons Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Breakdown by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {reasonDistribution.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No late reasons recorded yet.
                    </div>
                  ) : (
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
                  )}
                </div>
                {reasonDistribution.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {reasonDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.name}
                        </span>
                        <span className="ml-auto text-xs font-medium">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Department */}
            <Card className="border-border/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-normal">
                  Late Check-ins by Department
                </CardTitle>
                <CardDescription className="text-xs">
                  Which teams are most affected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {departmentDistribution.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No department data yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentDistribution} layout="vertical">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#f59e0b"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Repeat Offenders Tab */}
        <TabsContent value="offenders" className="space-y-4">
          <Card className="border-border/40 border-red-200">
            <CardHeader className="border-b border-red-100 bg-red-50/50 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <CardTitle className="text-sm font-normal">
                    Repeat Late Check-ins
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Team members with multiple late check-ins this {timeRange}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {effectiveRepeatOffenders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                  No repeat offenders for this period.
                </div>
              ) : (
                <div className="space-y-3">
                  {effectiveRepeatOffenders.map((person, index) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between rounded-lg border border-border/40 p-4 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10 border border-border/40">
                          <AvatarImage src={person.avatar} />
                          <AvatarFallback>{person.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{person.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {person.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-red-600">
                            {person.lateCount}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Late Check-ins
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">
                            {person.averageMinutesLate}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Avg Minutes
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {person.trend === 'improving' ? (
                            <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">
                              <TrendingDown className="mr-1 h-3 w-3" />
                              Improving
                            </Badge>
                          ) : person.trend === 'worsening' ? (
                            <Badge className="border-0 bg-red-100 text-[10px] text-red-700">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              Worsening
                            </Badge>
                          ) : (
                            <Badge className="border-0 bg-gray-100 text-[10px] text-gray-600">
                              Stable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Suggestions */}
              <div className="mt-6 rounded-lg border border-amber-100 bg-amber-50 p-4">
                <h4 className="mb-2 text-xs font-medium text-amber-800">
                  💡 Suggested Actions
                </h4>
                <ul className="space-y-1 text-[11px] text-amber-700">
                  <li>
                    • Schedule 1-on-1 meetings with repeat offenders to
                    understand underlying issues
                  </li>
                  <li>
                    • Consider flexible work hours for staff with legitimate
                    commute challenges
                  </li>
                  <li>
                    • Implement Aura score penalties for chronic lateness ({'>'}
                    5 times/month)
                  </li>
                  <li>
                    • Recognize and reward staff with perfect attendance records
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Late Check-ins Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-normal">
                Recent Late Check-ins
              </CardTitle>
              <CardDescription className="text-xs">
                Latest late arrivals with reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lateCheckIns.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                  No late check-ins recorded for this period.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {lateCheckIns.slice(0, 10).map((checkIn) => (
                    <div key={checkIn.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border/40">
                            <AvatarImage src={checkIn.userAvatar} />
                            <AvatarFallback>
                              {checkIn.userName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {checkIn.userName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {checkIn.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-sm font-medium text-orange-600">
                              {checkIn.checkInTime}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              +{checkIn.minutesLate} min late
                            </p>
                          </div>
                          <Badge
                            className="text-[9px]"
                            style={{
                              backgroundColor: `${REASON_COLORS[checkIn.reasonCategory || 'other']}20`,
                              color:
                                REASON_COLORS[
                                  checkIn.reasonCategory || 'other'
                                ],
                            }}
                          >
                            {checkIn.reasonCategory || 'other'}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-2 pl-12 text-xs text-muted-foreground">
                        &quot;{checkIn.reason}&quot;
                      </p>
                      <p className="mt-1 pl-12 text-[10px] text-muted-foreground">
                        {checkIn.date}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
