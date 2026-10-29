"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { homeFor } from "@/lib/roles";
import SmoothButton from "@/components/ui/smoothui/smooth-button";
import { Phone, KeyRound, Sparkles, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not log in");
        return;
      }
      router.push(homeFor(data.role));
      router.refresh();
    } catch {
      setError("No connection. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#edf2f7]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f0f4f8] text-teal-700 shadow-[6px_6px_16px_rgba(163,177,198,0.6),-6px_-6px_16px_rgba(255,255,255,0.9)] border border-white/80">
          <GraduationCap className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">DevBuds Mentor</h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">Ten-Minute Faculty Mentoring & Early Warning System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="neumo-card p-6 sm:p-8 space-y-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-teal-700" />
                Mobile number
              </label>
              <Input
                required
                inputMode="numeric"
                placeholder="e.g. 9000000001"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="h-12 rounded-xl text-base neumo-inset border-slate-300 focus:bg-white focus:border-teal-700 text-slate-900 font-medium px-4"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4 text-teal-700" />
                OTP Verification Code
              </label>
              <Input
                required
                inputMode="numeric"
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-12 rounded-xl text-base neumo-inset border-slate-300 focus:bg-white focus:border-teal-700 text-slate-900 font-medium px-4"
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
              className="h-12 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-base font-bold text-white shadow-md active:scale-[0.98] transition-all mt-3"
            >
              {busy ? "Verifying..." : "Log in to portal"}
            </SmoothButton>
          </form>

          <div className="rounded-xl neumo-inset p-4 text-xs text-slate-700 space-y-2.5">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-700" /> Demo Accounts (OTP: 123456):
            </p>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="flex items-center justify-between bg-[#f0f4f8] px-3 py-2 rounded-lg border border-slate-300/70 shadow-2xs">
                <span className="font-semibold text-slate-700">Faculty Mentor:</span>
                <code className="font-mono font-bold text-teal-800">9000000001</code>
              </div>
              <div className="flex items-center justify-between bg-[#f0f4f8] px-3 py-2 rounded-lg border border-slate-300/70 shadow-2xs">
                <span className="font-semibold text-slate-700">Department Head (HOD):</span>
                <code className="font-mono font-bold text-teal-800">9000000002</code>
              </div>
              <div className="flex items-center justify-between bg-[#f0f4f8] px-3 py-2 rounded-lg border border-slate-300/70 shadow-2xs">
                <span className="font-semibold text-slate-700">Student Mentee:</span>
                <code className="font-mono font-bold text-teal-800">9100000001</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
