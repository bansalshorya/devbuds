"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { homeFor } from "@/lib/roles";
import SmoothButton from "@/components/ui/smoothui/smooth-button";
import { Phone, KeyRound, Sparkles, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const inFlight = useRef(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) { inFlight.current = false; setBusy(false); setOpening(false); }
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    let navigating = false;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : res.status >= 500 ? "The sign-in service is unavailable. Please try again shortly." : "Could not log in. Please check your details.");
        return;
      }
      if (!["MENTOR", "STUDENT", "HOD"].includes(data.role)) throw new Error("Invalid login response");
      // A fresh authenticated navigation avoids a push/refresh race and duplicate dashboard requests.
      window.location.assign(homeFor(data.role));
      navigating = true;
      setOpening(true);
      return;
    } catch (error) {
      setError(error instanceof Error && error.name === "TimeoutError" ? "Sign-in took too long. Please try again shortly." : "Could not connect to sign-in. Please try again.");
    } finally {
      if (!navigating) { inFlight.current = false; setBusy(false); }
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F6F8F6] text-[#242924]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FFFFFF] text-[#527A5B] shadow-md border border-[#DCE4DD]">
          <GraduationCap className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#242924]">DevBuds Mentor</h1>
        <p className="mt-2 text-sm text-[#5F6962] font-medium">Ten-Minute Faculty Mentoring & Early Warning System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFFFF] border border-[#DCE4DD] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#242924] flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-[#527A5B]" />
                Mobile number
              </label>
              <Input
                required
                disabled={busy}
                inputMode="numeric"
                placeholder="e.g. 9000000001"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="h-12 rounded-xl text-base bg-[#FFFFFF] border-[#DCE4DD] focus-visible:ring-2 focus-visible:ring-[#527A5B] text-[#242924] font-medium px-4 placeholder:text-[#737D76]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#242924] flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4 text-[#527A5B]" />
                OTP Verification Code
              </label>
              <Input
                required
                disabled={busy}
                inputMode="numeric"
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-12 rounded-xl text-base bg-[#FFFFFF] border-[#DCE4DD] focus-visible:ring-2 focus-visible:ring-[#527A5B] text-[#242924] font-medium px-4 placeholder:text-[#737D76]"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm font-semibold text-red-700 shadow-xs">
                {error}
              </div>
            )}

            <SmoothButton
              type="submit"
              disabled={busy}
              loading={busy}
              className="h-12 w-full rounded-xl bg-[#527A5B] hover:bg-[#42664A] text-base font-extrabold text-[#FFFFFF] shadow-md active:scale-[0.98] transition-all mt-3 cursor-pointer"
            >
              {opening ? "Opening your portal…" : busy ? "Verifying..." : "Log in to portal"}
            </SmoothButton>
          </form>

          <div className="rounded-xl bg-[#EEF2EF] border border-[#DCE4DD] p-4 text-xs text-[#5F6962] space-y-2.5">
            <p className="font-bold text-[#242924] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#527A5B]" /> Demo Accounts (OTP: 123456):
            </p>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="flex items-center justify-between bg-[#FFFFFF] px-3 py-2 rounded-lg border border-[#DCE4DD]">
                <span className="font-semibold text-[#5F6962]">Faculty Mentor:</span>
                <code className="font-mono font-bold text-[#527A5B]">9000000001</code>
              </div>
              <div className="flex items-center justify-between bg-[#FFFFFF] px-3 py-2 rounded-lg border border-[#DCE4DD]">
                <span className="font-semibold text-[#5F6962]">Department Head (HOD):</span>
                <code className="font-mono font-bold text-[#527A5B]">9000000002</code>
              </div>
              <div className="flex items-center justify-between bg-[#FFFFFF] px-3 py-2 rounded-lg border border-[#DCE4DD]">
                <span className="font-semibold text-[#5F6962]">Student Mentee:</span>
                <code className="font-mono font-bold text-[#527A5B]">9100000001</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
