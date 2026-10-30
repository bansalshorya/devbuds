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
        router.push("/");
        router.refresh();
      }}
      className="h-10 px-3 text-sm font-semibold text-[#5F6962] hover:text-[#242924] hover:bg-[#F0F5F1] whitespace-nowrap shrink-0 rounded-xl transition-colors"
    >
      Log out
    </Button>
  );
}
