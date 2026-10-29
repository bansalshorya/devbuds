"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { homeFor } from "@/lib/roles";
import SmoothButton from "@/components/ui/smoothui/smooth-button";
import { ShieldCheck, Phone, KeyRound, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">DevBuds Mentor</h1>
        <p className="mt-2 text-sm text-slate-600">Ten-Minute Faculty Mentoring & Early Warning System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white shadow-sm border border-slate-200/90 py-6">
          <CardContent className="space-y-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">
                  <Phone className="h-4 w-4 text-teal-600" />
                  Mobile number
                </label>
                <Input
                  required
                  inputMode="numeric"
                  placeholder="e.g. 9000000001"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">
                  <KeyRound className="h-4 w-4 text-teal-600" />
                  OTP Verification Code
                </label>
                <Input
                  required
                  inputMode="numeric"
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <SmoothButton
                type="submit"
                disabled={busy}
                loading={busy}
                className="h-11 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-base font-semibold text-white shadow-xs transition-all mt-2"
              >
                {busy ? "Verifying..." : "Log in to portal"}
              </SmoothButton>
            </form>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Demo Accounts (OTP: 123456):
              </p>
              <p>• Mentor: <code className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">9000000001</code></p>
              <p>• Department Head (HOD): <code className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">9000000002</code></p>
              <p>• Student: <code className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">9100000001</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

