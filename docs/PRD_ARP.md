# Product Requirements Document (PRD)

## Automated Rating Platform (ARP)

**Platforms:** Mobile App (Flutter), Web Admin Dashboard  
**Backend:** Firebase or Supabase  
**Prepared For:** Tech Startup (HR, Operations, Management)

---

## 1. PRODUCT OVERVIEW

The Automated Rating Platform (ARP) is a mobile and web-based system that automates the calculation and management of Key Performance Indicators (KPIs) for all staff within a tech startup.

The platform collects data from:

- Task completion
- Attendance
- Compliance metrics
- Customer support activities
- Operational field activities
- Sales activities
- Finance activities
- Development team outputs
- Customer feedback
- HR processes

This input is converted into measurable KPI scores based on predefined formulas configured by Admin/HR.

**The goal is to eliminate manual appraisals and provide a real-time, transparent, data-driven performance evaluation system.**

---

## 2. OBJECTIVES

- Automate staff performance appraisal using measurable KPI metrics
- Provide real-time performance dashboards for staff, managers, and HR
- Integrate customer satisfaction into KPI scoring
- Support data-driven HR decisions
- Enable continuous feedback loops between management and staff
- Track productivity, compliance, engagement, and attendance
- Provide monthly and quarterly appraisal reports automatically

---

## 3. SCOPE

The ARP covers the following:

### In-Scope

- Collection of staff activity data via internal systems (tasks, attendance logs, customer tickets, etc.)
- KPI scoring for individuals and departments
- Automated appraisal report generation (PDF/Word)
- Mobile dashboards for staff and managers
- Web dashboard for HR/admin
- Attendance validation (GPS + photo)
- Historical performance tracking
- Department-specific KPI structures
- Real-time team monitoring

### Out-of-Scope (Phase 2)

- Payroll automation
- AI-generated performance insights
- Full HR recruitment system
- External CRM integrations

---

## 4. USER ROLES

### 1. Admin / HR

- Configure KPI weights and scoring formulas
- Approve system data and reports
- Manage users, departments, and roles
- Generate appraisal reports
- Track company-wide performance trends

### 2. Manager

- Approve tasks completed by team members
- Track team performance and attendance
- Input compliance or evaluation scores
- Provide manager notes and feedback

### 3. Staff

- View personal KPI dashboard
- Mark attendance + upload photo and GPS location
- View tasks assigned
- Update task status
- Receive feedback from management

---

## 5. CORE FUNCTIONAL REQUIREMENTS

### A. Staff Registration & Profile Management

- Add/edit staff profiles
- Assign departments and roles
- Track employment status
- Upload profile image

### B. Task Tracking

- Tasks can be: assigned, in-progress, completed, approved
- Auto-tracking of time spent and deadlines
- Task-level scoring input

### C. Attendance Recording

- GPS-based check-in/check-out
- Selfie verification
- Daily punctuality scoring
- Monthly attendance report

### D. Compliance & Engagement Tracking

Logs:

- Policy adherence
- Attendance to company events
- Response time to submissions
- Training completions

### E. Customer Feedback Integration

- Capture customer ratings
- Link feedback to responsible staff
- Impact feedback on KPI scores

### F. KPI Calculation Engine

- KPI formulas = configurable by Admin/HR
- Supports weighted scoring for:
  - Department metrics
  - Individual tasks
  - Attendance
  - Feedback
  - Compliance
- Monthly and on-demand recalculation

### G. Reports & Appraisals

- Auto-generate monthly/quarterly appraisal reports
- Export in PDF or Word format
- Include graphs, comments, and scores

### H. Internal Communication (Phase 1.5)

- Staff to manager messaging
- Team updates
- Company announcements

---

## 6. DEPARTMENTAL TASKS & RESPONSIBILITIES

_(These will directly influence departmental KPI formulas)_

### 1. OPERATIONS TEAM

#### Core Responsibilities:

