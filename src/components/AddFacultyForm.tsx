"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddFacultyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/department/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Could not add faculty");
      setName("");
      setMobile("");
      setMessage(`${data.faculty.name} was added as faculty`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add faculty");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-extrabold text-slate-900">
          <UserPlus className="h-4 w-4 text-teal-700" /> Add one faculty member
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500">They can sign in with their mobile number and the demo OTP.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          Faculty name
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Dr. Meena Kumar" maxLength={100} required className="h-11 text-sm font-semibold normal-case tracking-normal" />
        </label>
        <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          Mobile number
          <Input value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9000000010" inputMode="numeric" pattern="[0-9]{10}" required className="h-11 text-sm font-semibold normal-case tracking-normal" />
        </label>
      </div>
      <Button type="submit" size="lg" disabled={saving} className="h-10 rounded-xl px-4 font-bold">
        <UserPlus className="h-4 w-4" /> {saving ? "Adding..." : "Add faculty"}
      </Button>
      {message ? <p role="status" className="text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}
    </form>
  );
}
