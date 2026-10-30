"use client";
import { useState } from "react";
import { Download, ChevronDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegisterDownload({ studentId }: { studentId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#527A5B] shrink-0 border border-slate-200">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Mentoring register</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Confirmed meetings and agreed actions exportable for college records.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#527A5B] hidden sm:inline">{isOpen ? "Hide options" : "Export register"}</span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 space-y-4 border-t border-slate-100 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              From date
              <input
                aria-label="Register from date"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#527A5B]"
              />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              To date
              <input
                aria-label="Register to date"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#527A5B]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {(["docx", "xlsx"] as const).map((format) => (
              <Button
                key={format}
                type="button"
                disabled={busy}
                onClick={() => download(format)}
                variant="outline"
                className="h-11 flex-1 min-w-[140px] gap-2 rounded-xl border-slate-200 bg-white px-4 font-bold text-[#527A5B] hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Download aria-hidden className="h-4 w-4" />
                {format === "docx" ? "Word register" : "Excel register"}
              </Button>
            ))}
          </div>

          {busy && <p role="status" className="text-xs font-semibold text-slate-600">Preparing and generating register…</p>}
          {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
        </div>
      )}
    </div>
  );
}
