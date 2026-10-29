import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { formatDate } from "@/lib/dates";
import { LogoutButton } from "@/components/LogoutButton";

export default function StudentPage() {
  return (
    <Suspense fallback={<p className="p-4 text-base text-gray-600">Loading...</p>}>
      <StudentHome />
    </Suspense>
  );
}

async function StudentHome() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT" || !user.student) redirect("/login");

  // The student id comes from the login session, never from the URL.
  const meetings = await prisma.meeting.findMany({
    where: { studentId: user.student.id },
    orderBy: { meetingDate: "desc" },
    include: { followUps: { orderBy: { dueDate: "asc" } } },
  });
  const open = meetings.flatMap((m) => m.followUps).filter((f) => !f.completedAt);

  return (
    <main className="mx-auto max-w-md px-4 pb-10">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-semibold text-gray-900">My mentoring</h1>
        <LogoutButton />
      </header>

      <h2 className="pt-5 text-sm font-medium text-gray-600">What we agreed</h2>
      {open.length === 0 ? (
        <p className="py-2 text-base text-gray-700">No open actions.</p>
      ) : (
        <ul className="py-2 text-base text-gray-900">
          {open.map((f) => (
            <li key={f.id}>{f.action} (by {formatDate(f.dueDate)})</li>
          ))}
        </ul>
      )}

      <h2 className="pt-5 text-sm font-medium text-gray-600">Past conversations</h2>
      <ul className="space-y-3 py-2">
        {meetings.map((m) => (
          <li key={m.id} className="text-base text-gray-900">
            <span className="text-sm text-gray-500">{formatDate(m.meetingDate)}: </span>
            {m.summary}
          </li>
        ))}
      </ul>
    </main>
  );
}