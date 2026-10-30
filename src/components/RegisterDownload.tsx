"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegisterDownload({ studentId }: { studentId?: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download(format: "docx" | "xlsx") {
    setError("");
    if (from && to && from > to) { setError("The start date must be before the end date."); return; }
    setBusy(true);
    try {
      const query = new URLSearchParams({ format });
      if (studentId) query.set("studentId", studentId);
      if (from) query.set("from", from);
      if (to) query.set("to", to);
      const response = await fetch(`/api/mentor/register?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json()).error || "Could not generate the register");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `mentoring-register.${format}`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError(error instanceof Error ? error.message : "No connection. Please retry."); }
    finally { setBusy(false); }
  }
  return <details className="neumo-card bg-[#FFFFFF] p-5">
    <summary className="min-h-12 cursor-pointer text-base font-bold text-[#242924]">Mentoring register</summary>
    <p className="mb-3 text-sm text-[#5F6962]">Confirmed meetings and agreed actions. General format; the supplied college template is still needed for the final layout.</p>
    <div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-sm font-semibold">From<input aria-label="Register from date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 min-h-12 w-full min-w-0 rounded-xl border border-[#DCE4DD] bg-white p-2 text-base" /></label><label className="min-w-0 text-sm font-semibold">To<input aria-label="Register to date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 min-h-12 w-full min-w-0 rounded-xl border border-[#DCE4DD] bg-white p-2 text-base" /></label></div>
    <div className="mt-3 flex flex-wrap gap-3">{(["docx", "xlsx"] as const).map((format) => <Button key={format} type="button" disabled={busy} onClick={() => download(format)} variant="outline" className="h-12 gap-2 rounded-xl border-[#DCE4DD] bg-white px-4 font-bold text-[#527A5B] hover:bg-[#F0F5F1]"><Download aria-hidden className="h-4 w-4" />{format === "docx" ? "Word register" : "Excel register"}</Button>)}</div>
    {busy && <p role="status" className="mt-2 text-sm">Preparing register…</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
  </details>;
}
