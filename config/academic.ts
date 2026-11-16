import { EventCategory, EventType } from "@prisma/client";

export interface AcademicRoleOption {
  label: string;
  value: string;
  defaultType: EventType;
  description?: string;
}

export interface AcademicCategoryConfig {
  id: EventCategory;
  label: string;
  badgeClass: string;
  roles: AcademicRoleOption[];
}

export const ACADEMIC_CATEGORIES: Record<EventCategory, AcademicCategoryConfig> = {
  CONFERENCE: {
    id: "CONFERENCE",
    label: "Conference",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    roles: [
      {
        label: "Conference Attended By",
        value: "Conference Attended By",
        defaultType: "ATTENDED",
        description: "Participated as attendee/delegate in academic conference",
      },
      {
        label: "Conference Presented",
        value: "Conference Presented",
        defaultType: "ATTENDED",
        description: "Presented research paper, poster, or keynote presentation",
      },
      {
        label: "Conference Hosted",
        value: "Conference Hosted",
        defaultType: "HOSTED",
        description: "Convenor, co-convenor, or organizing committee member",
      },
      {
        label: "Conference Jury",
        value: "Conference Jury",
        defaultType: "HOSTED",
        description: "Served on peer-review jury, evaluation panel, or track judge",
      },
    ],
  },
  SEMINAR: {
    id: "SEMINAR",
    label: "Seminar",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    roles: [
      {
        label: "Seminar Attended",
        value: "Seminar Attended",
        defaultType: "ATTENDED",
        description: "Attended seminar session or colloquium",
      },
      {
        label: "Seminar Hosted",
        value: "Seminar Hosted",
        defaultType: "HOSTED",
        description: "Organized or coordinated institutional seminar",
      },
      {
        label: "Seminar Speaker",
        value: "Seminar Speaker",
        defaultType: "HOSTED",
        description: "Invited speaker or delivered academic seminar address",
      },
    ],
  },
  WORKSHOP: {
    id: "WORKSHOP",
    label: "Workshop",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    roles: [
      {
        label: "Workshop Attended",
        value: "Workshop Attended",
        defaultType: "ATTENDED",
        description: "Attended hands-on technical workshop or training",
      },
      {
        label: "Workshop Hosted",
        value: "Workshop Hosted",
        defaultType: "HOSTED",
        description: "Conducted or organized hands-on technical workshop",
      },
      {
        label: "Workshop Speaker",
        value: "Workshop Speaker",
        defaultType: "HOSTED",
        description: "Key speaker or resource person conducting workshop module",
      },
    ],
  },
  JOURNAL: {
    id: "JOURNAL",
    label: "Journal",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    roles: [
      {
        label: "Journal Chairperson",
        value: "Journal Chairperson",
        defaultType: "HOSTED",
        description: "Session chair, editorial board chair, or chief editor",
      },
      {
        label: "Journal Reviewer / Editorial Board",
        value: "Journal Reviewer",
        defaultType: "HOSTED",
        description: "Peer reviewer or editorial board member",
      },
    ],
  },
  MEETING: {
    id: "MEETING",
    label: "Meeting",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    roles: [
      {
        label: "Department Committee Meeting",
        value: "Committee Meeting",
        defaultType: "BUSY",
      },
      {
        label: "Board of Studies (BoS) Meeting",
        value: "BoS Meeting",
        defaultType: "BUSY",
      },
    ],
  },
  GUEST_LECTURE: {
    id: "GUEST_LECTURE",
    label: "Guest Lecture",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    roles: [
      {
        label: "Guest Lecture Delivered",
        value: "Guest Lecture Delivered",
        defaultType: "HOSTED",
      },
      {
        label: "Guest Lecture Hosted",
        value: "Guest Lecture Hosted",
        defaultType: "HOSTED",
      },
      {
        label: "Guest Lecture Attended",
        value: "Guest Lecture Attended",
        defaultType: "ATTENDED",
      },
    ],
  },
  OTHER: {
    id: "OTHER",
    label: "Other Academic",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    roles: [
      {
        label: "Faculty Development Program (FDP)",
        value: "FDP Participant",
        defaultType: "ATTENDED",
      },
      {
        label: "General Academic Activity",
        value: "Academic Contributor",
        defaultType: "ATTENDED",
      },
    ],
  },
};
