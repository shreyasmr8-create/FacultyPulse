# FacultyPulse — Full Backend & Project Workspace (Ready for Antigravity)

This folder contains the complete, production-ready **Next.js App Router Backend, Prisma Schema, Seed Script, AI Rule-Based Search Engine, Achievements Calculator, Report Exporter (CSV/XLSX), and Unit Test Suite** for **FacultyPulse** per the PRD.

---

## Quick Start for Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL` (e.g., your Neon PostgreSQL connection string) and `JWT_SECRET` (at least 32 characters).
3. **Run database migrations & seed demo accounts:**
   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```
   - Demo Account 1: `DEMO-001` / `DemoPassword123`
   - Demo Account 2: `DEMO-002` / `DemoPassword123`
4. **Run unit tests:**
   ```bash
   npm test
   ```
5. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Instructions for Coding Agent (Antigravity) — Frontend Build Handoff

All backend layers (`prisma/`, `config/`, `lib/`, `app/api/`, `middleware.ts`, and `tests/unit/`) are **100% implemented and tested**.

When building the frontend in Antigravity:
1. **Do NOT modify the API contracts or remove `facultyId` scoping** in `lib/` or `app/api/`.
2. **Build the UI pages** specified in Section 5 and Section 9 of the PRD under:
   - `app/(public)/page.tsx` (Landing page)
   - `app/(public)/login/page.tsx` (Sign-in form calling `POST /api/auth/login`)
   - `app/(public)/register/page.tsx` (Registration form calling `POST /api/auth/register`)
   - `app/(protected)/layout.tsx` (Sidebar on desktop, bottom tab bar on mobile)
   - `app/(protected)/dashboard/page.tsx` (Summary cards, upcoming & recent events, quick-add button)
   - `app/(protected)/events/page.tsx` (Filterable, paginated event table/cards calling `GET /api/events`)
   - `app/(protected)/events/new/page.tsx` (Create event form with live duration & overlap warning via `/api/events/overlaps`)
   - `app/(protected)/events/[id]/page.tsx` (Event detail view with Edit, Duplicate, Delete actions)
   - `app/(protected)/events/[id]/edit/page.tsx` (Edit event form)
   - `app/(protected)/calendar/page.tsx` (Month/week calendar view calling `GET /api/calendar`)
   - `app/(protected)/achievements/page.tsx` (Metrics, Recharts bar/donut charts, badge grid calling `GET /api/achievements`)
   - `app/(protected)/reports/page.tsx` (Report builder, live preview, `@media print` PDF view, CSV/XLSX download links to `/api/reports/export`)
   - `app/(protected)/assistant/page.tsx` (AI search chat calling `POST /api/ai/search` and `GET /api/ai/status`)
   - `app/(protected)/profile/page.tsx` (Profile update, password change, and danger zone account deletion)
# FacultyPulse
