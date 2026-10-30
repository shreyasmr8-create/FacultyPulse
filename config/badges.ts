export interface BadgeMetricInput {
  totalHosted: number;
  totalAttended: number;
  distinctMonthsCount: number;
  departmentsEngaged: number;
  hasFullCalendarYear: boolean;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  ruleText: string;
  check: (metrics: BadgeMetricInput) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "host-starter",
    name: "Host Starter",
    ruleText: "At least 1 hosted event",
    check: (m) => m.totalHosted >= 1,
  },
  {
    id: "host-pro",
    name: "Host Pro",
    ruleText: "At least 5 hosted events",
    check: (m) => m.totalHosted >= 5,
  },
  {
    id: "host-champion",
    name: "Host Champion",
    ruleText: "At least 15 hosted events",
    check: (m) => m.totalHosted >= 15,
  },
  {
    id: "attendee",
    name: "Attendee",
    ruleText: "At least 10 attended events",
    check: (m) => m.totalAttended >= 10,
  },
  {
    id: "consistent-contributor",
    name: "Consistent Contributor",
    ruleText: "Events in at least 6 different months",
    check: (m) => m.distinctMonthsCount >= 6,
  },
  {
    id: "cross-disciplinary",
    name: "Cross-Disciplinary",
    ruleText: "Events in at least 3 departments",
    check: (m) => m.departmentsEngaged >= 3,
  },
  {
    id: "full-year",
    name: "Full Year",
    ruleText: "Events in all 12 months of one calendar year",
    check: (m) => m.hasFullCalendarYear,
  },
];
