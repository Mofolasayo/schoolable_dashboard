# Schoolable Implementation Plan

This document outlines the steps to make the Schoolable project (Dashboard + Mobile App) fully functional using Supabase.

## 1. Supabase Project Setup (User Action Required)

1.  **Create Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Get Credentials**:
    - `Project URL`
    - `Anon Key`
3.  **Run SQL Schema**:
    - Copy the SQL from `SUPABASE_SETUP.md` and run it in the Supabase SQL Editor.
    - This sets up `profiles`, `attendance`, `tasks`, and `messages` tables with Row Level Security (RLS).

## 2. Environment Configuration

### Dashboard (`schoolable_dashboard`)

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Mobile App (`schoolable`)

Create `assets/.env` (and add to `pubspec.yaml` assets):

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

## 3. Dashboard Implementation (Next.js)

- [x] **Authentication**:
  - [x] Create `src/app/login/page.tsx`.
  - [x] Implement `src/app/auth/callback/route.ts` (Skipped, using server actions directly).
  - [x] Add `middleware.ts` to protect `(dashboard)` routes.
- [ ] **Dashboard Logic**:
  - [ ] Update `(dashboard)/page.tsx` to fetch "Super Admin" data (all attendance, overview stats).
  - [ ] Ensure only users with `role: 'admin'` can access.

## 4. Mobile App Implementation (Flutter)

- [x] **Initialization**:
  - [x] Update `main.dart` to use `flutter_dotenv` to load credentials.
- [x] **Authentication**:
  - [x] Update `StartupViewModel` to check `SupabaseService.currentUser`.
  - [x] Update `LoginViewModel` to call `SupabaseService.signIn`.
- [ ] **Features**:
  - [ ] **Attendance**: Wire up "Check In" button to `SupabaseService.checkIn()`.
  - [ ] **Profile**: Display user data from `profiles` table.

## 5. Additional Requirements for Success

- **Push Notifications**: For "Tasks" and "Chat" updates (requires Firebase Cloud Messaging or OneSignal).
- **Storage**: For profile pictures (Supabase Storage).
- **Edge Functions**: For complex logic (e.g., automatic late marking).
