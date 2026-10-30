"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const template = `role,name,mobile,rollNo,mentorMobile\nFACULTY,Dr. Meena Kumar,9000000010,,\nSTUDENT,Ananya Rao,9100000030,CS2026030,9000000010\n`;

export function DepartmentCsvImport() {
  const router = useRouter();
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
      setMessage(`Added ${data.facultyCreated} faculty, ${data.studentsCreated} students and ${data.assignmentsCreated} assignments.`);
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
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-extrabold text-slate-900">
          <Upload className="h-4 w-4 text-teal-700" /> Bulk CSV import
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500">Add faculty and students together. A student’s mentorMobile is optional.</p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600">
        Columns: <span className="font-mono font-bold text-slate-800">role, name, mobile, rollNo, mentorMobile</span>. Roles are <span className="font-bold">FACULTY</span> or <span className="font-bold">STUDENT</span>.
      </div>
      <input key={inputKey} type="file" accept=".csv,text/csv" onChange={chooseFile} className="block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm font-medium text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-bold file:text-teal-800" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" onClick={upload} disabled={!file || saving} className="h-10 rounded-xl px-4 font-bold">
          <Upload className="h-4 w-4" /> {saving ? "Importing..." : "Import CSV"}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={downloadTemplate} className="h-10 rounded-xl px-4 font-bold">
          <Download className="h-4 w-4" /> Download template
        </Button>
      </div>
      {message ? <p role="status" className="text-sm font-semibold text-emerald-700">{message}</p> : null}
      {errors.length > 0 ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <p>The file was not imported:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>
          {errors.length > 8 ? <p className="mt-1">And {errors.length - 8} more errors.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
