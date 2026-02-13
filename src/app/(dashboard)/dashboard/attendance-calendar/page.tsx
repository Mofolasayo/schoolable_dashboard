'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  createHoliday,
  getHolidayCalendar,
  getTimeOffRange,
  type HolidayCalendarItem,
  type TimeOffCalendarItem,
} from '@/app/actions/attendance';
import { getStaffProfiles } from '@/app/actions/staff';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildCalendarDays(currentMonth: Date) {
  const firstOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - startOffset);

  return Array.from({ length: 42 }).map((_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    return {
      date: day,
      dateKey: formatDate(day),
      isCurrentMonth: day.getMonth() === currentMonth.getMonth(),
    };
  });
}

export default function AttendanceCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [holidays, setHolidays] = useState<HolidayCalendarItem[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayDepartment, setHolidayDepartment] = useState('');
  const [holidayIsPaid, setHolidayIsPaid] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );
  const monthStartKey = formatDate(monthStart);
  const monthEndKey = formatDate(monthEnd);

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth),
    [currentMonth]
  );

  const holidayMap = useMemo(() => {
    const map = new Map<string, HolidayCalendarItem[]>();
    holidays.forEach((holiday) => {
      if (!holiday.holiday_date) return;
      const list = map.get(holiday.holiday_date) ?? [];
      list.push(holiday);
      map.set(holiday.holiday_date, list);
    });
    return map;
  }, [holidays]);

  const timeOffRanges = useMemo(() => {
    return timeOff
      .filter((entry) => entry.startDate && entry.endDate)
      .map((entry) => ({
        ...entry,
        start: new Date(entry.startDate as string),
        end: new Date(entry.endDate as string),
      }));
  }, [timeOff]);

  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [holidayData, timeOffData] = await Promise.all([
        getHolidayCalendar(monthStartKey, monthEndKey),
        getTimeOffRange(monthStartKey, monthEndKey),
      ]);
      setHolidays(holidayData);
      setTimeOff(timeOffData);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [monthStartKey, monthEndKey]);

  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const profiles = await getStaffProfiles();
      const uniqueDepartments = Array.from(
        new Set(
          profiles
            .map((profile) => profile.department?.trim())
            .filter((department): department is string => Boolean(department))
        )
      ).sort((a, b) => a.localeCompare(b));
      setDepartments(uniqueDepartments);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateHoliday = async () => {
    setFormError(null);
    if (!startDate || !holidayName) {
      setFormError('Select a start date and enter a holiday name.');
      return;
    }
    setIsSaving(true);
    try {
      const result = await createHoliday({
        startDate,
        endDate: endDate || startDate,
        name: holidayName,
        department: holidayDepartment || undefined,
        isPaid: holidayIsPaid,
      });

      if (result.totalCreated === 0) {
        setFormError('Holiday already exists for the selected range.');
      } else {
        setStartDate('');
        setEndDate('');
        setHolidayName('');
        setHolidayDepartment('');
        await fetchCalendarData();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create holiday.';
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const todayKey = formatDate(new Date());

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>Attendance calendar</span>
          </div>
          <h1 className="mt-2 text-xl font-medium text-slate-900">
            Public holidays & leave calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Highlight non-working days, approved leave, and key attendance
            dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/attendance"
            className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            Back to attendance
          </Link>
          <button
            onClick={fetchCalendarData}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-slate-700">
              Calendar view
            </h2>
            <p className="text-xs text-muted-foreground">
              Holidays, approved leave, and key attendance days for{' '}
              {formatMonthLabel(currentMonth)}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                    1
                  )
                )
              }
              className="rounded-md border border-border/40 bg-white p-1.5 text-slate-500 hover:bg-muted/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {formatMonthLabel(currentMonth)}
            </span>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                    1
                  )
                )
              }
              className="rounded-md border border-border/40 bg-white p-1.5 text-slate-500 hover:bg-muted/50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-[11px] font-medium text-slate-500">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="relative mt-3 h-[500px] w-full overflow-hidden rounded-lg border border-border/40 bg-slate-50/40">
          <div className="grid h-full grid-cols-7 grid-rows-6">
            {calendarDays.map((item) => {
              const holidayItems = holidayMap.get(item.dateKey) ?? [];
              const leaveItems = timeOffRanges.filter(
                (entry) => item.date >= entry.start && item.date <= entry.end
              );

              const isHoliday = holidayItems.length > 0;
              const isLeave = leaveItems.length > 0;
              const isToday = item.dateKey === todayKey;
              const isSelected =
                item.dateKey === startDate || item.dateKey === endDate;
              const holidayLabel = holidayItems[0]?.name || 'Holiday';

              return (
                <div
                  key={item.dateKey}
                  onClick={() => {
                    setStartDate(item.dateKey);
                    setEndDate(item.dateKey);
                    setFormError(null);
                  }}
                  role="button"
                  tabIndex={0}
                  className={`flex flex-col gap-1 border border-border/40 p-2 text-xs transition ${
                    item.isCurrentMonth
                      ? 'bg-white'
                      : 'bg-slate-100/60 text-slate-400'
                  } ${isHoliday ? 'ring-1 ring-rose-200' : ''} ${isLeave ? 'ring-1 ring-indigo-200' : ''} ${
                    isSelected ? 'ring-2 ring-primary/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        isToday
                          ? 'rounded-full bg-primary/10 px-2 py-0.5 text-primary'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.date.getDate()}
                    </span>
                    {(isHoliday || isLeave) && (
                      <div className="flex items-center gap-1">
                        {isHoliday && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        )}
                        {isLeave && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto space-y-1">
                    {isHoliday && (
                      <div className="truncate rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">
                        {holidayLabel}
                      </div>
                    )}
                    {isLeave && (
                      <div className="truncate rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700">
                        Leave
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Public holiday
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            Approved leave
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary/40" />
            Today
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-medium text-slate-700">
            Add public holiday range
          </h2>
          <p className="text-xs text-muted-foreground">
            Create a non-working range (up to a week or more) for holidays or
            company shutdowns.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-border/40 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-border/40 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Holiday name
            </label>
            <input
              type="text"
              value={holidayName}
              onChange={(event) => setHolidayName(event.target.value)}
              placeholder="Public holiday"
              className="w-full rounded-md border border-border/40 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Department (optional)
            </label>
            <select
              value={holidayDepartment}
              onChange={(event) => setHolidayDepartment(event.target.value)}
              className="w-full rounded-md border border-border/40 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {departmentsLoading && (
              <p className="text-[11px] text-muted-foreground">
                Loading departments...
              </p>
            )}
          </div>
          <div className="flex items-end justify-between gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={holidayIsPaid}
                onChange={(event) => setHolidayIsPaid(event.target.checked)}
                className="h-3 w-3 rounded border-border/40 text-primary focus:ring-primary/20"
              />
              Paid holiday
            </label>
            <button
              onClick={handleCreateHoliday}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : 'Add holiday'}
            </button>
          </div>
        </div>

        {formError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {formError}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-700">
                Holidays in {formatMonthLabel(currentMonth)}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {holidays.length} total
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {holidays.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No public holidays this month.
                </p>
              ) : (
                holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between rounded-md border border-border/40 bg-white px-3 py-2 text-xs text-gray-700"
                  >
                    <div>
                      <p className="font-medium text-gray-700">
                        {holiday.name || 'Public holiday'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {holiday.holiday_date || '—'}
                        {holiday.department
                          ? ` • ${holiday.department}`
                          : ' • All departments'}
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">
                      Non-working
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-700">
                Approved leave in {formatMonthLabel(currentMonth)}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {timeOff.length} total
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {timeOff.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No approved leave days this month.
                </p>
              ) : (
                timeOff.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-border/40 bg-white px-3 py-2 text-xs text-gray-700"
                  >
                    <p className="font-medium text-gray-700">
                      {entry.employeeName || 'Employee'} •{' '}
                      {entry.type || 'Leave'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {entry.startDate} → {entry.endDate}
                      {entry.department ? ` • ${entry.department}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
