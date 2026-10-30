# FacultyPulse: Product Requirements Document (PRD)

**Version:** 1.0
**Team size:** 2 developers
**Build window:** 2 days (MVP)
**Audience:** Coding agent (Antigravity) and the two developers
**Status:** Ready to build

---

## 0. How to Use This Document (Instructions for the Coding Agent)

1. Read this entire document before writing any code.
2. Build in the phase order defined in Section 14. Finish and test each phase before starting the next.
3. Build only what is in the **MVP scope** (Section 2). Items marked **Stretch** are optional and must not be started until all MVP acceptance criteria pass.
4. Do not change the tech stack (Section 4) without written approval from the developers.
5. Every database query that reads or writes events must filter by the logged-in faculty's ID. This rule is non-negotiable (see Section 10).
6. Create a `.env.example` file, a `README.md` with setup steps, and a seed script (Section 13).
7. Where this document is silent, choose the simplest option that satisfies the acceptance criteria, and record the decision in `DECISIONS.md`.
8. Commit to Git after each phase with a clear message (for example, `phase-2: calendar and history filters`).

---

## 1. Overview

### 1.1 Product Summary

FacultyPulse is a private web application where university faculty record the academic events they attended, hosted, or were busy with. It gives them a clean history of their activity, an achievements profile calculated from their own records, and one-click semester and year-end reports. An AI search assistant lets them find a past event from a few remembered details.

### 1.2 Problem Statement

Faculty attend seminars, workshops, conferences, committee meetings, and guest lectures throughout the year. When semester or year-end reporting arrives, they reconstruct this from memory, calendars, and email. No simple, personal tool exists for recording attended and hosted events with dates, and no achievements showcase exists for faculty activity.

### 1.3 Goals

| # | Goal | Measure of success |
|---|------|--------------------|
| G1 | Let faculty log events in under 60 seconds | Creating an event takes 5 fields or fewer on the default form |
| G2 | Produce a complete activity report for any date range | Report for a 6-month range generates in under 3 seconds |
| G3 | Show a personal achievements summary | All counts match the underlying records (verified by tests) |
| G4 | Find a forgotten event from partial clues | Correct event appears in the top 5 results for at least 8 of 10 test queries |
| G5 | Keep each faculty member's data private | Automated test confirms no cross-faculty data access |

### 1.4 Non-Goals (Out of Scope for MVP)

- Research publication tracking
- Department-level admin dashboards (Stretch)
- Automatic calendar syncing with Google Calendar or Outlook (Stretch)
- Searching the public web to auto-fill event details (Stretch, see Section 8.6)
- Mobile native apps (the website must be responsive, which is enough)
- Payments, notifications by SMS, or messaging between faculty

---

## 2. Scope

### 2.1 MVP (must be complete)

- F1: Faculty sign-up, sign-in, sign-out, and session handling
- F2: Event create, read, update, delete, and duplicate
- F3: Event list with filters, and a calendar view
- F4: Achievements dashboard and public-free profile card (private to the faculty member)
- F5: Reports for any date range, exported as PDF (print view), CSV, and XLSX
- F6: AI search assistant using the rule-based parser (no API key required)
- F7: Seed data for demonstration
- F8: Deployment to Vercel with a managed PostgreSQL database

### 2.2 Stretch (only after MVP passes)

- S1: LLM-powered query understanding (activates only if an API key is supplied via environment variable)
- S2: Online event lookup with cited sources and mandatory user confirmation
- S3: University SSO login (OIDC or SAML), if the university provides details
- S4: Attachment uploads (certificates, photos) via Vercel Blob
- S5: Department summary report with opt-in sharing
- S6: Password reset by email
- S7: Shareable read-only achievement link

---

## 3. Users and Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Faculty** | Primary user. Signs in with faculty ID and password, or university login. | Full CRUD on own events. View own achievements, calendar, reports, and assistant. |
| **Admin** (Stretch) | University staff. | Read-only department aggregates. Cannot see individual event details unless the faculty has opted in. |

There is only one role in the MVP: **Faculty**.

### 3.1 Primary User Story Examples

- As a faculty member, I want to log a workshop I attended so that I have a record of it.
- As a faculty member, I want to see how many events I hosted this year so that I can report it.
- As a faculty member, I want to type "that AI workshop last spring in the seminar hall" and see the matching event.
- As a faculty member, I want to download my last 6 months of activity as a PDF so that I can submit it at semester end.

---

