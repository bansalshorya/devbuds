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
    <form onSubmit={submit} className="flex flex-col justify-between h-full space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="space-y-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <UserPlus className="h-5 w-5 text-[#527A5B]" /> Add one faculty member
          </h3>
          <p className="mt-1 text-xs text-slate-500 font-medium">They can sign in with their mobile number and the demo OTP.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Faculty name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Dr. Meena Kumar" maxLength={100} required className="h-11 rounded-xl text-sm font-semibold border-slate-200 bg-white" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Mobile number</label>
            <Input value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9000000010" inputMode="numeric" pattern="[0-9]{10}" required className="h-11 rounded-xl text-sm font-semibold border-slate-200 bg-white" />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 mt-auto">
        <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-[#527A5B] px-5 font-bold text-white hover:bg-[#42664A] shadow-xs cursor-pointer">
          <UserPlus className="h-4 w-4 mr-2" /> {saving ? "Adding faculty..." : "Add faculty"}
        </Button>
        {message ? <p role="status" className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{message}</p> : null}
        {error ? <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p> : null}
      </div>
    </form>
  );
}
