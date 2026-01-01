# Admin Dashboard - Mock Data & Unimplemented Features Audit

## Pages with Mock Data

### 1. Main Dashboard (`/dashboard/page.tsx`)

**Status:** ❌ All Mock Data

- KPI trend data (hardcoded 7 days)
- Task distribution (Completed/Pending/Overdue)
- Metrics (Task completion, Attendance, Compliance, Feedback, Overall KPI)
- Staff performance table (4 hardcoded staff members)

**Needs:**

- Real KPI metrics from backend
- Real task statistics
- Real staff list with attendance and performance data

### 2. Staff Page (`/dashboard/staff/page.tsx`)

**Status:** ❌ Mock Data

- Team members list (hardcoded)
- Summary metrics
- Performance charts

**Note:** This page is placeholder - real staff directory is at `/dashboard/users`

### 3. Compliance Page (`/dashboard/compliance/page.tsx`)

**Status:** ❌ All Mock Data

- Compliance items list
- Summary metrics
- Categories and statuses

**Needs:** Backend API for compliance tracking

### 4. Reports Page (`/dashboard/reports/page.tsx`)

**Status:** ❌ All Mock Data

- Reports list
- Report types
- Summary metrics

**Needs:** Backend API for reports generation and history

### 5. HR Policy Page (`/dashboard/hr-policy/page.tsx`)

**Status:** ⚠️ Partially Implemented

- Probation staff (mock)
- Promotions list (mock)
- PIP list (mock)
- Team leads (mock)
- Levels and grades (mock)
- **Has API integration** for employee list and certificates

**Needs:** Complete backend APIs for HR policy management

### 6. Performance Assessment (`/dashboard/performance/assess/[employeeId]/page.tsx`)

**Status:** ⚠️ Partially Mock

- Rating criteria (hardcoded)
- Mock employee data
- TODOs for API calls to save/submit assessment

**Needs:** Complete assessment submission API

## Pages with Real Data

### 7. Performance Page (`/dashboard/performance/page.tsx`)

**Status:** ✅ Real Data

- Fetches real staff profiles from `getAllProfiles()`
- Shows Aura scores and grades
- Delete functionality implemented

### 8. Users/Staff Directory (`/dashboard/users/`)

**Status:** ✅ Real Data

- Fetches staff profiles
- Fetches certificates
- Real data display

### 9. Attendance Page (`/dashboard/attendance/page.tsx`)

**Status:** ✅ Real Data (from previous session context)

### 10. Tasks Page (`/dashboard/tasks/page.tsx`)

**Status:** ✅ Real Data (from previous session context)

### 11. Announcements Page (`/dashboard/announcements/page.tsx`)

**Status:** ✅ Real Data (from previous session context)

## Unimplemented Features

### Backend APIs Needed

1. **Dashboard KPIs API** - `/api/admin/dashboard-stats`
   - Overall metrics
   - KPI trends over time
   - Task distribution

2. **Compliance Management API**
   - GET `/api/compliance/items`
   - POST `/api/compliance/items`
   - PUT `/api/compliance/items/:id`

3. **Reports API**
   - GET `/api/reports`
   - POST `/api/reports/generate`

4. **HR Policy API**
   - GET `/api/hr/probation`
   - GET `/api/hr/promotions`
   - GET `/api/hr/pip`

5. **Performance Assessment API**
   - POST `/api/performance/assessment`
   - PUT `/api/performance/assessment/:id`

### Frontend Improvements Needed

1. **Main Dashboard** - Replace all mock data with real API calls
2. **Staff Page** - Either remove (duplicate of /users) or redirect
3. **Compliance** - Full implementation pending backend
4. **Reports** - Full implementation pending backend
5. **HR Policy** - Complete remaining features

## Priority Actions

### High Priority

1. ✅ **Main Dashboard** - Fetch real staff data (currently showing mock)
2. **Main Dashboard** - Add real task statistics
3. **Main Dashboard** - Add real KPI metrics

### Medium Priority

4. Compliance tracking system
5. Reports generation
6. HR Policy management completion

### Low Priority

7. Advanced analytics and charts
8. Export functionality
9. Custom date range filters
