export const APP_CONFIG = {
  appName: process.env.APP_NAME || "FacultyPulse",
  universityName: process.env.UNIVERSITY_NAME || "University",
  timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  academicYearStartMonth: Number(process.env.ACADEMIC_YEAR_START_MONTH || 7),
  sessionDays: Number(process.env.SESSION_DAYS || 7),
  sessionCookieName: "fp_session",
  facultyIdPattern: new RegExp(
    process.env.FACULTY_ID_PATTERN || "^[A-Z0-9-]{4,20}$"
  ),
  maxReportDays: 366,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;
