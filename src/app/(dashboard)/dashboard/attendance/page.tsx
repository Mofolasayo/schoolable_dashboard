'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  RefreshCw,
  Clock,
  CalendarDays,
} from 'lucide-react';
import {
  getTodayAttendance,
  getAttendanceMetrics,
  getAttendanceRange,
  type AttendanceRecord,
  type AttendanceMetrics,
} from '@/app/actions/attendance';
import {
  TimeRangeSelector,
  CustomDateRangePicker,
  type TimeRange,
} from '@/components/filters/TimeRangeSelector';
import Link from 'next/link';

// Helper to generate avatar URL
function getAvatarUrl(user?: AttendanceRecord['user']): string {
  if (!user) return 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown';
  if (user.avatar_url) return user.avatar_url;

  const seed = user.email || user.full_name || 'User';
  const style = 'bottts';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Helper to format check-in time and calculate early/late status
function formatCheckInStatus(checkIn: string | null): {
  time: string;
  statusText: string;
  isEarly: boolean;
  isLate: boolean;
} {
  if (!checkIn) {
    return {
      time: '—',
      statusText: 'No check-in',
      isEarly: false,
      isLate: false,
    };
  }

  const checkInDate = new Date(checkIn);
  const hours = checkInDate.getHours();
  const minutes = checkInDate.getMinutes();
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // 9:00 AM is the deadline
  const deadline = 9 * 60; // 9:00 in minutes
  const checkInMinutes = hours * 60 + minutes;
  const diff = deadline - checkInMinutes;

  if (diff > 0) {
    return {
      time,
      statusText: `${diff} min early`,
      isEarly: true,
      isLate: false,
    };
  } else if (diff < 0) {
    return {
      time,
      statusText: `${Math.abs(diff)} min late`,
      isEarly: false,
      isLate: true,
    };
  }
  return { time, statusText: 'On time', isEarly: true, isLate: false };
}

function normalizeStatus(status?: string | null): string {
  const value = (status || '').toLowerCase();
  return value === 'excused' ? 'late' : value;
}

function formatStatusLabel(status?: string | null): string {
  const normalized = normalizeStatus(status);
  if (!normalized) return 'Unknown';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

// Status color mappings
function getStatusColor(status: string): string {
  switch (normalizeStatus(status)) {
    case 'present':
      return 'bg-emerald-100 text-emerald-700';
    case 'late':
      return 'bg-orange-100 text-orange-700';
    case 'absent':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function formatDateLabel(date: Date): string {
  const [label] = date.toISOString().split('T');
  return label ?? '';
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolveAttendanceRange(
  timeRange: TimeRange,
  customStartDate: string,
  customEndDate: string
) {
  const today = new Date();
  let startDate = formatDateLabel(today);
  let endDate = formatDateLabel(today);

  if (timeRange === 'week') {
    startDate = formatDateLabel(addDays(today, -6));
  } else if (timeRange === 'month') {
    startDate = formatDateLabel(addDays(today, -29));
  } else if (timeRange === 'custom') {
    startDate = customStartDate;
    endDate = customEndDate;
  }

  if (!startDate || !endDate) {
    return { startDate: '', endDate: '', label: 'Custom range' };
  }

  if (startDate > endDate) {
    const swap = startDate;
    startDate = endDate;
    endDate = swap;
  }

  return {
    startDate,
    endDate,
    label: startDate === endDate ? startDate : `${startDate} - ${endDate}`,
  };
}

function buildRangeMetrics(
  logs: AttendanceRecord[],
  startDate: string,
  endDate: string
): AttendanceMetrics {
  const counts = logs.reduce(
    (acc, log) => {
      const status = normalizeStatus(log.status);
      if (status === 'present') acc.present += 1;
      else if (status === 'late') acc.late += 1;
      else if (status === 'absent') acc.absent += 1;
      return acc;
    },
    { present: 0, late: 0, absent: 0 }
  );

  const totalCheckedIn = counts.present + counts.late;
  const totalRecords = logs.length;

  return {
    date: startDate === endDate ? startDate : `${startDate} - ${endDate}`,
    present: counts.present,
    late: counts.late,
    absent: counts.absent,
    total_checked_in: totalCheckedIn,
    total_staff: totalRecords,
    pending: 0,
    attendance_rate:
      totalRecords > 0 ? Math.round((totalCheckedIn / totalRecords) * 100) : 0,
  };
}

export default function AttendanceMonitoringPage() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<AttendanceRecord | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const recordsPerPage = 10;
  const totalRecords = attendanceLogs.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const selectedPhotoUrl =
    selectedLog?.photo?.url || selectedLog?.photo_url || null;

  // Paginated records
  const paginatedLogs = attendanceLogs.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const fetchData = useCallback(async () => {
    const range = resolveAttendanceRange(
      timeRange,
      customStartDate,
      customEndDate
    );
    if (timeRange === 'custom' && (!range.startDate || !range.endDate)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const logsData =
        timeRange === 'today'
          ? await getTodayAttendance()
          : await getAttendanceRange(range.startDate, range.endDate);
      const metricsData =
        timeRange === 'today'
          ? await getAttendanceMetrics()
          : buildRangeMetrics(logsData, range.startDate, range.endDate);
      setAttendanceLogs(logsData);
      setMetrics(metricsData);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
    // Refresh every 2 minutes
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Build map URL with markers
  const buildMapUrl = () => {
    // Base map centered on Lagos, Nigeria (VGC area)
    const baseUrl =
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.5483!2d3.4712!3d6.4427!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf737b1b1b1b1%3A0x1b1b1b1b1b1b1b1b!2sVictoria%20Garden%20City%20(VGC)%2C%20Lekki%2C%20Lagos%2C%20Nigeria!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus';
    return baseUrl;
  };

  // Get locations with coordinates for the map overlay
  const locationsWithCoords = attendanceLogs.filter(
    (log) => log.latitude !== null && log.longitude !== null
  );
  const resolvedRange = resolveAttendanceRange(
    timeRange,
    customStartDate,
    customEndDate
  );
  const isRangeView = timeRange !== 'today';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">
            Staff Attendance
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Visualize check-ins, locations, and attendance exceptions in real
            time.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Link
            href="/dashboard/attendance-calendar"
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </Link>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
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

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Check-in Map Section */}
      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-normal text-gray-700">Check-in map</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              See where staff are checking in across locations.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/40 bg-white px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {isRangeView ? 'Range' : 'Live'} • {locationsWithCoords.length}{' '}
              check-ins
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-[500px] w-full overflow-hidden rounded-lg border border-border/40">
          <iframe
            src={buildMapUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
            title="Attendance Check-in Map - VGC, Lekki, Nigeria"
          />

          {/* Map Overlay with Check-in Pins - Enhanced with photos and status colors */}
          {locationsWithCoords.length > 0 && (
            <div className="absolute left-4 top-4 max-h-[280px] w-72 overflow-y-auto rounded-lg border border-border/40 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">
                  {isRangeView ? 'Check-ins' : "Today's Check-ins"}
                </p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {locationsWithCoords.length} staff
                </span>
              </div>
              <div className="space-y-2">
                {locationsWithCoords.slice(0, 8).map((log) => {
                  const checkInStatus = formatCheckInStatus(log.check_in);
                  const normalizedStatus = normalizeStatus(log.status);
                  const isLate =
                    normalizedStatus === 'late' || checkInStatus.isLate;
                  const isPresent = normalizedStatus === 'present' && !isLate;
                  const statusLabel = formatStatusLabel(normalizedStatus);
                  const photoUrl = log.photo?.url || log.photo_url || null;

                  return (
                    <div
                      key={log.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/30"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Avatar with status border */}
                      <div className={`relative flex-shrink-0`}>
                        <img
                          src={photoUrl || getAvatarUrl(log.user)}
                          alt={log.user?.full_name || 'Staff'}
                          className={`h-9 w-9 rounded-full object-cover ring-2 ${
                            isLate
                              ? 'ring-orange-500'
                              : isPresent
                                ? 'ring-emerald-500'
                                : 'ring-gray-300'
                          }`}
                        />
                        {/* Status indicator dot */}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                            isLate
                              ? 'bg-orange-500'
                              : isPresent
                                ? 'bg-emerald-500'
                                : 'bg-gray-400'
                          }`}
                        />
                      </div>

                      {/* Name and time */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-800">
                          {log.user?.full_name || 'Unknown'}
                        </p>
                        <p
                          className={`text-[10px] ${isLate ? 'text-orange-600' : 'text-muted-foreground'}`}
                        >
                          {checkInStatus.time} • {checkInStatus.statusText}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                          isLate
                            ? 'bg-orange-100 text-orange-700'
                            : isPresent
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isLate ? 'Late' : statusLabel}
                      </span>
                    </div>
                  );
                })}
                {locationsWithCoords.length > 8 && (
                  <div className="mt-2 border-t border-border/40 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      +{locationsWithCoords.length - 8} more check-ins
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg border border-border/40 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-gray-700">Present/Early</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-700">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-700">Absent</span>
            </div>
          </div>

          {/* Map Note */}
          <div className="absolute bottom-4 right-4 rounded-lg border border-border/40 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] text-muted-foreground">
              Clustered pins represent multiple check-ins at the same site.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Present */}
        <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Present</span>
          </div>
          <p className="mb-1 text-3xl font-normal tracking-tight text-gray-800">
            {isLoading ? '...' : (metrics?.present ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRangeView
              ? `${metrics?.attendance_rate ?? 0}% attendance rate across ${resolvedRange.label}.`
              : metrics?.total_staff
                ? `${Math.round((metrics.present / metrics.total_staff) * 100)}% of scheduled staff checked in on time.`
                : 'Loading metrics...'}
          </p>
        </div>

        {/* Late */}
        <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Late</span>
          </div>
          <p className="mb-1 text-3xl font-normal tracking-tight text-gray-800">
            {isLoading ? '...' : (metrics?.late ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            Staff who checked in after 9:00 AM.
          </p>
        </div>

        {/* Absent/Pending */}
        <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {isRangeView ? 'Absent' : 'Pending'}
            </span>
          </div>
          <p className="mb-1 text-3xl font-normal tracking-tight text-gray-800">
            {isLoading
              ? '...'
              : isRangeView
                ? (metrics?.absent ?? 0)
                : (metrics?.pending ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRangeView
              ? 'Records marked absent in the selected range.'
              : "Staff who haven't checked in yet today."}
          </p>
        </div>
      </div>

      {/* Attendance Logs Section */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="border-b border-border/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-normal text-gray-700">
                Attendance logs
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Detailed check-in records with photo verification.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {totalRecords} records{' '}
                {isRangeView ? `(${resolvedRange.label})` : 'today'}
              </span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && attendanceLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12">
            <MapPin className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              No check-ins yet
            </p>
            <p className="text-xs text-muted-foreground">
              Staff attendance records will appear here.
            </p>
          </div>
        )}

        {/* Attendance Logs Table */}
        {!isLoading && attendanceLogs.length > 0 && (
          <div className="divide-y divide-border/40">
            {paginatedLogs.map((log) => {
              const checkInStatus = formatCheckInStatus(log.check_in);
              const photoUrl = log.photo?.url || log.photo_url || null;
              return (
                <div
                  key={log.id}
                  className={`p-6 transition-colors hover:bg-muted/20 ${
                    photoUrl ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (photoUrl) {
                      setSelectedLog(log);
                    }
                  }}
                >
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* Staff */}
                    <div className="flex items-start gap-3">
                      <img
                        src={getAvatarUrl(log.user)}
                        alt={log.user?.full_name || 'Unknown'}
                        className="h-10 w-10 rounded-full ring-2 ring-white"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {log.user?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.user?.job_title || log.user?.department || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Check-in */}
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-800">
                        {checkInStatus.time}
                      </p>
                      <p
                        className={`text-xs ${
                          checkInStatus.isEarly
                            ? 'text-emerald-600'
                            : checkInStatus.isLate
                              ? 'text-orange-600'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {checkInStatus.statusText}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {formatStatusLabel(log.status)}
                      </span>
                    </div>

                    {/* Location */}
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-800">
                        {log.location || 'Unknown Location'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.address || '—'}
                      </p>
                    </div>

                    {/* Verification */}
                    <div>
                      {photoUrl ? (
                        <div>
                          <img
                            src={photoUrl}
                            alt="Verification"
                            className="mb-2 h-12 w-12 rounded-md border border-border/40 object-cover"
                          />
                          <p className="mb-1 text-xs text-gray-700">
                            {log.note || 'Checked in via mobile.'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.verification_status === 'verified'
                              ? `Verified • Face match ${log.face_match_score ?? '—'}%`
                              : log.verification_status === 'flagged'
                                ? 'Flagged for review'
                                : 'Pending verification'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">
                            No photo captured
                          </p>
                          <p className="text-xs text-gray-700">
                            {log.note || '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalRecords > recordsPerPage && (
          <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * recordsPerPage + 1}-
              {Math.min(currentPage * recordsPerPage, totalRecords)} of{' '}
              {totalRecords} records
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

      {/* Photo Verification Modal */}
      {selectedLog && selectedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
              <div>
                <h3 className="text-base font-medium text-gray-800">
                  Photo verification
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedLog.user?.full_name || 'Unknown'} • Today at{' '}
                  {formatCheckInStatus(selectedLog.check_in).time} •{' '}
                  {selectedLog.location || 'Unknown Location'}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Image */}
              <div className="mb-4 overflow-hidden rounded-lg border border-border/40">
                <img
                  src={selectedPhotoUrl}
                  alt="Verification photo"
                  className="h-auto max-h-[400px] w-full object-contain"
                />
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground/70">
                    Status
                  </p>
                  <p className="text-sm capitalize text-gray-800">
                    {formatStatusLabel(selectedLog.status)} •{' '}
                    {formatCheckInStatus(selectedLog.check_in).statusText}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground/70">
                    Location
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedLog.address || selectedLog.location || 'Unknown'} •{' '}
                    {selectedLog.location || 'Unknown Office'}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground/70">
                    Verification
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedLog.verification_status === 'verified'
                      ? `Face match ${selectedLog.face_match_score ?? '—'}%`
                      : selectedLog.verification_status === 'flagged'
                        ? 'Flagged for review'
                        : 'Pending verification'}
                    {selectedLog.accuracy
                      ? ` • GPS accuracy ${Math.round(selectedLog.accuracy)}m`
                      : ''}
                  </p>
                </div>
                {selectedLog.note && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground/70">
                      Notes
                    </p>
                    <p className="text-sm text-gray-800">{selectedLog.note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border/40 p-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Close
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                Mark as reviewed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