- Onboarding and training of field agents
- Supervising school operations
- Monitoring agent/student/vendor interactions
- Tracking transactions and card sales
- Preparing operations reports
- Student onboarding for card usage
- Card printing and wallet linking
- School visits
- Vendor relationship management
- Logistics and item delivery

#### KPI Metrics:

- Agent supervision success rate
- Number of completed school visits
- Card issuance accuracy and speed
- Issue resolution time
- Vendor satisfaction score
- Logistics punctuality
- Transaction monitoring completeness

### 2. CUSTOMER SUPPORT TEAM

#### Responsibilities:

- Handling parent complaints and inquiries
- Providing timely resolutions
- Fixing login and authentication issues
- Assisting with account updates
- Password reset support
- Collecting customer feedback
- Helping parents generate PAN/VAN
- Outbound calls for follow-up
- Documenting complaints

#### KPI Metrics:

- Average resolution time
- Customer satisfaction score
- Number of resolved tickets
- Accuracy of account updates
- Call/feedback completion rate
- Technical issue resolution success

### 3. DEVELOPMENT TEAM

#### Responsibilities:

- Website maintenance
- Mobile app development
- Product development
- Product management
- Fixing bugs and deploying updates

#### KPI Metrics:

- Feature delivery timeline
- Bug resolution rate
- System uptime
- Number of releases pushed
- Code quality (via reviews)
- Response to incidents

### 4. SALES TEAM

#### Responsibilities:

- Lead generation
- Merchant prospecting and visits
- Cold calls and outbound emails
- First-level support for sales inquiries
- Daily sales feedback and reporting

#### KPI Metrics:

- Number of leads generated
- Conversion rate
- Number of merchant visits
- Follow-up completion rate
- Daily report submission score
- Sales revenue contribution

### 5. GROWTH TEAM (To be added later)

KPIs will depend on marketing, campaigns, user acquisition metrics, etc.

### 6. HUMAN RESOURCES (HR)

#### Responsibilities:

- Attendance & time management
- Recruitment & onboarding
- HR policy compliance
- Employee engagement
- Documentation
- Administration & facility management
- Strategy & planning

#### KPI Metrics:

- Recruitment cycle time
- Engagement activity completion
- Policy implementation score
- Attendance monitoring accuracy
- Employee satisfaction
- Documentation completeness

### 7. FINANCE TEAM

#### Responsibilities:

- Daily entries in Zoho Books
- Updating expense sheets
- Management account updates
- Preparing invoices
- PAYE/WHT/FIRS tax filings
- Payroll updates
- Salary payment
- Pension payments
- Liquidity management
- Budgeting & variance analysis
- Receivables follow-up
- Financial data management
- Weekly & annual reporting

#### KPI Metrics:

- Zero-error financial entries
- Timeliness of tax filings
- Payroll accuracy
- Budget adherence
- Liquidity stability score
- Receivables recovery rate
- Reporting punctuality

---

## 7. KPI ENGINE DESIGN

A KPI score is calculated using:

```
KPI Score = Σ (Metric Weight × Metric Score)
```

Each department has unique metrics & weights.

### Admin defines:

- KPI categories
- Weight per category
- Scoring range (0–100)
- Frequency (daily, weekly, monthly)

### The system:

- Pulls raw data
- Runs formula rules
- Generates scores for staff and departments

---

## 8. NON-FUNCTIONAL REQUIREMENTS

### Performance

- Mobile app loads within 2 seconds
- KPI engine processes monthly scores < 5 seconds/user

### Security

- Row-level security (Supabase)
- Strict Firestore rules (if Firebase)
- Encrypted image & location data

### Scalability

- Support 1,000+ employees
- Modular for new departments

### Usability

- Clean dashboards
- Easy task workflows

---

## 9. DELIVERABLES

- Database schema
- Flutter mobile app
- Web admin dashboard (React/Next.js)
- KPI engine
- Attendance GPS module
- Department-specific KPI configurations
- Reporting module
- Push notifications
