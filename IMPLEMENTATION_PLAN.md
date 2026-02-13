# WorkSight Implementation Plan

This document outlines the steps to make the WorkSight project (Dashboard + Mobile App)
fully functional using the Spring Boot backend.

## 1. Backend Environment Setup (User Action Required)

1.  **Provision Database**: PostgreSQL reachable by `SPRING_DATASOURCE_URL`.
2.  **Set Required Env Vars**:
    - `SPRING_DATASOURCE_URL`
    - `SPRING_DATASOURCE_USERNAME`
    - `SPRING_DATASOURCE_PASSWORD`
    - `JWT_SECRET` (32+ chars)
3.  **Run Migrations**: Flyway runs on startup; verify `db/migration` is up to date.

## 2. Environment Configuration

### Dashboard (`schoolable_dashboard`)

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=WorkSight Dashboard
NEXT_PUBLIC_ENABLE_DEV_TOOLS=true
```

### Team Lead (`schoolable_team_lead`)

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=WorkSight Team Lead
NEXT_PUBLIC_ENABLE_DEV_TOOLS=false
```

### Mobile App (`schoolable`)

Create `assets/.env`:

```env
BACKEND_URL=http://localhost:8081
```

## 3. Dashboard Implementation (Next.js)

- [x] **Authentication**:
  - [x] Create `src/app/login/page.tsx`.
  - [x] Add `middleware.ts` to protect `(dashboard)` routes.
- [ ] **Dashboard Logic**:
  - [ ] Update `(dashboard)/dashboard` to fetch admin data (attendance, stats).
  - [ ] Ensure only users with `role: 'admin'` can access.

## 4. Team Lead Implementation (Next.js)

- [x] **Auth + Protected Routes** in `(dashboard)`.
- [ ] **KPI/Analytics**: Hook up dashboard tiles to `/api/team-lead` endpoints.

## 5. Mobile App Implementation (Flutter)

- [x] **Initialization**:
  - [x] Update `main.dart` to load `assets/.env`.
- [x] **Authentication**:
  - [x] Update `StartupViewModel` to validate stored JWT.
- [ ] **Features**:
  - [ ] **Attendance**: Wire up check-in to backend endpoints.
  - [ ] **Profile**: Display `profile/me` data from backend.

## 6. Additional Requirements for Success

- **Push Notifications**: Firebase Cloud Messaging (already initialized when config is valid).
- **Storage**: Use backend `/storage` endpoints (Cloudinary config required).
- **AI Insights**: Gemini-based KPI insights configured via `GEMINI_API_KEY`.
