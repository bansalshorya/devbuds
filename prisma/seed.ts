import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - n * DAY);
}

const SUBJECTS = ["Data Structures", "DBMS", "Operating Systems", "Maths", "Networks"];

const NAMES = [
  "Aarthi Subramanian", "Karthik Rajan", "Meenakshi Sundaram", "Vignesh Kumar",
  "Priya Dharshini", "Mohammed Irfan", "Divya Bharathi", "Arjun Venkatesh",
  "Nandhini Selvam", "Suresh Babu", "Kavya Lakshmi", "Joseph Anthony",
  "Harini Chandran", "Dinesh Kannan", "Swetha Murugan", "Rahul Menon",
  "Anitha Ramesh", "Santhosh Pandian", "Ishwarya Balaji", "Gokul Raj",
];

const SUMMARIES = [
  "Discussed study plan for the coming internal tests. Student is settled and attending regularly.",
  "Talked about project team work and time management. No concerns raised.",
  "Reviewed last test results and agreed on weekly revision hours.",
];

type Scenario = {
  attendancePct: (subject: number, week: number) => number; // week 0 = oldest, 7 = latest
  markDecline: number[]; // subject indexes whose marks fall
  lmsLastDaysAgo: number;
  lastMetDaysAgo: number;
  overdueFollowUpDaysAgo?: number;
};

function scenarioFor(i: number): Scenario {
  const s: Scenario = {
    attendancePct: () => 88 + (i % 5),
    markDecline: [],
    lmsLastDaysAgo: (i % 4) + 1,
    lastMetDaysAgo: 12 + (i % 10),
  };
  if (i === 1) s.attendancePct = (sub) => ([1, 2, 3].includes(sub) ? 62 + sub : 86);
  if (i === 3) {
    s.attendancePct = (_sub, wk) => (wk < 5 ? 86 : 56);
    s.markDecline = [0, 1, 3];
  }
  if (i === 5) s.markDecline = [1, 2, 4];
  if (i === 7) s.lmsLastDaysAgo = 21;
  if (i === 9) {
    s.lastMetDaysAgo = 30;
    s.overdueFollowUpDaysAgo = 9;
  }
  if (i === 11) s.lastMetDaysAgo = 49;
  if (i === 13) {
    s.attendancePct = (_sub, wk) => (wk < 5 ? 84 : 60);
    s.markDecline = [0, 2];
    s.lmsLastDaysAgo = 18;
  }
  return s;
}

async function main() {
  // Clear old demo data (children first).
  await prisma.followUp.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.lmsActivity.deleteMany();
  await prisma.internalMark.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.mentorAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const dept = await prisma.department.create({ data: { name: "Computer Science" } });

  const mentor = await prisma.user.create({
    data: { name: "Dr. Lakshmi Narayanan", mobile: "9000000001", role: "MENTOR", departmentId: dept.id },
  });
  await prisma.user.create({
    data: { name: "Prof. Ramesh Iyer (HOD)", mobile: "9000000002", role: "HOD", departmentId: dept.id },
  });

  for (let i = 0; i < NAMES.length; i++) {
    const sc = scenarioFor(i);
    const user = await prisma.user.create({
      data: {
        name: NAMES[i],
        mobile: `91000000${String(i + 1).padStart(2, "0")}`,
        role: "STUDENT",
        departmentId: dept.id,
      },
    });
    const student = await prisma.student.create({
      data: { rollNo: `21CS${String(i + 1).padStart(3, "0")}`, userId: user.id, departmentId: dept.id },
    });
    await prisma.mentorAssignment.create({ data: { mentorId: mentor.id, studentId: student.id } });

    // Attendance: 8 weeks x 5 subjects, 10 classes per subject per week.
    const attendance = [];
    for (let w = 0; w < 8; w++) {
      for (let sub = 0; sub < SUBJECTS.length; sub++) {
        attendance.push({
          studentId: student.id,
          subject: SUBJECTS[sub],
          weekStart: daysAgo((7 - w) * 7),
          total: 10,
          attended: Math.round((10 * sc.attendancePct(sub, w)) / 100),
        });
      }
    }
    await prisma.attendanceRecord.createMany({ data: attendance });

    // Internal marks: 3 tests per subject, out of 50.
    const marks = [];
    const testDays = [56, 28, 7];
    for (let sub = 0; sub < SUBJECTS.length; sub++) {
      const base = 36 + ((i + sub) % 4) * 2;
      const scores = sc.markDecline.includes(sub) ? [base, base - 4, base - 12] : [base, base + 1, base + 1];
      for (let a = 0; a < 3; a++) {
        marks.push({
          studentId: student.id,
          subject: SUBJECTS[sub],
          assessment: `CAT ${a + 1}`,
          assessedOn: daysAgo(testDays[a]),
          score: scores[a],
          maxScore: 50,
        });
      }
    }
    await prisma.internalMark.createMany({ data: marks });

    // LMS activity.
    const lms = [];
    for (let k = 0; k < 10; k++) {
      lms.push({ studentId: student.id, activityOn: daysAgo(sc.lmsLastDaysAgo + k * 2), events: 5 + (k % 4) });
    }
    await prisma.lmsActivity.createMany({ data: lms });

    // One confirmed past meeting (and an open follow-up for the overdue case).
    await prisma.meeting.create({
      data: {
        clientSubmissionId: `seed-${i}`,
        mentorId: mentor.id,
        studentId: student.id,
        meetingDate: daysAgo(sc.lastMetDaysAgo),
        language: i % 3 === 0 ? "Tamil" : "English",
        summary: SUMMARIES[i % SUMMARIES.length],
        topics: ["Attendance", "Study plan"],
        confirmedAt: new Date(),
        followUps:
          sc.overdueFollowUpDaysAgo !== undefined
            ? {
                create: [
                  {
                    studentId: student.id,
                    mentorId: mentor.id,
                    action: "Submit the DBMS assignment and attend the remedial class",
                    dueDate: daysAgo(sc.overdueFollowUpDaysAgo),
                  },
                ],
              }
            : undefined,
      },
    });
  }

  console.log("Seed done.");
  console.log("Mentor login: 9000000001 | HOD: 9000000002 | Student: 9100000001 ... 9100000020 | OTP: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());