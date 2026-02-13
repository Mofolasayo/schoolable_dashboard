# WorkSight Workspace Overview

## Project Summary

The **WorkSight** project consists of two main applications designed to work together as an Automated Rating Platform (ARP) for HR/KPI management in tech startups.

### Repository Structure

```
/Users/mofolasayo-osikoya/
├── schoolable/                    # Flutter Mobile App
└── schoolable_dashboard/          # Next.js Web Dashboard
```

---

## 1. WorkSight Mobile App (Flutter)

**Location:** `/Users/mofolasayo-osikoya/schoolable`

### Tech Stack

- **Framework:** Flutter 3.0.3+
- **Architecture:** Stacked (MVVM architecture)
- **State Management:** Stacked services
- **Navigation:** Stacked Router

### Dependencies

- `stacked: ^3.4.0` - MVVM architecture framework
- `stacked_services: ^1.1.0` - Services for navigation, dialogs, etc.

### Dev Dependencies

- `build_runner` - Code generation
- `stacked_generator` - Generate routes, locators, etc.
- `mockito` - Testing
- `golden_toolkit` - Golden/snapshot testing

### Current Structure

```
lib/
├── app/
│   ├── app.dart                   # Main app configuration
│   ├── app.bottomsheets.dart      # Bottom sheet registry
│   ├── app.dialogs.dart           # Dialog registry
│   ├── app.locator.dart           # Dependency injection
│   └── app.router.dart            # Navigation routes
├── ui/
│   ├── bottom_sheets/
│   ├── common/
│   ├── dialogs/
│   └── views/
│       ├── home/
│       └── startup/
└── main.dart                      # Entry point
```

### Current Views

- **Startup View** - Initial loading screen
- **Home View** - Main home screen

### Testing Setup

- Golden tests configured
- Test screenshots stored in `test/golden/`
- Run tests: `flutter test --update-goldens`

---

## 2. WorkSight Dashboard (Next.js)

**Location:** `/Users/mofolasayo-osikoya/schoolable_dashboard`

### Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **UI Library:** Shadcn/ui + Tailwind CSS
- **State Management:**
  - Server State: TanStack Query v5
  - Client State: Zustand v5
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest + Testing Library

### Key Dependencies

```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "@tanstack/react-query": "^5.59.0",
  "zustand": "^5.0.1",
  "react-hook-form": "^7.53.2",
  "zod": "^3.23.8",
  "tailwindcss": "^3.4.15",
  "lucide-react": "^0.454.0"
}
```

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Dashboard route group
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # React Query & other providers
├── components/
│   ├── ui/                # Shadcn components (auto-generated)
│   ├── features/          # Feature-specific components
│   └── layouts/           # Layout components
├── lib/
│   ├── api/              # API client & endpoints
│   ├── hooks/            # Custom React hooks
│   ├── schemas/          # Zod schemas (single source of truth)
│   ├── store/            # Zustand stores
│   └── utils/            # Utility functions
├── config/
│   ├── env.ts            # Environment validation
│   └── navigation.ts     # Navigation configuration
└── types/                # TypeScript type definitions
```

### Documentation

Located in `docs/`:

1. **ARCHITECTURE.md** - Architectural decisions and patterns
2. **CONVENTIONS.md** - Coding standards and conventions
3. **AI_AGENT_GUIDE.md** - Guide for AI-assisted development
4. **PRD_ARP.md** - Product Requirements Document _(just added)_

### Core Principles

1. **Schema-Driven Development** - Define Zod schemas first, infer TypeScript types
2. **Separation of Concerns** - Server state (TanStack Query) vs Client state (Zustand)
3. **Co-located Tests** - Tests live next to the code they test
4. **Type Safety First** - No `any` types, strict TypeScript
5. **Error Handling** - Proper validation and error boundaries

### Available Scripts

```bash
pnpm dev              # Start dev server (currently running)
pnpm build            # Production build
pnpm test             # Run tests
pnpm test:ui          # Tests with UI
pnpm test:coverage    # Coverage report
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format with Prettier
pnpm type-check       # TypeScript type checking
pnpm mcp:devtools     # Chrome DevTools MCP server
```

### Currently Running

- `pnpm dev` is running (for 2m35s)
- Dev server likely on `http://localhost:3000`

---

## 3. Product Requirements (PRD)

The newly added **PRD_ARP.md** defines the complete system requirements for the Automated Rating Platform.

### Platform Components

1. **Mobile App** (Flutter - `schoolable/`)
   - Staff attendance (GPS + photo)
   - Personal KPI dashboard
   - Task management
   - View feedback

2. **Web Dashboard** (Next.js - `schoolable_dashboard/`)
   - Admin/HR configuration
   - KPI formula management
   - Appraisal report generation
   - Department management
   - Real-time monitoring

3. **Backend** (To be implemented)
   - Firebase or Supabase
   - KPI calculation engine
   - Real-time data sync
   - File storage (photos, reports)

### User Roles

1. **Admin/HR** - Configure KPIs, manage users, generate reports
2. **Manager** - Approve tasks, track team performance
3. **Staff** - View KPIs, mark attendance, update tasks

### Core Features

