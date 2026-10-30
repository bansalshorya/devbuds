"use client";

import { useState, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

type ImportType = "attendance" | "marks" | "lms";

interface RowError {
  row: number;
  message: string;
}

interface ImportResult {
  inserted: number;
  updated: number;
  errors: RowError[];
  error?: string;
}

const TYPE_OPTIONS: { value: ImportType; label: string; desc: string }[] = [
  { value: "attendance", label: "Attendance", desc: "rollNo, subject, weekStart, attended, total" },
  { value: "marks", label: "Internal Marks", desc: "rollNo, subject, assessment, assessedOn, score, maxScore" },
  { value: "lms", label: "LMS Activity", desc: "rollNo, activityOn, events" },
];

export default function ImportPage() {
  const [type, setType] = useState<ImportType>("attendance");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
  }

  function clearFile() {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);

      const res = await fetch("/api/import", { method: "POST", body: fd });
      const json: ImportResult = await res.json();

      if (!res.ok) {
        setResult({ inserted: 0, updated: 0, errors: [], error: json.error ?? "Upload failed" });
      } else {
        setResult(json);
      }
    } catch {
      setResult({ inserted: 0, updated: 0, errors: [], error: "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  }

  const selected = TYPE_OPTIONS.find((t) => t.value === type)!;
  const hasSuccess = result && !result.error && (result.inserted > 0 || result.updated > 0);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 py-3.5 sm:px-6 shadow-xs">
        <Link
          href="/mentor"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Import Data</h1>
          <p className="text-xs text-slate-500 font-medium">Upload CSV files to bulk-import records</p>
        </div>
      </header>

      <main className="mx-auto max-w-md sm:max-w-xl px-4 pt-5 space-y-5">
        {/* Type Selector */}
        <section>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Data Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setType(opt.value); setResult(null); }}
                className={`rounded-2xl border p-3 text-center transition-all shadow-xs ${
                  type === opt.value
                    ? "border-teal-400 bg-teal-50/80 text-teal-900 ring-2 ring-teal-200/60"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Expected columns: <span className="font-mono text-slate-600">{selected.desc}</span>
          </p>
        </section>

        {/* File Upload Area */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            CSV File
          </label>

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-10 text-slate-500 hover:border-teal-400 hover:bg-teal-50/30 hover:text-teal-700 transition-all cursor-pointer"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm font-semibold">Tap to choose a CSV file</span>
              <span className="text-xs text-slate-400">Max 5 MB</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/40 px-4 py-3">
              <FileSpreadsheet className="h-6 w-6 text-teal-700 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
          />

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-4 w-full bg-teal-700 text-white hover:bg-teal-800 disabled:bg-slate-300 h-11 text-base font-semibold rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload &amp; Import
              </>
            )}
          </Button>
        </section>

        {/* Results Display */}
        {result && (
          <section className="space-y-3">
            {/* Top-level API error */}
            {result.error && (
              <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 flex items-start gap-3 shadow-xs">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-900">{result.error}</p>
              </div>
            )}

            {/* Success counts */}
            {hasSuccess && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3 shadow-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Import completed</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {result.inserted} inserted · {result.updated} updated
                  </p>
                </div>
              </div>
            )}

            {/* Row-level errors */}
            {result.errors.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                  <p className="text-sm font-bold text-amber-900">
                    {result.errors.length} row{result.errors.length > 1 ? "s" : ""} skipped
                  </p>
                </div>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-amber-800 font-medium">
                      <span className="font-bold">Row {e.row}:</span> {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
