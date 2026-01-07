/**
 * Backend API Client for Schoolable Dashboard
 * Handles all communication with the Java Spring Boot backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Token storage (server-side uses cookies, but for server actions we need headers)
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.error || error.message || 'An error occurred',
        response.status,
        error
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, error);
  }
}

// ==================== AUTH ====================

export interface LoginResponse {
  token: string;
  profile: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    department?: string;
    avatar_url?: string;
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Store token for subsequent requests
  if (response.token) {
    setAuthToken(response.token);
  }

  return response;
}

export async function getProfile() {
  return apiRequest<StaffProfile>('/profile/me');
}

export async function updateProfile(data: Partial<StaffProfile>): Promise<StaffProfile> {
  return apiRequest<StaffProfile>('/profile/update', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadAvatar(file: File): Promise<{ message: string; avatar_url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Note: We don't use apiRequest here because we need to send FormData
  // and let the browser set the Content-Type header (multipart/form-data)
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/profile/avatar`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.error || error.message || 'Failed to upload avatar', response.status);
  }

  return response.json();
}

// ==================== STAFF ====================

export interface StaffProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  job_title: string | null;
  department: string | null;
  employee_id: string | null;
  status: string | null;
  date_joined: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
}

export async function getStaffProfiles(): Promise<StaffProfile[]> {
  return apiRequest<StaffProfile[]>('/profile/staff');
}

export async function getAllProfiles(): Promise<StaffProfile[]> {
  return apiRequest<StaffProfile[]>('/profile/all');
}

export interface DeleteProfileResponse {
  success: boolean;
  message: string;
  deleted_user: {
    id: string;
    full_name: string;
    email: string;
  };
}

/**
 * Delete a staff profile (Admin only)
 * @param profileId - The UUID of the profile to delete
 */
export async function deleteProfile(profileId: string): Promise<DeleteProfileResponse> {
  return apiRequest<DeleteProfileResponse>(`/profile/${profileId}`, {
    method: 'DELETE',
  });
}

// ==================== ANNOUNCEMENTS ====================

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  audience: string | null;
  pinned: boolean | null;
  status: 'Published' | 'Draft' | 'Scheduled' | null;
  scheduled_at: string | null;
  author_id: string | null;
  created_at: string | null;
  is_read?: boolean;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  audience: string;
  pinned: boolean;
  status: 'Published' | 'Draft' | 'Scheduled';
  scheduledAt?: string | null;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return apiRequest<Announcement[]>('/announcements');
}

export async function getUnreadAnnouncements(): Promise<Announcement[]> {
  return apiRequest<Announcement[]>('/announcements/unread');
}

export async function createAnnouncement(data: CreateAnnouncementData): Promise<Announcement> {
  return apiRequest<Announcement>('/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAnnouncement(id: string, data: Partial<CreateAnnouncementData>): Promise<Announcement> {
  return apiRequest<Announcement>(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/announcements/${id}`, {
    method: 'DELETE',
  });
}

export async function markAnnouncementAsRead(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/announcements/${id}/read`, {
    method: 'POST',
  });
}

// ==================== TASKS ====================

export interface TaskAssignee {
  id?: string;
  full_name: string | null;
  department: string | null;
  avatar_url: string | null;
  gender: string | null;
  email: string | null;
  employee_id: string | null;
}

export interface TaskSubtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: number;
  content: string;
  created_at: string;
  author?: TaskAssignee;
}

export interface TaskAttachment {
  id: number;
  file_name: string;
  file_size: string;
  file_type: string;
  file_url: string;
}

export interface TaskData {
  id: number;
  title: string;
  description: string | null;
  assignee_id: string | null;
  assignee?: TaskAssignee;
  organization: string | null;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  due_date: string | null;
  tags: string[];
  progress: number;
  created_by: string | null;
  created_at: string;
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
}

export interface CreateTaskData {
  title: string;
  description: string;
  assigneeId: string | null;
  organization: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string | null;
  dueTime?: string;
  tags: string[];
  subtasks: { title: string }[];
  attachments: { name: string; size: string; type: string; url: string; path: string }[];
}

export async function getTasks(): Promise<TaskData[]> {
  return apiRequest<TaskData[]>('/tasks');
}

export async function getTask(id: number): Promise<TaskData> {
  return apiRequest<TaskData>(`/tasks/${id}`);
}

export async function createTask(data: CreateTaskData): Promise<TaskData> {
  return apiRequest<TaskData>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: number, data: Partial<CreateTaskData & { status: string; progress: number }>): Promise<TaskData> {
  return apiRequest<TaskData>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateTaskStatus(id: number, status: string, progress?: number): Promise<TaskData> {
  return apiRequest<TaskData>(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, progress }),
  });
}

