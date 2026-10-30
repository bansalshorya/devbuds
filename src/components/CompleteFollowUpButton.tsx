"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompleteFollowUpButton({ id, action }: { id: string; action: string }) {
  const router = useRouter();
  const errorId = useId();
  const inFlight = useRef(false);
  const [status, setStatus] = useState<"idle" | "saving" | "completed">("idle");
  const [error, setError] = useState("");

  async function complete() {
    if (inFlight.current || status === "completed") return;
    inFlight.current = true;
    setStatus("saving");
    setError("");
    try {
      const response = await fetch(`/api/follow-ups/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "same-origin",
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Could not complete this action. Please try again.");
      }
      if (typeof data?.completedAt !== "string") {
        throw new Error("Could not confirm completion. Please try again.");
      }
      setStatus("completed");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error && error.name !== "TypeError" && error.name !== "TimeoutError"
        ? error.message : "Connection interrupted. Your action is still listed; reconnect and try again.";
      setError(message);
      setStatus("idle");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={complete}
        disabled={status !== "idle"}
        aria-label={`${status === "completed" ? "Completed" : "Mark complete"}: ${action}`}
        aria-busy={status === "saving"}
        aria-describedby={error ? errorId : undefined}
        className="h-12 gap-2 rounded-xl border-[#DCE4DD] bg-[#FFFFFF] px-4 text-sm font-bold text-[#527A5B] shadow-2xs hover:bg-[#F0F5F1] hover:text-[#42664A] focus-visible:ring-[#527A5B]/30"
      >
        {status === "saving" ? <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" /> : <CheckCircle2 aria-hidden className="h-4 w-4" />}
        {status === "saving" ? "Saving…" : status === "completed" ? "Completed" : "Mark complete"}
      </Button>
      {status === "completed" && <p role="status" className="sr-only">Action completed. Updating your follow-up list.</p>}
      {error && <p id={errorId} role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
