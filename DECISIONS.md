# FacultyPulse Architectural & Implementation Decisions

1. **Overlap Detection Semantics (`lib/events/overlap.ts`)**:
   - Two events overlap when `startA < endB && endA > startB`. Adjacent events where `endA === startB` do not trigger a false-positive overlap warning, matching Section 15.1.
2. **Account Deletion Endpoint (`DELETE /api/auth/me`)**:
   - Section 9.10 and `SEC12` require account deletion with Faculty ID confirmation. Implemented on `DELETE /api/auth/me` requiring `{ confirmFacultyCode }` and relying on Prisma `onDelete: Cascade` to purge all associated events.
3. **CSV Injection Protection (`lib/reports/csv.ts`)**:
   - In addition to UTF-8 BOM (`\uFEFF`) for Excel compatibility, cell values starting with `=`, `+`, `-`, or `@` are prefixed with a single quote (`'`) to prevent spreadsheet formula injection.
4. **AI Search Scoring & Ranking (`lib/ai/score.ts`)**:
   - Candidate events are fetched with `facultyId = session.facultyId` first, then scored in-memory using the exact weights from Section 6 (`F6`) so partial matches across date, keyword, location, and type rank deterministically.
