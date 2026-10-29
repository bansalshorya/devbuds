"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="h-10 px-3 text-sm font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 rounded-xl"
    >
      Log out
    </Button>
  );
}