## 4. Technology Stack (Fixed)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js** (latest stable, App Router, TypeScript) | Frontend and API routes in one project, deploys directly to Vercel |
| Language | **TypeScript** (strict mode) | Catches errors early, important for a 2-day build |
| Styling | **Tailwind CSS** | Fast, consistent UI without writing custom CSS |
| UI components | **shadcn/ui** (Radix-based) | Accessible forms, dialogs, and tables, copy-paste ownership |
| Database | **PostgreSQL** via **Neon** (free tier) | Reliable date handling, works natively with Vercel |
| ORM | **Prisma** | Type-safe queries, easy migrations and seeding |
| Validation | **Zod** | Shared schemas for forms and API input |
| Auth | **bcryptjs** for password hashing, **jose** for signed JWT in an httpOnly cookie | No external auth service needed, simple to explain |
| Calendar UI | **FullCalendar** (React, MIT) or a simple month grid built with date-fns | FullCalendar if setup time allows; otherwise the custom grid |
| Charts | **Recharts** | Simple bar and line charts for achievements |
| Date handling | **date-fns** and **date-fns-tz** | Predictable date math and timezone display |
| Exports | **xlsx** (SheetJS) for Excel, native CSV generation, and print CSS for PDF | Avoids heavy PDF libraries; print-to-PDF is reliable |
| AI (default) | **Custom rule-based parser** (no API key) | Works on day one, fully testable |
| Testing | **Vitest** for unit tests, **Playwright** for 3 end-to-end flows | Fast unit tests, real browser checks for the key flows |
| Hosting | **Vercel** (free tier) | Free, automatic deploys from GitHub |

---

## 5. Information Architecture and Routes

### 5.1 Public Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page with product summary and "Sign in" / "Register" buttons |
| `/register` | Faculty sign-up form |
| `/login` | Sign-in form (faculty ID + password) |
| `/forgot-password` | Stretch (S6) |

### 5.2 Protected Pages (require a valid session)

| Route | Purpose |
|-------|---------|
| `/dashboard` | Summary cards (this month, this year, upcoming), recent events, quick "Add event" button |
| `/events` | Searchable, filterable list of all own events, with pagination |
| `/events/new` | Create event form |
| `/events/[id]` | Event detail view with Edit, Duplicate, and Delete actions |
| `/events/[id]/edit` | Edit event form |
| `/calendar` | Month and week calendar view, color-coded by type |
| `/achievements` | Achievement metrics, badges, charts, and profile card |
| `/reports` | Report builder: choose range and filters, preview, export |
| `/assistant` | AI search chat |
| `/profile` | View and edit name, department, and email. Change password. |

### 5.3 Navigation

- Left sidebar on desktop, bottom tab bar on mobile.
- Items: Dashboard, Events, Calendar, Achievements, Reports, Assistant, Profile, Sign out.
- The active route is highlighted.

---

## 6. Functional Requirements by Feature

### F1: Authentication

**Purpose:** Each faculty member has a private account. Only that faculty member can see their data.

**Functional requirements**

- **F1.1** Registration requires: faculty ID, full name, email, department, password, and password confirmation.
- **F1.2** Faculty ID must be unique and match the pattern defined in `.env` (`FACULTY_ID_PATTERN`, default `^[A-Z0-9-]{4,20}$`). Store it in uppercase.
- **F1.3** Email must be unique and valid.
- **F1.4** Password must be at least 8 characters, contain at least one letter and one number. Show a strength hint on the form.
- **F1.5** Passwords are hashed with bcrypt (cost factor 12). Plain-text passwords are never stored or logged.
- **F1.6** Sign-in accepts faculty ID and password. Errors show a generic message: "Faculty ID or password is incorrect." Do not reveal which field was wrong.
- **F1.7** On successful sign-in, issue a JWT (expires in 7 days) stored in an httpOnly, Secure (in production), SameSite=Lax cookie named `fp_session`.
- **F1.8** Sign-out clears the cookie.
- **F1.9** Protected routes redirect to `/login` with a `next` parameter when no valid session exists. After login, redirect to `next`.
- **F1.10** Rate limit: after 5 failed sign-in attempts for the same faculty ID within 15 minutes, block further attempts for 15 minutes and show "Too many attempts, try again later."
- **F1.11** `GET /api/auth/me` returns the current faculty profile (never includes the password hash).

**University login (MVP):** The MVP uses faculty ID and password. The auth module must be built behind an interface (`AuthProvider` with `signIn`, `getSession`, `signOut`) so that university SSO can be added as a second provider later (S3) without rewriting the app.

### F2: Event Management

**Purpose:** Record what the faculty member attended, hosted, or was busy with.

**Event fields**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | text | Yes | 3 to 150 characters |
| `type` | enum | Yes | `ATTENDED`, `HOSTED`, or `BUSY` |
| `startAt` | datetime | Yes | Date and time the event starts |
| `endAt` | datetime | Yes | Must be after or equal to `startAt`. For all-day events, set to end of that day. |
| `allDay` | boolean | No | Default false. When true, time inputs are hidden. |
| `location` | text | No | Up to 200 characters |
| `department` | text | No | Choose from list or type; up to 100 characters |
| `organizer` | text | No | Up to 150 characters |
| `role` | text | No | Up to 100 characters (e.g. Speaker, Participant, Chair, Organizer, Panelist) |
| `description` | text | No | Up to 2000 characters |
| `attachmentUrl` | text | No | Stretch (S4) |