- **Task Tracking** - Assigned → In-Progress → Completed → Approved
- **Attendance** - GPS + Selfie verification
- **KPI Engine** - Weighted scoring: `KPI Score = Σ (Metric Weight × Metric Score)`
- **Reports** - Auto-generated PDF/Word reports
- **Feedback** - Customer satisfaction integration

### Departments Supported

1. **Operations** - Agent supervision, school visits, card issuance
2. **Customer Support** - Ticket resolution, customer satisfaction
3. **Development** - Feature delivery, bug resolution, uptime
4. **Sales** - Lead generation, conversion, merchant visits
5. **HR** - Recruitment, engagement, compliance
6. **Finance** - Accuracy, timeliness, budget adherence
7. **Growth** - (To be added later)

---

## 4. Next Steps & Recommendations

### Immediate Actions

1. **Review PRD** ✅ (Completed - saved as PRD_ARP.md)
2. **Align Current Code** - The dashboard appears to be a template/boilerplate. Need to adapt it for ARP requirements
3. **Backend Setup** - Choose between Firebase or Supabase and configure

### Database Schema Needed

Based on PRD, create schemas for:

- Users (staff profiles)
- Departments
- Tasks
- Attendance records
- KPI configurations
- KPI scores
- Reports
- Customer feedback

### Mobile App Development (Flutter)

- Attendance module (GPS + Camera)
- Task management UI
- KPI dashboard
- Notifications

### Dashboard Development (Next.js)

- User management
- Department setup
- KPI configuration UI
- Formula builder
- Report generation
- Analytics/insights

### Integration Points

- Mobile ↔ Backend (real-time sync)
- Dashboard ↔ Backend (admin operations)
- KPI Engine (scheduled calculations)
- Notification service (push notifications)

---

## 5. Technology Alignment

Both projects are already set up with excellent foundations:

### Mobile (Flutter)

- ✅ Stacked architecture (MVVM pattern)
- ✅ Navigation and routing configured
- ✅ Bottom sheets and dialogs ready
- ✅ Testing infrastructure
- 🔄 Need to build out views for ARP features

### Dashboard (Next.js)

- ✅ Next.js 15 with App Router
- ✅ TypeScript strict mode
- ✅ TanStack Query for server state
- ✅ Zustand for client state
- ✅ Zod for validation
- ✅ Testing with Vitest
- ✅ Comprehensive documentation
- 🔄 Need to create domain-specific features for ARP

### Backend Decision Required

**Firebase vs Supabase:**

| Feature            | Firebase           | Supabase                      |
| ------------------ | ------------------ | ----------------------------- |
| Auth               | ✅ Excellent       | ✅ Excellent                  |
| Real-time          | ✅ Yes             | ✅ Yes                        |
| Storage            | ✅ Yes             | ✅ Yes                        |
| Functions          | ✅ Cloud Functions | ✅ Edge Functions             |
| Database           | NoSQL (Firestore)  | PostgreSQL (more powerful)    |
| Row-Level Security | Via rules          | ✅ Built-in                   |
| Cost               | Can get expensive  | Generally cheaper             |
| Type Safety        | Limited            | ✅ Excellent (auto-generated) |

**Recommendation:** Supabase for better type safety, PostgreSQL for complex queries (KPI calculations), and better row-level security.

---

## 6. Current State Summary

### What We Have

✅ Flutter mobile app foundational structure  
✅ Next.js dashboard with enterprise-grade architecture  
✅ Comprehensive PRD defining all requirements  
✅ Testing infrastructure on both platforms  
✅ Documentation and coding conventions  
✅ Development environment set up

### What We Need

🔄 Backend implementation (Firebase or Supabase)  
🔄 Database schema design  
🔄 KPI calculation engine  
🔄 Authentication & authorization  
🔄 Mobile UI for attendance, tasks, KPIs  
🔄 Dashboard UI for admin, reporting, analytics  
🔄 Integration between mobile, dashboard, and backend  
🔄 File storage for photos and reports  
🔄 Push notification service

---

## 7. Development Workflow

### Getting Started

**Mobile App:**

```bash
cd /Users/mofolasayo-osikoya/schoolable
flutter pub get
flutter run
flutter test --update-goldens    # Run tests
```

**Dashboard:**

```bash
cd /Users/mofolasayo-osikoya/schoolable_dashboard
pnpm install
pnpm dev                         # Already running
pnpm test                        # Run tests
pnpm lint                        # Check code quality
```

### Best Practices

- Follow schema-driven development (Zod schemas first)
- Co-locate tests with components
- Use TypeScript strict mode (no `any` types)
- Validate all external data
- Follow the conventions in CONVENTIONS.md
- Reference ARCHITECTURE.md for patterns

---

## 8. Questions to Address

1. **Backend Choice:** Finalize Firebase vs Supabase decision
2. **Deployment:** Where will we deploy? (Vercel/Firebase Hosting for dashboard, Play Store/App Store for mobile)
3. **Environment:** What environments? (Dev, Staging, Production)
4. **API Design:** REST or GraphQL?
5. **File Storage:** Where to store photos and generated reports?
6. **Analytics:** What analytics/monitoring tools?
7. **Error Tracking:** Sentry or similar?
8. **Email Service:** For report delivery?
9. **SMS/Push Notifications:** Which service?
10. **CI/CD:** GitHub Actions, GitLab CI, or other?

---

_Last Updated: 2025-11-30_
_PRD Version: 1.0_
