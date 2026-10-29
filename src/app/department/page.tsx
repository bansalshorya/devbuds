import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getCoverage } from "@/server/db/coverage";
import { LogoutButton } from "@/components/LogoutButton";

export default function DepartmentPage() {
  return (
    <Suspense fallback={<p className="p-4 text-base text-gray-600">Loading...</p>}>
      <Coverage />
    </Suspense>
  );
}

async function Coverage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "HOD") redirect("/login");
  const c = await getCoverage(user.departmentId);

  const items = [
    { label: "Students reached", value: `${c.studentsReached} of ${c.totalStudents}` },
    { label: "Meetings logged", value: String(c.meetingsLogged) },
    { label: "Follow-ups pending", value: String(c.pendingFollowUps) },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 pb-10">
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mentoring coverage</h1>
          <p className="text-sm text-gray-600">Last {c.periodDays} days. Counts only, no student details.</p>
        </div>
        <LogoutButton />
      </header>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.label} className="rounded border border-gray-200 p-4">
            <dt className="text-sm text-gray-600">{i.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">{i.value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}