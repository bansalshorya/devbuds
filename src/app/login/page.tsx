"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { homeFor } from "@/lib/roles";
import SmoothButton from "@/components/ui/smoothui/smooth-button";
import { ShieldCheck, Phone, KeyRound, Sparkles, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/20 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20 ring-4 ring-teal-50">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">DevBuds Mentor</h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">Ten-Minute Faculty Mentoring & Early Warning System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-2xl p-2 sm:p-4">
          <CardContent className="space-y-6 pt-4">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-teal-700" />
                  Mobile number
                </label>
                <Input
                  required
                  inputMode="numeric"
                  placeholder="e.g. 9000000001"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-12 rounded-xl text-base bg-slate-50/70 border-slate-200 focus:bg-white focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                  <KeyRound className="h-4 w-4 text-teal-700" />
                  OTP Verification Code
                </label>
                <Input
                  required
                  inputMode="numeric"
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-12 rounded-xl text-base bg-slate-50/70 border-slate-200 focus:bg-white focus:border-teal-700"
                />
              </div>

              {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm font-medium text-red-700 animate-fadeIn">
                  {error}
                </div>
              )}

              <SmoothButton
                type="submit"
                disabled={busy}
                loading={busy}
                className="h-12 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-base font-semibold text-white shadow-md shadow-teal-700/20 transition-all mt-3"
              >
                {busy ? "Verifying..." : "Log in to portal"}
              </SmoothButton>
            </form>

            <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 p-4 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-700" /> Demo Accounts (OTP: 123456):
              </p>
              <div className="grid grid-cols-1 gap-1.5 pt-1 text-slate-700">
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="font-medium text-slate-600">Faculty Mentor:</span>
                  <code className="font-mono font-semibold text-teal-800">9000000001</code>
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="font-medium text-slate-600">Department Head (HOD):</span>
                  <code className="font-mono font-semibold text-teal-800">9000000002</code>
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="font-medium text-slate-600">Student Mentee:</span>
                  <code className="font-mono font-semibold text-teal-800">9100000001</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