**Functional requirements**

- **F2.1** Create event from `/events/new` and from a quick-add button on the dashboard.
- **F2.2** Default type is `ATTENDED`. Default start is the next full hour today; default end is one hour later.
- **F2.3** Show a live preview of the duration when start and end are set.
- **F2.4** View event detail at `/events/[id]`. Show all fields. Show "Upcoming" if the start is in the future, "Past" otherwise.
- **F2.5** Edit event. Changes are saved with `updatedAt` refreshed.
- **F2.6** Delete event after a confirmation dialog. Deletion is permanent in the MVP.
- **F2.7** Duplicate event: creates a copy with the same fields and start/end shifted to a date the user chooses. Default to +7 days. This supports recurring weekly meetings.
- **F2.8** Overlapping events are allowed. If an event overlaps with another event by the same faculty member, show a non-blocking warning: "This overlaps with 'Title'."
- **F2.9** Department field offers suggestions from departments already used by the faculty member and a seed list (Computer Science, Mathematics, Physics, Chemistry, Biology, Commerce, Economics, English, Management, Engineering, Other).
- **F2.10** Validation errors appear next to the field with a plain-language message.

### F3: Calendar and History Views

**Purpose:** See activity over time and filter it.

**Functional requirements**

- **F3.1** `/events` shows events in a table with columns: date, title, type, location, role. Default sort: newest first.
- **F3.2** Filter presets: **This week**, **This month**, **Last 3 months**, **Last 6 months**, **This academic year**, **Custom range**.
- **F3.3** Additional filters: type (multi-select), department, free-text search (matches title, location, organizer, description).
- **F3.4** Pagination: 20 rows per page.
- **F3.5** `/calendar` shows a month grid by default with a week toggle. Each day shows up to 3 event chips, with "+N more".
- **F3.6** Event chip colors: Attended (blue), Hosted (green), Busy (amber). Include a legend.
- **F3.7** Clicking a chip opens event detail.
- **F3.8** Filters on the calendar match the events list (same query).
- **F3.9** "Academic year" is configurable in `.env` (`ACADEMIC_YEAR_START_MONTH`, default `7` for July).

### F4: Achievements

**Purpose:** Show experience built from logged records. No manual entry.

**Metrics (calculated server-side with SQL aggregates)**

| Metric | Definition |
|--------|-----------|
| Total hosted | Count of events with type `HOSTED` |
| Total attended | Count of events with type `ATTENDED` |
| Total busy days | Count of distinct calendar dates covered by `BUSY` events |
| Total events | All events |
| Events per year | Count grouped by calendar year |
| Events per month | Count grouped by month, last 12 months |
| Busiest month | Month with the highest total events |
| Active months streak | Longest run of consecutive months with at least one event |
| Departments engaged | Count of distinct departments |

**Badges (rule-based, defined in `config/badges.ts`)**

| Badge | Rule |
|-------|------|
| Host Starter | At least 1 hosted event |
| Host Pro | At least 5 hosted events |
| Host Champion | At least 15 hosted events |
| Attendee | At least 10 attended events |
| Consistent Contributor | Events in at least 6 different months |
| Cross-Disciplinary | Events in at least 3 departments |
| Full Year | Events in all 12 months of one calendar year |

**Functional requirements**

- **F4.1** `/achievements` shows metric cards, a bar chart of events per month (last 12 months), a pie or donut chart of types, and the badge grid (earned badges in color, locked badges in grey with the rule shown on hover or tap).
- **F4.2** Date range selector on the page (default: all time).
- **F4.3** Profile card at the top: name, department, faculty ID, total events, top badge. Includes a "Download as PNG" button (Stretch) or a print-friendly view (MVP).
- **F4.4** All numbers must match the Events list for the same filters. This is verified by a unit test.

### F5: Reports and Exports

**Purpose:** The feature that solves the semester and year-end submission problem.

**Report structure**

1. Header: faculty name, faculty ID, department, report period, generated date
2. Summary: totals (hosted, attended, busy days, total events), departments involved
3. Full event table sorted by date, showing date, title, type, role, organizer, location, and department
4. Footer: "Generated by FacultyPulse on [date]. Records are self-reported by the faculty member."

**Functional requirements**

