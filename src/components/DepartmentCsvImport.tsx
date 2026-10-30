"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const template = `role,name,mobile,rollNo,mentorMobile\nFACULTY,Dr. Meena Kumar,9000000010,,\nSTUDENT,Ananya Rao,9100000030,CS2026030,9000000010\n`;

export function DepartmentCsvImport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([template], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "department-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setMessage("");
    setErrors([]);
  }

  function clearFile() {
    setFile(null);
    setInputKey((key) => key + 1);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage("");
    setErrors([]);
  }

  async function upload() {
    if (!file) return;
    setSaving(true);
    setMessage("");
    setErrors([]);
    try {
      const response = await fetch("/api/department/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: await file.text() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors(data?.errors?.length ? data.errors : [data?.error ?? "Could not import the CSV"]);
        return;
      }
      setMessage(`Successfully added ${data.facultyCreated} faculty, ${data.studentsCreated} students and ${data.assignmentsCreated} assignments.`);
      setFile(null);
      setInputKey((key) => key + 1);
      router.refresh();
    } catch {
      setErrors(["Could not import the CSV"]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col justify-between h-full space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="space-y-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <Upload className="h-5 w-5 text-[#527A5B]" /> Bulk CSV import
          </h3>
          <p className="mt-1 text-xs text-slate-500 font-medium">Add faculty and students together. A student’s mentorMobile is optional.</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 font-medium">
          Columns: <span className="font-mono font-bold text-slate-800">role, name, mobile, rollNo, mentorMobile</span>. Roles are <span className="font-bold text-[#527A5B]">FACULTY</span> or <span className="font-bold text-[#527A5B]">STUDENT</span>.
        </div>

        {/* Completely hidden native input, styled custom drop area */}
        <input
          key={inputKey}
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={chooseFile}
          aria-label="Upload CSV file"
          className="hidden"
        />

        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 bg-slate-50/50 hover:bg-slate-50 hover:border-[#527A5B] transition-all cursor-pointer group"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#527A5B] shadow-xs border border-slate-200 group-hover:scale-105 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Click to browse CSV file</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Supports comma-separated roster data under 5MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3.5 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#527A5B] shrink-0 border border-slate-200">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB · Ready for import</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Remove selected file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 mt-auto">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={upload}
            disabled={!file || saving}
            className="h-11 flex-1 rounded-xl bg-[#527A5B] px-5 font-bold text-white hover:bg-[#42664A] shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" /> {saving ? "Importing CSV..." : "Import CSV"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            className="h-11 rounded-xl border-slate-200 bg-white px-4 font-bold text-[#527A5B] hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" /> Download template
          </Button>
        </div>

        {message ? <p role="status" className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">{message}</p> : null}
        {errors.length > 0 ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 space-y-1">
            <p className="font-bold">The file was not imported:</p>
            <ul className="list-disc space-y-0.5 pl-5">{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>
            {errors.length > 8 ? <p>And {errors.length - 8} more errors.</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
