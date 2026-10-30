import { describe, it, expect } from "vitest";
import { EventType } from "@prisma/client";
import { intervalsOverlap } from "@/lib/events/overlap";
import { detectEventType } from "@/lib/ai/detect-type";
import { extractDateRange } from "@/lib/ai/extract-date";
import { parseSearchQueryRuleBased } from "@/lib/ai/parse";
import { scoreAndRankEvents } from "@/lib/ai/score";
import { calculateAchievementsFromEvents } from "@/lib/achievements/metrics";
import { passwordRule, facultyCodeRule } from "@/lib/validation/auth";

describe("Overlap Detection (Section 15.1)", () => {
  it("returns true for partial and full overlap", () => {
    const aStart = new Date("2026-03-10T10:00:00Z");
    const aEnd = new Date("2026-03-10T12:00:00Z");
    const bStart = new Date("2026-03-10T11:00:00Z");
    const bEnd = new Date("2026-03-10T13:00:00Z");

    expect(intervalsOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
    expect(intervalsOverlap(aStart, aEnd, aStart, aEnd)).toBe(true);
  });

  it("returns false for adjacent events", () => {
    const aStart = new Date("2026-03-10T10:00:00Z");
    const aEnd = new Date("2026-03-10T11:00:00Z");
    const bStart = new Date("2026-03-10T11:00:00Z");
    const bEnd = new Date("2026-03-10T12:00:00Z");

    expect(intervalsOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);
  });

  it("detects overlaps on target duplication interval (+7 days)", () => {
    const sourceStart = new Date("2026-03-10T10:00:00Z");
    const sourceEnd = new Date("2026-03-10T12:00:00Z");
    const duration = sourceEnd.getTime() - sourceStart.getTime();

    // Default target date is +7 days
    const targetStart = new Date(sourceStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const targetEnd = new Date(targetStart.getTime() + duration);

    // Existing event on that target date
    const conflictingEventStart = new Date("2026-03-17T11:00:00Z");
    const conflictingEventEnd = new Date("2026-03-17T13:00:00Z");

    expect(intervalsOverlap(targetStart, targetEnd, conflictingEventStart, conflictingEventEnd)).toBe(true);
  });
});

describe("AI Type Detection & Date Extraction (Section 15.1)", () => {
  it("maps keyword groups to the correct EventType", () => {
    expect(detectEventType("events i hosted last month").type).toBe(EventType.HOSTED);
    expect(detectEventType("workshop i attended").type).toBe(EventType.ATTENDED);
    expect(detectEventType("busy days this semester").type).toBe(EventType.BUSY);
  });

  it("extracts relative, seasonal, and absolute date ranges accurately", () => {
    const fixedNow = new Date("2026-10-15T12:00:00Z");

    const spring = extractDateRange("that ai workshop last spring", fixedNow);
    expect(spring.from).toBeDefined();
    expect(spring.label).toContain("spring");

    const march2026 = extractDateRange("something in march 2026", fixedNow);
    expect(march2026.label).toBe("march 2026");

    const year2025 = extractDateRange("conference in 2025", fixedNow);
    expect(year2025.label).toBe("2025");
  });
});

describe("AI Scoring & Ranking (Section 15.1)", () => {
  it("ranks an event matching date + keyword + type above keyword-only", () => {
    const fixedNow = new Date("2026-10-15T12:00:00Z");
    const filter = parseSearchQueryRuleBased(
      "AI workshop I attended in March 2026",
      ["Main Seminar Hall"],
      fixedNow
    );

    const mockEvents = [
      {
        id: "ev-1",
        facultyId: "fac-1",
        title: "AI Workshop on Deep Learning",
        type: EventType.HOSTED,
        startAt: new Date("2024-01-10T10:00:00Z"),
        endAt: new Date("2024-01-10T12:00:00Z"),
        allDay: false,
        location: "Room 101",
        department: "Computer Science",
        organizer: null,
        role: null,
        description: null,
        attachmentUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "ev-2",
        facultyId: "fac-1",
        title: "AI Workshop on Agents",
        type: EventType.ATTENDED,
        startAt: new Date("2026-03-15T10:00:00Z"),
        endAt: new Date("2026-03-15T12:00:00Z"),
        allDay: false,
        location: "Main Seminar Hall",
        department: "Computer Science",
        organizer: null,
        role: null,
        description: null,
        attachmentUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const ranked = scoreAndRankEvents(mockEvents, filter);
    expect(ranked.length).toBe(2);
    expect(ranked[0].event.id).toBe("ev-2");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
});

describe("Achievements Metrics & Badges (Section 15.1)", () => {
  it("calculates exact counts and unlocks expected badges", () => {
    const events = [
      {
        type: EventType.HOSTED,
        startAt: new Date("2026-01-15T10:00:00Z"),
        endAt: new Date("2026-01-15T12:00:00Z"),
        department: "Computer Science",
      },
      {
        type: EventType.ATTENDED,
        startAt: new Date("2026-02-15T10:00:00Z"),
        endAt: new Date("2026-02-15T12:00:00Z"),
        department: "Mathematics",
      },
      {
        type: EventType.BUSY,
        startAt: new Date("2026-03-10T09:00:00Z"),
        endAt: new Date("2026-03-10T17:00:00Z"),
        department: "Physics",
      },
    ];

    const res = calculateAchievementsFromEvents(events, new Date("2026-10-15T12:00:00Z"));
    expect(res.metrics.totalHosted).toBe(1);
    expect(res.metrics.totalAttended).toBe(1);
    expect(res.metrics.totalBusyDays).toBe(1);
    expect(res.metrics.totalEvents).toBe(3);
    expect(res.metrics.departmentsEngaged).toBe(3);
    expect(res.metrics.activeMonthsStreak).toBe(3);

    const hostStarter = res.badges.find((b) => b.id === "host-starter");
    const crossDisciplinary = res.badges.find((b) => b.id === "cross-disciplinary");
    expect(hostStarter?.earned).toBe(true);
    expect(crossDisciplinary?.earned).toBe(true);
  });
});

describe("Password & Faculty ID Validation Rules (Section 15.1)", () => {
  it("validates faculty ID pattern and password strength", () => {
    expect(facultyCodeRule.safeParse("DEMO-001").success).toBe(true);
    expect(facultyCodeRule.safeParse("ab").success).toBe(false);

    expect(passwordRule.safeParse("StrongPass1").success).toBe(true);
    expect(passwordRule.safeParse("short1").success).toBe(false);
    expect(passwordRule.safeParse("onlyletters").success).toBe(false);
  });
});