export async function updateTaskDescription(id: number, description: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/tasks/${id}/description`, {
    method: 'PATCH',
    body: JSON.stringify({ description }),
  });
}

export async function deleteTask(id: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

// Subtasks
export async function addSubtask(taskId: number, title: string): Promise<TaskSubtask> {
  return apiRequest<TaskSubtask>(`/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function updateSubtask(subtaskId: number, completed: boolean): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/tasks/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

// Comments
export async function addTaskComment(taskId: number, content: string): Promise<TaskComment> {
  return apiRequest<TaskComment>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function addTaskAttachment(
  taskId: number,
  attachment: { name: string; size: string; type: string; url: string; path: string }
): Promise<TaskAttachment> {
  return apiRequest<TaskAttachment>(`/tasks/${taskId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(attachment),
  });
}

// ==================== ATTENDANCE ====================

export interface AttendanceUser {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
}

export interface AttendanceRecord {
  id: number;
  user_id: string;
  check_in: string | null;
  check_out: string | null;
  date: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  photo_url: string | null;
  face_match_score: number | null;
  verification_status: 'pending' | 'verified' | 'failed' | 'flagged' | null;
  note: string | null;
  user?: AttendanceUser;
}

export interface AttendanceMetrics {
  date: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  total_checked_in: number;
  total_staff: number;
  pending: number;
  attendance_rate: number;
}

export interface OfficeLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

/**
 * Get all attendance records for today (admin view)
 */
export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  return apiRequest<AttendanceRecord[]>('/attendance/all/today');
}

/**
 * Get attendance metrics for today
 */
export async function getAttendanceMetrics(): Promise<AttendanceMetrics> {
  return apiRequest<AttendanceMetrics>('/attendance/metrics/today');
}

/**
 * Get attendance records by date range
 */
export async function getAttendanceByRange(
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  return apiRequest<AttendanceRecord[]>(
    `/attendance/range?startDate=${startDate}&endDate=${endDate}`
  );
}

/**
 * Get all office locations
 */
export async function getOfficeLocations(): Promise<OfficeLocation[]> {
  return apiRequest<OfficeLocation[]>('/attendance/offices');
}

/**
 * Helper to format check-in time and calculate early/late status
 */
export function formatCheckInStatus(checkIn: string | null): {
  time: string;
  statusText: string;
  isEarly: boolean;
  isLate: boolean;
} {
  if (!checkIn) {
    return { time: '—', statusText: 'No check-in', isEarly: false, isLate: false };
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
    return { time, statusText: `${diff} min early`, isEarly: true, isLate: false };
  } else if (diff < 0) {
    return { time, statusText: `${Math.abs(diff)} min late`, isEarly: false, isLate: true };
  }
  return { time, statusText: 'On time', isEarly: true, isLate: false };
}

// ==================== AURA PERFORMANCE ====================

export interface PillarDetail {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  dataSource: string;
}

export interface PillarScores {
  technical: PillarDetail;
  behavioral: PillarDetail;
  cultureFit: PillarDetail;
  growthLearning: PillarDetail;
  collaboration: PillarDetail;
}

export interface AuraResponse {
  employeeId: string;
  fullName: string;
  department: string;
  role: string;
  auraScore: number;
  qgpa: number;
  grade: string;
  pillars: PillarScores;
  weeksRatedThisQuarter: number;
  quarterStart: string;
  quarterEnd: string;
  lastUpdated: string;
}

export interface TeamAuraResponse {
  teamMembers: AuraResponse[];
  teamAverage: number;
  teamGrade: string;
}

export interface PeerFeedbackRequest {
  toEmployeeId: string;
  quarter: string;
  year: number;
  supportRating: number;
  collaborationRating?: number;
  communicationRating?: number;
  strengths?: string;
  areasForImprovement?: string;
  isAnonymous?: boolean;
}

/**
 * Get Aura dashboard for an employee
 */
export async function getAuraDashboard(employeeId: string): Promise<AuraResponse> {
  return apiRequest<AuraResponse>(`/api/performance/aura/dashboard?employeeId=${employeeId}`);
}

/**
 * Get Aura dashboard for the current user
 */
export async function getMyAuraDashboard(): Promise<AuraResponse> {
  return apiRequest<AuraResponse>('/api/performance/aura/dashboard');
}

/**
 * Get team Aura scores (for Team Leads/Managers)
 */
export async function getTeamAuraScores(): Promise<TeamAuraResponse> {
  return apiRequest<TeamAuraResponse>('/api/performance/aura/team');
}

/**
 * Submit peer feedback
 */
export async function submitPeerFeedback(feedback: PeerFeedbackRequest): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/api/performance/peer-feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

/**
 * Get pending peer feedback requests for current user
 */
export async function getPendingPeerFeedback(): Promise<StaffProfile[]> {
  return apiRequest<StaffProfile[]>('/api/performance/peer-feedback/pending');
}

// ==================== AUTO-CALCULATED AURA (Department KPIs) ====================

export interface AutoSubMetric {
  key: string;
  displayName: string;
  score: number;
  source: string;
  dataSource: string;
  weightInPillar: number;
  contribution: number;
}

export interface AutoPillarDetail {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  dataSource: string;
  autoCalculatedCount?: number;
  manualRatingCount?: number;
  subMetrics: AutoSubMetric[];
}

export interface AutoAuraResponse {
  employeeId: string;
  employeeName: string;
  department: string;
  departmentProfile: string;
  auraScore: number;
  grade: string;
  qgpa: number;
  quarterStart: string;
  automationRate: number;
  calculatedAt: string;
  pillars: Record<string, AutoPillarDetail>;
}

export interface DepartmentKpi {
  key: string;
  name: string;
  automationRate: number;
  totalMetrics: number;
  autoMetrics: number;
}

export interface DepartmentKpisResponse {
  departments: DepartmentKpi[];
  message: string;
}

/**
 * Get auto-calculated Aura dashboard (real-time calculation with department KPIs)
 */
export async function getAutoAuraDashboard(): Promise<AutoAuraResponse> {
  return apiRequest<AutoAuraResponse>('/api/performance/my-aura/auto');
}

/**
 * Get auto-calculated Aura for a specific employee
 */
export async function getEmployeeAutoAura(employeeId: string): Promise<AutoAuraResponse> {
  return apiRequest<AutoAuraResponse>(`/api/performance/employee/${employeeId}/aura/auto`);
}

/**
 * Get all available department KPI profiles
 */
export async function getDepartmentKpis(): Promise<DepartmentKpisResponse> {
  return apiRequest<DepartmentKpisResponse>('/api/performance/department-kpis');
}

/**
 * Trigger auto-recalculation for all employees (admin only)
 */
export async function triggerAutoRecalculation(): Promise<{ message: string; note: string }> {
  return apiRequest<{ message: string; note: string }>('/api/performance/auto-recalculate', {
    method: 'POST',
  });
}


// Default export for convenient importing
// ==================== TRAINING RECORDS ====================

export interface TrainingRecord {
  id: number;
  employeeId: string;
  name: string;
  type: string;
  quarter: string;
  year: number;
  status: 'pending' | 'approved' | 'rejected';
  certificateUrl: string;
  completionDate?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

/**
 * Get all pending certificates
 */
export async function getPendingCertificates(): Promise<TrainingRecord[]> {
  return apiRequest<TrainingRecord[]>('/api/performance/training-records/pending');
}

/**
 * Get all certificates (with optional filters)
 */
export async function getAllCertificates(filters?: {
  quarter?: string;
  year?: number;
  status?: string
}): Promise<TrainingRecord[]> {
  const params = new URLSearchParams();
  if (filters?.quarter) params.append('quarter', filters.quarter);
  if (filters?.year) params.append('year', filters.year.toString());
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<TrainingRecord[]>(`/api/performance/training-records${queryString}`);
}

/**
 * Get certificates for a specific employee
 */
export async function getEmployeeCertificates(employeeId: string): Promise<TrainingRecord[]> {
  return apiRequest<TrainingRecord[]>(`/api/performance/training-records/employee/${employeeId}`);
}

/**
 * Approve a certificate
 */
export async function approveCertificate(id: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/performance/training-records/${id}/approve`, {
    method: 'POST',
  });
}

/**
 * Reject a certificate
 */
export async function rejectCertificate(id: number, reason: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/performance/training-records/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ==================== COMPLIANCE ====================

export interface CompliancePolicy {
  id: string;
  title: string;
  category: string;
  department: string | null;
  description: string;
  type: string; // policy, upload, training
  status: string; // Compliant, At Risk, Non-Compliant
  complianceRate: number;
  staffCount: number;
  nonCompliant: number;
  lastReview: string | null;
  nextReview: string | null;
}

export interface ComplianceMetrics {
  overallComplianceRate: number;
  totalPolicies: number;
  compliantPolicies: number;
  atRiskPolicies: number;
  nonCompliantPolicies: number;
}

export interface ComplianceSubmission {
  id: string;
  status: string;
  submittedAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
  acknowledged: boolean | null;
  reviewNotes: string | null;
  userName?: string;
  userEmail?: string;
  userDepartment?: string;
}

export interface CreatePolicyRequest {
  title: string;
  category: string;
  department?: string;
  description: string;
  type: string;
  deadline?: string;
  reviewFrequencyDays?: number;
}

/**
 * Get all compliance policies (Admin)
 */
export async function getCompliancePolicies(): Promise<CompliancePolicy[]> {
  return apiRequest<CompliancePolicy[]>('/compliance/policies');
}

/**
 * Get compliance metrics (Admin)
 */
export async function getComplianceMetrics(): Promise<ComplianceMetrics> {
  return apiRequest<ComplianceMetrics>('/compliance/metrics');
}

/**
 * Create a new compliance policy (Admin)
 */
export async function createCompliancePolicy(policy: CreatePolicyRequest): Promise<CompliancePolicy> {
  return apiRequest<CompliancePolicy>('/compliance/policies', {
    method: 'POST',
    body: JSON.stringify(policy),
  });
}

/**
 * Update a compliance policy (Admin)
 */
export async function updateCompliancePolicy(id: string, policy: Partial<CreatePolicyRequest>): Promise<CompliancePolicy> {
  return apiRequest<CompliancePolicy>(`/compliance/policies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(policy),
  });
}

/**
 * Delete (deactivate) a compliance policy (Admin)
 */
export async function deleteCompliancePolicy(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/compliance/policies/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get submissions for a policy (Admin)
 */
export async function getComplianceSubmissions(policyId: string): Promise<ComplianceSubmission[]> {
  return apiRequest<ComplianceSubmission[]>(`/compliance/policies/${policyId}/submissions`);
}

/**
 * Review a submission - approve or reject (Admin)
 */
export async function reviewComplianceSubmission(
  submissionId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<{ message: string; status: string }> {
  return apiRequest<{ message: string; status: string }>(`/compliance/submissions/${submissionId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

// Default export for convenient importing
const backendApi = {
  login,
  getProfile,
  getStaffProfiles,
  getAllProfiles,
  deleteProfile,
  getAnnouncements,
  getUnreadAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead,
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskDescription,
  deleteTask,
  addSubtask,
  updateSubtask,
  addTaskComment,
  addTaskAttachment,
  // Attendance
  getTodayAttendance,
  getAttendanceMetrics,
  getAttendanceByRange,
  getOfficeLocations,
  formatCheckInStatus,
  // Aura Performance
  getAuraDashboard,
  getMyAuraDashboard,
  getTeamAuraScores,
  submitPeerFeedback,
  getPendingPeerFeedback,
  // Training Records
  getPendingCertificates,
  getAllCertificates,
  getEmployeeCertificates,
  approveCertificate,
  rejectCertificate,
  // Compliance
  getCompliancePolicies,
  getComplianceMetrics,
  createCompliancePolicy,
  updateCompliancePolicy,
  deleteCompliancePolicy,
  getComplianceSubmissions,
  reviewComplianceSubmission,
  setAuthToken,
  getAuthToken,
};

export default backendApi;

// ==================== TEAM KPIs & SCORES (Admin View) ====================

export interface TeamKpi {
  id: string;
  teamLeadId: string;
  department: string;
  name: string;
  description: string;
  targetValue: number;
  targetUnit: string;
  weight: number;
  quarter: string;
  year: number;
  isActive: boolean;
  createdAt: string;
}

export interface AiInsightItem {
  id: string;
  department: string;
  weekNumber: number;
  quarter: string;
  year: number;
  kpiScore: number;
  summary: string;
  insights: Record<string, unknown>;
  recommendations: Record<string, unknown>;
  riskAlerts: Record<string, unknown>;
  generatedAt: string;
}

export interface TeamQuarterlyScore {
  id: string;
  teamName: string;
  department: string;
  quarter: string;
  year: number;
  kpiAchievementScore: number;
  overallTeamScore: number;
  grade: string;
  aiSummary: string;
}

/**
 * Get all team KPIs (admin view)
 */
export async function getAllTeamKpis(quarter?: string, year?: number): Promise<{
  kpis: TeamKpi[];
  quarter: string;
  year: number;
}> {
  const params = new URLSearchParams();
  if (quarter) params.set('quarter', quarter);
  if (year) params.set('year', year.toString());
  return apiRequest(`/api/kpi/all-kpis?${params.toString()}`);
}

/**
 * Get all team quarterly scores (admin view)
 */
export async function getAllTeamScores(quarter?: string, year?: number): Promise<{
  quarter: string;
  year: number;
  teams: TeamQuarterlyScore[];
  totalTeams: number;
  averageScore: number;
}> {
  const params = new URLSearchParams();
  if (quarter) params.set('quarter', quarter);
  if (year) params.set('year', year.toString());
  return apiRequest(`/api/kpi/score/all-teams?${params.toString()}`);
}

/**
 * Get all AI insights for a specific week (admin view)
 */
export async function getAllWeeklyInsights(weekNumber: number, year: number): Promise<{
  insights: AiInsightItem[];
  weekNumber: number;
  year: number;
}> {
  return apiRequest(`/api/kpi/insights/all?weekNumber=${weekNumber}&year=${year}`);
}

