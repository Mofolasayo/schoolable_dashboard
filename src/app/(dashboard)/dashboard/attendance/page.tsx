'use client';

import { useState } from 'react';
import {
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

// Mock data for attendance logs
const attendanceLogs = [
  {
    id: 1,
    name: 'Maria Garcia',
    title: 'Sales Associate',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    checkIn: '08:57',
    checkInStatus: '3 min early',
    status: 'Present',
    statusColor: 'bg-emerald-100 text-emerald-700',
    location: 'HQ - Main Office Entrance',
    address: '125 Market St, San Francisco',
    verificationPhoto:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    notes: 'Checked in via mobile.',
    verification: 'Verified • Face match 98%',
    fullDetails: {
      status: 'Present • On time',
      location: '125 Market St, San Francisco • Geofence: HQ',
      verification: 'Face match 98% • GPS accuracy 12m',
      notes: 'No anomalies detected for this check-in.',
    },
  },
  {
    id: 2,
    name: 'David Kim',
    title: 'Support Specialist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    checkIn: '09:14',
    checkInStatus: '14 min late',
    status: 'Late',
    statusColor: 'bg-orange-100 text-orange-700',
    location: 'HQ - Side Entrance',
    address: '125 Market St, San Francisco',
    verificationPhoto:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    notes: 'Traffic delay reported.',
    verification: 'Manager notified',
    fullDetails: {
      status: 'Late • 14 min late',
      location: '125 Market St, San Francisco • Geofence: HQ',
      verification: 'Face match 95% • GPS accuracy 15m',
      notes: 'Traffic delay reported. Manager notified.',
    },
  },
  {
    id: 3,
    name: 'Priya Singh',
    title: 'Ops Coordinator',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    checkIn: '—',
    checkInStatus: 'No check-in',
    status: 'Absent',
    statusColor: 'bg-red-100 text-red-700',
    location: 'Assigned: HQ - Main Office',
    address: 'Schedule 09:00-17:00',
    verificationPhoto: null,
    notes: 'Escalate if not updated by 10:00.',
    verification: 'Auto rule: Attendance',
    fullDetails: null,
  },
];

export default function AttendanceMonitoringPage() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<
    (typeof attendanceLogs)[0] | null
  >(null);
  const totalRecords = 48;
  const recordsPerPage = 3;

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
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Select range
          </button>
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

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
              Live • 2 min delay
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-[500px] w-full overflow-hidden rounded-lg border border-border/40">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.5483!2d3.4712!3d6.4427!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf737b1b1b1b1%3A0x1b1b1b1b1b1b1b1b!2sVictoria%20Garden%20City%20(VGC)%2C%20Lekki%2C%20Lagos%2C%20Nigeria!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
            title="Attendance Check-in Map - VGC, Lekki, Nigeria"
          />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg border border-border/40 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-gray-700">Present</span>
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
            128
          </p>
          <p className="text-xs text-muted-foreground">
            84% of scheduled staff checked in.
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
            14
          </p>
          <p className="text-xs text-muted-foreground">
            Most late arrivals are from Sales and Support.
          </p>
        </div>

        {/* Absent */}
        <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Absent</span>
          </div>
          <p className="mb-1 text-3xl font-normal tracking-tight text-gray-800">
            10
          </p>
          <p className="text-xs text-muted-foreground">
            Review patterns with managers for follow-up.
          </p>
        </div>
      </div>

      {/* Attendance Logs Section */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="border-b border-border/40 p-6">
          <div>
            <h2 className="text-sm font-normal text-gray-700">
              Attendance logs
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Detailed check-in records with photo verification.
            </p>
          </div>
        </div>

        {/* Attendance Logs Table */}
        <div className="divide-y divide-border/40">
          {attendanceLogs.map((log) => (
            <div
              key={log.id}
              className={`p-6 transition-colors hover:bg-muted/20 ${log.verificationPhoto ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (log.verificationPhoto) {
                  setSelectedLog(log);
                }
              }}
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Staff */}
                <div className="flex items-start gap-3">
                  <img
                    src={log.avatar}
                    alt={log.name}
                    className="h-10 w-10 rounded-full ring-2 ring-white"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {log.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.title}</p>
                  </div>
                </div>

                {/* Check-in */}
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-800">
                    {log.checkIn}
                  </p>
                  <p
                    className={`text-xs ${log.checkInStatus.includes('early') ? 'text-emerald-600' : log.checkInStatus.includes('late') ? 'text-orange-600' : 'text-muted-foreground'}`}
                  >
                    {log.checkInStatus}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${log.statusColor}`}
                  >
                    {log.status}
                  </span>
                </div>

                {/* Location */}
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-800">
                    {log.location}
                  </p>
                  <p className="text-xs text-muted-foreground">{log.address}</p>
                </div>

                {/* Verification */}
                <div>
                  {log.verificationPhoto ? (
                    <div>
                      <img
                        src={log.verificationPhoto}
                        alt="Verification"
                        className="mb-2 h-12 w-12 rounded-md border border-border/40 object-cover"
                      />
                      <p className="mb-1 text-xs text-gray-700">{log.notes}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.verification}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        Awaiting check-in
                      </p>
                      <p className="mb-1 text-xs text-gray-700">{log.notes}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.verification}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
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
              disabled={currentPage * recordsPerPage >= totalRecords}
              className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Photo Verification Modal */}
      {selectedLog && selectedLog.verificationPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
              <div>
                <h3 className="text-base font-medium text-gray-800">
                  Photo verification
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedLog.name} • Today at {selectedLog.checkIn} •{' '}
                  {selectedLog.location}
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
                  src={selectedLog.verificationPhoto}
                  alt="Verification photo"
                  className="h-auto max-h-[400px] w-full object-contain"
                />
              </div>

              {/* Details */}
              {selectedLog.fullDetails && (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground/70">
                      Status
                    </p>
                    <p className="text-sm text-gray-800">
                      {selectedLog.fullDetails.status}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground/70">
                      Location
                    </p>
                    <p className="text-sm text-gray-800">
                      {selectedLog.fullDetails.location}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground/70">
                      Verification
                    </p>
                    <p className="text-sm text-gray-800">
                      {selectedLog.fullDetails.verification}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground/70">
                      Notes
                    </p>
                    <p className="text-sm text-gray-800">
                      {selectedLog.fullDetails.notes}
                    </p>
                  </div>
                </div>
              )}
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
