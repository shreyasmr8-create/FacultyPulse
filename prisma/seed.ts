import { PrismaClient, EventType } from "@prisma/client";
import { subDays, addDays, addHours, startOfHour } from "date-fns";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

const LOCATIONS = [
  "Main Seminar Hall",
  "Auditorium Block A",
  "CS Lab 302",
  "Conference Room B",
  "Central Library Hall",
  "Innovation Center",
  "Virtual / Zoom",
  "Senate Chamber",
  "Physics Lecture Theatre",
  "Executive Boardroom",
  "Faculty Lounge",
];

const DEPARTMENTS = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Engineering",
  "Management",
  "Economics",
];

const EVENT_TEMPLATES: Array<{
  title: string;
  type: EventType;
  role: string;
  organizer: string;
  description: string;
}> = [
  {
    title: "Machine Learning in Education Workshop",
    type: EventType.ATTENDED,
    role: "Participant",
    organizer: "Dr. Rao",
    description: "Hands-on AI workshop covering applied machine learning models.",
  },
  {
    title: "Department Curriculum Review Meeting",
    type: EventType.HOSTED,
    role: "Chair",
    organizer: "Academic Council",
    description: "Semester syllabus revision and accreditation alignment.",
  },
  {
    title: "National Conference on Quantum Computing",
    type: EventType.ATTENDED,
    role: "Keynote Listener",
    organizer: "IEEE Student Chapter",
    description: "Annual conference on quantum algorithms and hardware.",
  },
  {
    title: "Guest Lecture on Sustainable Engineering",
    type: EventType.HOSTED,
    role: "Organizer",
    organizer: "Dr. Rao",
    description: "Invited guest lecture by Dr. Rao on green infrastructure.",
  },
  {
    title: "University End-Semester Examination Duty",
    type: EventType.BUSY,
    role: "Invigilator",
    organizer: "Examination Cell",
    description: "Full-day examination supervision duty.",
  },
  {
    title: "Faculty Research Ethics Seminar",
    type: EventType.ATTENDED,
    role: "Participant",
    organizer: "Research Dean Office",
    description: "Seminar on academic integrity, citations, and grant compliance.",
  },
  {
    title: "Hackathon Mentorship & Judging Panel",
    type: EventType.HOSTED,
    role: "Panelist",
    organizer: "Innovation Cell",
    description: "Evaluated 25 student software prototypes.",
  },
  {
    title: "NAAC Accreditation Committee Prep",
    type: EventType.BUSY,
    role: "Committee Member",
    organizer: "IQAC",
    description: "Documentation verification and department audit.",
  },
];

async function seedFacultyAccount(params: {
  facultyCode: string;
  fullName: string;
  email: string;
  department: string;
  passwordHash: string;
  reset: boolean;
}) {
  const faculty = await prisma.faculty.upsert({
    where: { facultyCode: params.facultyCode },
    update: {
      fullName: params.fullName,
      email: params.email,
      department: params.department,
      passwordHash: params.passwordHash,
    },
    create: {
      facultyCode: params.facultyCode,
      fullName: params.fullName,
      email: params.email,
      department: params.department,
      passwordHash: params.passwordHash,
    },
  });

  const existingCount = await prisma.event.count({
    where: { facultyId: faculty.id },
  });

  if (existingCount > 0 && !params.reset) {
    console.log(
      `Skipping event creation for ${params.facultyCode} (${existingCount} events already exist). Use --reset to recreate.`
    );
    return;
  }

  if (params.reset) {
    await prisma.event.deleteMany({ where: { facultyId: faculty.id } });
  }

  const now = startOfHour(new Date());
  const eventsToCreate = [];

  for (let i = 0; i < 48; i++) {
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
    const daysAgo = i * 7 + (i % 5);
    const startAt = subDays(now, daysAgo);
    const endAt = addHours(startAt, 2);

    eventsToCreate.push({
      facultyId: faculty.id,
      title:
        i === 3
          ? "Applied AI Workshop"
          : `${template.title} #${Math.floor(i / 8) + 1}`,
      type: template.type,
      startAt,
      endAt,
      allDay: template.type === EventType.BUSY && i % 2 === 0,
      location: LOCATIONS[i % LOCATIONS.length],
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      organizer: template.organizer,
      role: template.role,
      description: template.description,
    });
  }

  for (let u = 1; u <= 4; u++) {
    const template = EVENT_TEMPLATES[u % EVENT_TEMPLATES.length];
    const startAt = addDays(now, u * 4);
    const endAt = addHours(startAt, 2);

    eventsToCreate.push({
      facultyId: faculty.id,
      title: `Upcoming: ${template.title}`,
      type: template.type,
      startAt,
      endAt,
      allDay: false,
      location: LOCATIONS[u % LOCATIONS.length],
      department: DEPARTMENTS[u % DEPARTMENTS.length],
      organizer: template.organizer,
      role: template.role,
      description: template.description,
    });
  }

  await prisma.event.createMany({ data: eventsToCreate });
  console.log(
    `Seeded ${eventsToCreate.length} events for ${params.facultyCode}.`
  );
}

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || "DemoPassword123";
  const reset = process.argv.includes("--reset");
  const passwordHash = await hashPassword(seedPassword);

  await seedFacultyAccount({
    facultyCode: "DEMO-001",
    fullName: "Dr. Ananya Sharma",
    email: "ananya.sharma@university.edu",
    department: "Computer Science",
    passwordHash,
    reset,
  });

  await seedFacultyAccount({
    facultyCode: "DEMO-002",
    fullName: "Prof. Vikram Menon",
    email: "vikram.menon@university.edu",
    department: "Physics",
    passwordHash,
    reset,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