- **F5.1** `/reports` form: period preset or custom range, optional type and department filters, report title (default "Semester Activity Report").
- **F5.2** Live preview of the report on the same page.
- **F5.3** Export to **PDF**: the "Print / Save as PDF" button opens a print-optimized view with CSS `@media print` rules (hide navigation, A4 sizing, page breaks between sections). The user saves through the browser's print dialog.
- **F5.4** Export to **CSV**: `GET /api/reports/export?format=csv&from=...&to=...`. UTF-8 with BOM so Excel opens it correctly.
- **F5.5** Export to **XLSX**: `GET /api/reports/export?format=xlsx&...`. Two sheets: "Summary" and "Events". Columns auto-sized, header row bold and frozen.
- **F5.6** File names: `FacultyPulse_<FacultyID>_<from>_to_<to>.<ext>`.
- **F5.7** Reports for date ranges longer than 366 days are rejected with a clear message.
- **F5.8** Exports include only the logged-in faculty member's events.

### F6: AI Search Assistant

**Purpose:** Find a past event from partial memory: a date phrase, a keyword, a place, or a type.

**Default mode (MVP): Rule-based parser, no API key needed.**

**Example queries the system must handle**

| Query | Interpreted as |
|-------|----------------|
| "that AI workshop last spring" | Keyword: "AI", "workshop". Date: spring of the previous year relative to today (March to May). |
| "something in the seminar hall in March 2026" | Location: "seminar hall". Date: March 2026. |
| "events I hosted last month" | Type: HOSTED. Date: previous calendar month. |
| "busy days this semester" | Type: BUSY. Date: current academic semester (Jul to Dec or Jan to Jun, from `.env`). |
| "conference in 2025" | Keyword: "conference". Date: year 2025. |
| "guest lecture by Dr. Rao" | Keyword: "guest lecture", "Rao" (matches organizer or description). |
| "last 3 months attended" | Type: ATTENDED. Date: last 3 months. |

**Pipeline (must be implemented in this order)**

1. **Normalize:** lowercase, trim, collapse spaces, remove punctuation except hyphens and dots in names.
2. **Detect type:** keywords map to type. "hosted", "host", "organized", "conducted" → HOSTED. "attended", "went to", "joined", "participated" → ATTENDED. "busy", "busy day", "occupied", "meetings" → BUSY.
3. **Extract date:** Support these patterns:
   - Absolute: "March 2026", "15 March 2026", "2025", "Jan 2025"
   - Relative: "today", "yesterday", "this week", "last week", "this month", "last month", "last 3 months", "last 6 months", "this year", "last year"
   - Seasons: "spring", "summer", "autumn" or "fall", "winter", with year if given; otherwise the most recent completed occurrence
   - Semester: "this semester", "last semester" (uses `ACADEMIC_YEAR_START_MONTH`)
4. **Extract location:** match against the faculty member's previously used locations (fuzzy match, threshold 0.8).
5. **Extract keywords:** remove stopwords (the, a, an, that, some, something, event, i, my, at, in, on, last, this, was, were, had, etc.), remove matched date, type, and location phrases, and keep the rest.
6. **Build a structured filter:** `{ type?, from?, to?, keywords[], location?, organizer? }`.
7. **Query the database** with the filter, scoped to the logged-in faculty member.
8. **Score and rank:**
   - Date falls inside the range: +40
   - Each keyword found in title: +15; in description, organizer, or location: +5
   - Type matches: +10
   - Location matches: +15
   - Results with score 0 are excluded.
   - Return the top 5.
9. **Respond** with the top results as cards (title, date, type, location, match reasons such as "matched: AI, workshop, last spring").
10. **Ask for confirmation** when there are multiple results: "Is this the one?" with a button for each result and "None of these."
11. **Fallback:** If nothing matches, say so and show the parsed filter so the user can see what was understood, with suggestions to broaden it (remove the date, try one keyword).

**Behavior rules**

- **F6.1** The assistant never creates, edits, or deletes events. It only searches.
- **F6.2** Every result shown must be a real record from the database. The assistant must never generate event details.
- **F6.3** Chat history for the session is kept in memory on the page. It is not stored in the database in the MVP.
- **F6.4** Input length limit: 300 characters.
- **F6.5** If the user types a request the parser cannot understand at all (for example, empty or only stopwords), respond with examples of what to type.

**Optional LLM mode (Stretch S1)**

- Enabled only when `AI_PROVIDER` and `AI_API_KEY` are set in environment variables.
- The LLM receives the user's message and today's date, and must return only the same JSON filter object as the rule-based parser. The output is validated with Zod.
- The backend then runs the same database query and scoring. The LLM never sees the full event list and never writes data.
- If the LLM call fails or times out (8-second limit), fall back to the rule-based parser automatically.

**Online lookup (Stretch S2)**

- Triggered only by an explicit button: "Search the web for this event."
- Requires a search API key in environment variables.
- Results are shown as suggestions with source links and must be confirmed before anything is saved.
- Nothing is saved automatically. Ever.

### F7: Seed Data (Demo)

