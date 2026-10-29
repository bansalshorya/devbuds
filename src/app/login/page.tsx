"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { homeFor } from "@/lib/roles";

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
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-1 mt-8 text-2xl font-semibold text-gray-900">Ten-Minute Mentor</h1>
      <p className="mb-6 text-base text-gray-600">Log in with your mobile number.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-base text-gray-900">
          Mobile number
          <input
            inputMode="numeric"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="mt-1 block h-12 w-full rounded border border-gray-300 px-3 text-base"
          />
        </label>
        <label className="block text-base text-gray-900">
          OTP
          <input
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mt-1 block h-12 w-full rounded border border-gray-300 px-3 text-base"
          />
        </label>
        {error && <p role="alert" className="text-base text-red-700">{error}</p>}
        <button
          disabled={busy}
          className="h-12 w-full rounded bg-teal-700 text-base font-medium text-white disabled:opacity-60"
        >
          {busy ? "Checking..." : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-gray-500">
        Demo accounts: mentor 9000000001, student 9100000001, head of department 9000000002. OTP 123456.
      </p>
    </main>
  );
}