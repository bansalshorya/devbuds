import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { homeFor } from "@/lib/roles";
import { PublicLandingPage } from "@/components/PublicLandingPage";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  );
}

async function Redirector() {
  const user = await getCurrentUser();
  if (user) {
    return redirect(homeFor(user.role));
  }
  return <PublicLandingPage />;
}