- **F7.1** `prisma/seed.ts` creates 2 demo faculty accounts (for example, `DEMO-001` and `DEMO-002`) with the password from `.env` (`SEED_PASSWORD`).
- **F7.2** Each demo faculty gets 40 to 60 events spread across the last 12 months, covering all three types, at least 5 departments, and at least 10 different locations. Include some recurring weekly meetings and a few upcoming events.
- **F7.3** Seed data uses realistic but fictional event titles (for example, "Machine Learning in Education Workshop", "Department Curriculum Review Meeting").
- **F7.4** Running the seed twice must not create duplicates (use upsert or clear before seeding, controlled by a `--reset` flag).

---

## 7. Data Model

### 7.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum EventType {
  ATTENDED
  HOSTED
  BUSY
}

model Faculty {
  id           String   @id @default(cuid())
  facultyCode  String   @unique
  fullName     String
  email        String   @unique
  department   String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  events       Event[]
  resetTokens  PasswordResetToken[]
}

model Event {
  id            String    @id @default(cuid())
  facultyId     String
  faculty       Faculty   @relation(fields: [facultyId], references: [id], onDelete: Cascade)

  title         String
  type          EventType
  startAt       DateTime
  endAt         DateTime
  allDay        Boolean   @default(false)
  location      String?
  department    String?
  organizer     String?
  role          String?
  description   String?
  attachmentUrl String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([facultyId, startAt])
  @@index([facultyId, type])
}

model PasswordResetToken {
  id          String   @id @default(cuid())
  facultyId   String
  faculty     Faculty  @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  tokenHash   String   @unique
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime @default(now())
}
```

### 7.2 Data Rules

- All timestamps are stored in UTC.
- Display times in the timezone from `APP_TIMEZONE` (default `Asia/Kolkata`; change in `.env` if needed).
- Deleting a faculty account deletes all their events (cascade).
- `PasswordResetToken` is only used in Stretch S6.

---

## 8. API Specification

All API routes live under `app/api/`. All responses are JSON. Errors use this shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "End time must be after start time.", "fields": { "endAt": "..." } } }
```

Status codes: 200 OK, 201 Created, 400 validation error, 401 not signed in, 404 not found (also returned when the record belongs to another faculty member), 409 conflict (duplicate faculty ID or email), 429 too many attempts, 500 server error.

### 8.1 Auth

| Method | Path | Body or query | Success |
|--------|------|---------------|---------|
| POST | `/api/auth/register` | `facultyCode, fullName, email, department, password` | 201, sets cookie |
| POST | `/api/auth/login` | `facultyCode, password` | 200, sets cookie |
| POST | `/api/auth/logout` | none | 200, clears cookie |
| GET | `/api/auth/me` | none | 200 with faculty profile |
| PATCH | `/api/auth/me` | `fullName, email, department` | 200 |
| POST | `/api/auth/change-password` | `currentPassword, newPassword` | 200 |

### 8.2 Events

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/events` | Query: `from, to, type, department, q, page, pageSize` (default 20). Returns `{ items, total, page }`. |
| POST | `/api/events` | Body: event fields. Returns 201 with the created event. |
| GET | `/api/events/[id]` | 404 if not owned by the caller. |
| PATCH | `/api/events/[id]` | Partial update. |
| DELETE | `/api/events/[id]` | 204 on success. |
| POST | `/api/events/[id]/duplicate` | Body: `{ startAt }` for the new start. Returns 201. |
| GET | `/api/events/overlaps` | Query: `startAt, endAt, excludeId`. Returns list of overlapping events. |
| GET | `/api/events/departments` | Returns the faculty's used departments merged with the seed list. |

### 8.3 Calendar

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/calendar` | Query: `from, to`. Returns events grouped by date. Used by the calendar view. |

### 8.4 Achievements

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/achievements` | Query: `from, to` (optional). Returns metrics, monthly series, type breakdown, and earned badges. |

### 8.5 Reports

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/reports` | Query: `from, to, type, department`. Returns report JSON (summary plus events). Used for the live preview. |
| GET | `/api/reports/export` | Query: same as above plus `format=csv` or `format=xlsx`. Returns file download. |

### 8.6 AI Assistant

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/ai/search` | Body: `{ message: string }`. Returns `{ understood: Filter, results: Event[], message: string, needsConfirmation: boolean }`. |
| GET | `/api/ai/status` | Returns `{ mode: "rule-based" \| "llm" }`. |

---

## 9. Pages: Detailed UI Requirements

### 9.1 Landing Page (`/`)

- Hero: product name, tagline ("Every event you attended, hosted, or were busy with, in one private place."), two buttons.
- Three feature cards: Track events, See achievements, Generate reports.
- Footer with the project name and "Built for [University Name]" (configurable).

### 9.2 Register and Login

- Single column, centered, max width 420px.
- Fields with labels above, not placeholder-only.
- Submit button shows a spinner while loading and is disabled during the request.
- Errors appear in a banner above the form and beside the relevant field.
- Link between the two pages.

### 9.3 Dashboard

- Row 1: 4 summary cards: Events this month, Hosted this year, Attended this year, Upcoming events.
- Row 2: "Upcoming" list (next 5 events) and "Recent activity" list (last 5 events).
- Floating or top-right "Add event" button.
- Empty state for new users: an illustration or icon, one sentence, and a button "Log your first event."

### 9.4 Events List

- Filter bar at top: preset dropdown, type chips, department dropdown, search box.
- Table on desktop, cards on mobile.
- Each row is clickable.
- Pagination control at bottom.
- Empty state when no results match the filters, with a "Clear filters" button.

### 9.5 Event Form

- Two columns on desktop, one column on mobile.
- Groups: Basics (title, type), When (date, start, end, all-day toggle), Where and who (location, department, organizer, role), Details (description with character counter).
- Save and Cancel buttons. Save is disabled until required fields are valid.
- Unsaved changes prompt when leaving the page.

### 9.6 Calendar

- Header: month name, previous and next buttons, Today button, Month and Week toggle.
- Legend below the header with the three type colors.
- Mobile: show a list view for the selected day instead of the grid.

### 9.7 Achievements

- Top: profile card (name, department, faculty ID, total events, top badge), with a "Print profile" button.
- Metric cards in a responsive grid (2 columns on mobile, 4 on desktop).
- Charts section: monthly bar chart and type donut chart.
- Badges section: grid with earned and locked states.

### 9.8 Reports

- Left column: form (period, filters, title). Right column: live preview (desktop) or below the form (mobile).
- Export buttons: "Print / Save as PDF", "Download CSV", "Download Excel".
- The printed report uses the print CSS and hides the form and navigation.

### 9.9 Assistant

- Chat layout: messages scroll upward, input is fixed at the bottom.
- Suggested prompts shown as chips when the chat is empty (use the example queries from F6).
- Each assistant reply with results shows result cards. Each card has an "Open" link and a "This is the one" button.
- Show a small badge: "Rule-based search" or "AI-assisted search" based on `/api/ai/status`.

### 9.10 Profile

- Form to edit name, email, and department.
- Separate section to change password.
- Danger zone: "Delete my account" with a confirmation that requires typing the faculty ID. (Deletes all data.)

---

## 10. Security and Privacy Requirements

These are mandatory for the MVP.

| # | Requirement |
|---|-------------|
| SEC1 | Every event query and mutation includes `facultyId = session.facultyId` in the `where` clause. |
| SEC2 | Accessing another faculty member's event returns 404, not 403, so that event IDs cannot be probed. |
| SEC3 | Passwords hashed with bcrypt (cost 12). Never returned in any API response. |
| SEC4 | Session cookie: httpOnly, Secure in production, SameSite=Lax, 7-day expiry. |
| SEC5 | All API inputs validated with Zod. Reject unknown fields. |
| SEC6 | Maximum lengths enforced on every text field (see Section 6, F2). |
| SEC7 | Rate limiting on login (F1.10) and on AI search (30 requests per user per hour). |
| SEC8 | Secrets only in environment variables. `.env` is in `.gitignore`. `.env.example` lists names without values. |
| SEC9 | No event data written to logs. Log only request path, status, and duration. |
| SEC10 | Output escaping: rely on React's default escaping. Never use `dangerouslySetInnerHTML` with user content. |
| SEC11 | Exports and reports include only the caller's data (tested). |
| SEC12 | Account deletion removes all data permanently after confirmation. |

**Privacy statement** (show on the register page): "Your records are visible only to you. Administrators do not see individual events."

---

## 11. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Pages load in under 2 seconds on a standard connection. Event list query under 300 ms with 1,000 events per faculty. Report for 6 months under 3 seconds. |
| Responsiveness | Works on screens from 360px wide to 1920px wide. Touch targets at least 44px. |
| Accessibility | Keyboard navigation for all controls. Visible focus states. Form labels linked to inputs. Color is never the only indicator (type chips include text). Contrast meets WCAG AA. |
| Reliability | Database writes wrapped in transactions where multiple records change. Clear error messages on failure. |
| Browser support | Latest two versions of Chrome, Edge, Firefox, and Safari. |
| Maintainability | TypeScript strict mode. ESLint and Prettier configured. No `any` types except where documented. |
| Localization | English only in MVP. Date formats use the `en-IN` locale by default (configurable). |

---

## 12. Project Structure

```
facultypulse/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Landing
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx                # Auth guard + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── achievements/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── assistant/page.tsx
│   │   └── profile/page.tsx
│   └── api/
│       ├── auth/
│       ├── events/
│       ├── calendar/route.ts
│       ├── achievements/route.ts
│       ├── reports/
│       └── ai/
├── components/                       # UI components (shadcn + custom)
├── lib/
│   ├── auth/
│   │   ├── provider.ts               # AuthProvider interface
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── rate-limit.ts
│   ├── db.ts                         # Prisma client singleton
│   ├── validation/                   # Zod schemas
│   ├── events/
│   │   ├── queries.ts                # All event queries (scoped by facultyId)
│   │   └── overlap.ts
│   ├── achievements/
│   │   ├── metrics.ts
│   │   └── badges.ts
│   ├── reports/
│   │   ├── build.ts
│   │   ├── csv.ts
│   │   └── xlsx.ts
│   ├── ai/
│   │   ├── normalize.ts
│   │   ├── detect-type.ts
│   │   ├── extract-date.ts
│   │   ├── extract-keywords.ts
│   │   ├── parse.ts                  # Orchestrates the pipeline
│   │   ├── score.ts
│   │   └── llm-adapter.ts            # Stretch S1
│   └── time.ts                       # Timezone helpers
├── config/
│   ├── badges.ts
│   ├── departments.ts
│   └── constants.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/                         # Vitest
│   └── e2e/                          # Playwright
├── .env.example
├── DECISIONS.md
├── README.md
└── package.json
```

---

## 13. Environment Variables

Create `.env.example` with these keys and empty values. Never commit real values.

```
# Database
DATABASE_URL=

# Auth
JWT_SECRET=                    # at least 32 random characters
SESSION_DAYS=7
FACULTY_ID_PATTERN=^[A-Z0-9-]{4,20}$

# App
APP_NAME=FacultyPulse
UNIVERSITY_NAME=
APP_TIMEZONE=Asia/Kolkata
ACADEMIC_YEAR_START_MONTH=7    # 1 to 12
NEXT_PUBLIC_APP_URL=

# Seed
SEED_PASSWORD=                 # password for demo accounts only

# AI (optional, Stretch S1)
AI_PROVIDER=                   # leave empty for rule-based mode
AI_API_KEY=
```

---

## 14. Build Plan (2 Days, Two Developers)

Developer A focuses on **backend, database, auth, and achievements**. Developer B focuses on **frontend, calendar, reports, and the assistant UI**. Both work on the AI parser tests together on Day 2.

### Day 1

| Block | Developer A | Developer B |
|-------|-------------|-------------|
| Morning (0 to 3 hrs) | Project setup, Prisma schema, migrations, Neon database, `.env` setup | Next.js project setup, Tailwind, shadcn, layout shell, sidebar, landing page |
| Midday (3 to 6 hrs) | Auth: register, login, logout, `me`, JWT cookie, route guard, rate limit | Register and login pages, protected layout, form validation with Zod |
| Afternoon (6 to 9 hrs) | Event API: list, create, read, update, delete, duplicate, overlap check | Event form, events list page with filters and pagination |
| Evening (9 to 10 hrs) | Seed script and seed data | Event detail and edit pages, dashboard summary cards |

**Day 1 checkpoint:** A faculty member can register, sign in, create an event, see it in the list, edit it, and delete it. Commit and push.

### Day 2

| Block | Developer A | Developer B |
|-------|-------------|-------------|
| Morning (0 to 3 hrs) | Achievements metrics and badges API, unit tests for metrics | Calendar page (month and week), achievements page with charts |
| Midday (3 to 6 hrs) | Reports API: JSON, CSV, XLSX export | Reports page: form, live preview, print CSS, export buttons |
| Afternoon (6 to 8 hrs) | AI parser pipeline (normalize, type, date, keywords, scoring) and unit tests | Assistant UI: chat, result cards, confirmation, status badge |
| Late afternoon (8 to 9 hrs) | Connect parser to `/api/ai/search`, rate limit | Profile page, account deletion, responsive polish |
| Final (9 to 10 hrs) | Security checklist (Section 10), cross-faculty access test | Playwright tests for 3 flows, Vercel deploy, README |

**Day 2 checkpoint:** All MVP acceptance criteria pass. Deployed to Vercel. Demo accounts work.

### Priority Rule for Time Pressure

If the schedule slips, cut in this order (last item cut first):
1. Playwright end-to-end tests (keep unit tests)
2. Week view on the calendar (keep month view)
3. Achievements charts (keep metric cards and badges)
4. Calendar entirely (keep list view with date filters)
5. XLSX export (keep CSV and print PDF)

Never cut: authentication, data isolation (SEC1 and SEC2), event CRUD, reports with PDF/CSV, the rule-based AI search.

---

## 15. Testing Requirements

### 15.1 Unit Tests (Vitest)

- **Achievements:** given a fixed set of 20 seeded events, every metric and badge equals the expected value.
- **Date parser:** at least 25 test phrases from F6 map to the correct date range (use a fixed "today" value in tests).
- **Type detection:** each keyword group maps to the correct type.
- **Scoring:** a result with a matching date, keyword, and type ranks above one matching only the keyword.
- **Overlap detection:** returns true for partial and full overlap, false for adjacent events.
- **Report totals:** totals equal the sum of the event rows.
- **Password rules and faculty ID pattern:** valid and invalid examples.

### 15.2 Security Tests

- **Cross-faculty isolation:** sign in as DEMO-001, request an event owned by DEMO-002 by ID. Expect 404 on GET, PATCH, DELETE, and duplicate.
- **Exports:** the CSV and XLSX contain only the caller's records.
- **Login rate limit:** the sixth failed attempt returns 429.
- **Cookie flags:** the session cookie is httpOnly and SameSite=Lax.
- **Password hash:** no API response contains `passwordHash`.

### 15.3 End-to-End Tests (Playwright, 3 flows)

1. Register, sign in, create an event, see it on the dashboard and events list.
2. Open the assistant, type "AI workshop last spring", see result cards or an understandable empty state.
3. Open reports, choose "Last 6 months", download CSV, confirm the file opens and contains rows.

### 15.4 Acceptance Test Set for the AI Search

Create `tests/ai-acceptance.json` with 10 queries and expected event titles from the seed data. The test passes when the expected event appears in the top 5 results for at least 8 of 10 queries (goal G4).

---

## 16. Deployment

1. Create a Neon PostgreSQL database. Copy the connection string into `DATABASE_URL`.
2. Push the repository to GitHub.
3. Import the repository into Vercel.
4. Add all environment variables from `.env.example` in Vercel project settings.
5. Set the build command to `prisma generate && prisma migrate deploy && next build`.
6. Run `npx prisma db seed` once, locally or through a one-time script, to create demo data.
7. Confirm `NEXT_PUBLIC_APP_URL` matches the Vercel URL.
8. Test sign-in with a demo account on the live URL.

---

## 17. Definition of Done (MVP)

The MVP is complete when all of the following are true:

- [ ] A new faculty member can register with faculty ID, name, email, department, and password.
- [ ] A registered faculty member can sign in and sign out. Protected pages redirect when signed out.
- [ ] Faculty can create, view, edit, duplicate, and delete their own events.
- [ ] The events list filters work for all presets, types, departments, and search text.
- [ ] The calendar shows events by month with color-coded types.
- [ ] The achievements page shows all metrics and badges, and the numbers match the events list.
- [ ] Reports show a summary and full table for any date range, print to PDF, and export CSV and XLSX.
- [ ] The AI assistant answers the example queries in Section 6 (F6) using only real records, with a confirmation step when several results match.
- [ ] Cross-faculty access tests pass (Section 15.2).
- [ ] Unit tests and the 3 end-to-end flows pass.
- [ ] The app is live on Vercel with demo accounts working.
- [ ] `README.md` explains setup, environment variables, seeding, and deployment.
- [ ] `DECISIONS.md` records every design choice the agent made beyond this PRD.

---

## 18. Open Questions and Assumptions

These must be answered by the developers. Until they are answered, use the default shown.

| # | Question | Default used in this PRD |
|---|----------|--------------------------|
| Q1 | What are the exact details of the university login system (protocol, endpoints, client ID)? | Faculty ID and password authentication. University SSO is Stretch S3. |
| Q2 | What is the official faculty ID format? | `^[A-Z0-9-]{4,20}$`, set in `.env`. |
| Q3 | What is the university's academic year start month? | July (`ACADEMIC_YEAR_START_MONTH=7`). |
| Q4 | What timezone should be used for display? | `Asia/Kolkata`. |
| Q5 | Is the department list complete? | Seed list in `config/departments.ts`. Faculty can type a new department. |
| Q6 | Do reports need an official university header or logo? | No. Text header only. |
| Q7 | Will certificates or photos need to be uploaded? | Not in MVP. Stretch S4. |
| Q8 | Will an LLM API key be available for the demo? | No. The rule-based parser is the default and is fully functional. |

**Assumptions**

- Each faculty member logs only their own activity. Events are not shared between faculty members.
- Event titles and descriptions are entered in English.
- The demo runs on the Vercel free tier and Neon free tier, which is sufficient for 2 to 5 demo users.
- Faculty members will self-report accurately. The report footer states this.

---

## 19. Glossary

| Term | Meaning |
|------|---------|
| Attended | An event the faculty member took part in as a participant or audience member |
| Hosted | An event the faculty member organized, chaired, or conducted |
| Busy day | A day with academic commitments that are not a specific event (for example, exam duty or committee work) |
| Faculty ID | Unique identifier issued by the university to each faculty member |
| Rule-based parser | Search assistant logic that uses patterns and keywords instead of an external AI service |
| Stretch | Optional feature, started only after MVP acceptance |

---

*End of PRD.*
