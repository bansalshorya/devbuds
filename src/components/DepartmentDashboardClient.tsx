"use client";

import { useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  Building2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Settings,
  AlertCircle,
  Check,
  Loader2,
  Download,
  UserPlus,
  FileSpreadsheet,
  Search,
  Filter,
  UserCheck,
  X,
  Upload,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/LogoutButton";

export type FacultyStudent = {
  id: string;
  name: string;
  rollNo: string;
  reached: boolean;
};

export type FacultyMember = {
  id: string;
  name: string;
  mobile: string;
  assignedCount: number;
  reachedCount: number;
  pendingFollowUpsCount: number;
  students: FacultyStudent[];
};

export type DepartmentStudent = {
  id: string;
  name: string;
  rollNo: string;
  mentorId: string | null;
  mentorName: string | null;
  reached: boolean;
  pendingFollowUpsCount: number;
};

export type CoverageData = {
  periodDays: number;
  totalStudents: number;
  totalFaculty?: number;
  studentsReached: number;
  meetingsLogged: number;
  pendingFollowUps: number;
};

export type UserSession = {
  id: string;
  name: string;
  role: string;
  departmentId: string;
};

export function DepartmentDashboardClient({
  user,
  coverage: c,
  faculty,
  students,
}: {
  user: UserSession;
  coverage: CoverageData;
  faculty: FacultyMember[];
  students: DepartmentStudent[];
}) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"overview" | "faculty" | "students" | "import">("overview");

  // Overview metrics state
  const [expandedCard, setExpandedCard] = useState<"students" | "faculty" | "meetings" | "followups" | null>("students");
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);
  const [thresholds, setThresholds] = useState({
    lowAttendancePct: "75",
    criticalAttendancePct: "65",
    dropWindowWeeks: "3",
    dropPoints: "15",
    severeDropPoints: "25",
    marksDropPoints: "10",
    severeMarksDropPoints: "20",
    lmsInactiveDays: "14",
    lmsLongInactiveDays: "28",
    notMetWeeks: "5",
    longNotMetWeeks: "8",
  });
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [thresholdSuccess, setThresholdSuccess] = useState(false);
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);

  // Faculty management state
  const [facultySearch, setFacultySearch] = useState("");
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: "", mobile: "", email: "" });
  const [addFacultyError, setAddFacultyError] = useState<string | null>(null);
  const [addFacultySuccess, setAddFacultySuccess] = useState(false);
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);

  // Faculty assignment modal state
  const [selectedFacultyForAssignment, setSelectedFacultyForAssignment] = useState<FacultyMember | null>(null);

  // Student directory & filtering state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "reached" | "unreached" | "unassigned">("all");
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // CSV Import state
  const [importType, setImportType] = useState<"students" | "faculty">("students");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isParsingCsv, setIsParsingCsv] = useState(false);

  const coveragePercent = c.totalStudents > 0
    ? Math.round((c.studentsReached / c.totalStudents) * 100)
    : 0;

  const unreached = c.totalStudents - c.studentsReached;
  const unassignedCount = students.filter((s) => !s.mentorId).length;

  // Threshold save handler
  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    setThresholdError(null);
    setThresholdSuccess(false);

    const lowAtt = Number(thresholds.lowAttendancePct);
    const critAtt = Number(thresholds.criticalAttendancePct);
    const dropWin = Number(thresholds.dropWindowWeeks);
    const dropPts = Number(thresholds.dropPoints);
    const severeDropPts = Number(thresholds.severeDropPoints);
    const marksDrop = Number(thresholds.marksDropPoints);
    const severeMarksDrop = Number(thresholds.severeMarksDropPoints);
    const lmsInc = Number(thresholds.lmsInactiveDays);
    const lmsLongInc = Number(thresholds.lmsLongInactiveDays);
    const notMet = Number(thresholds.notMetWeeks);
    const longNotMet = Number(thresholds.longNotMetWeeks);

    const fields = [
      { name: "Low Attendance %", val: thresholds.lowAttendancePct, num: lowAtt, min: 0, max: 100, int: false },
      { name: "Critical Attendance %", val: thresholds.criticalAttendancePct, num: critAtt, min: 0, max: 100, int: false },
      { name: "Attendance Drop Window Weeks", val: thresholds.dropWindowWeeks, num: dropWin, min: 1, max: 10, int: true },
      { name: "Attendance Drop Points %", val: thresholds.dropPoints, num: dropPts, min: 1, max: 50, int: false },
      { name: "Severe Drop Points %", val: thresholds.severeDropPoints, num: severeDropPts, min: 1, max: 50, int: false },
      { name: "Marks Decline Threshold", val: thresholds.marksDropPoints, num: marksDrop, min: 1, max: 50, int: false },
      { name: "Severe Marks Decline Threshold", val: thresholds.severeMarksDropPoints, num: severeMarksDrop, min: 1, max: 50, int: false },
      { name: "LMS Inactivity Days", val: thresholds.lmsInactiveDays, num: lmsInc, min: 1, max: 90, int: true },
      { name: "LMS Long Inactivity Days", val: thresholds.lmsLongInactiveDays, num: lmsLongInc, min: 1, max: 180, int: true },
      { name: "Not Met Weeks", val: thresholds.notMetWeeks, num: notMet, min: 1, max: 20, int: true },
      { name: "Long Not Met Weeks", val: thresholds.longNotMetWeeks, num: longNotMet, min: 1, max: 30, int: true },
    ];

    for (const f of fields) {
      if (f.val.trim() === "" || !Number.isFinite(f.num)) {
        setThresholdError(`Field "${f.name}" cannot be empty and must be a valid number.`);
        return;
      }
      if (f.int && !Number.isInteger(f.num)) {
        setThresholdError(`Field "${f.name}" must be a whole integer.`);
        return;
      }
      if (f.num < f.min || f.num > f.max) {
        setThresholdError(`Field "${f.name}" must be between ${f.min} and ${f.max}.`);
        return;
      }
    }

    if (critAtt >= lowAtt) {
      setThresholdError("Critical attendance percentage must be strictly less than low attendance percentage.");
      return;
    }

    setIsSavingThresholds(true);
    setTimeout(() => {
      setIsSavingThresholds(false);
      setThresholdSuccess(true);
    }, 600);
  };

  // Add Faculty handler (UI preview / validation)
  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFacultyError(null);
    setAddFacultySuccess(false);

    if (!newFaculty.name.trim() || !newFaculty.mobile.trim()) {
      setAddFacultyError("Faculty name and mobile number are required.");
      return;
    }
    if (newFaculty.mobile.trim().length < 10) {
      setAddFacultyError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsAddingFaculty(true);
    setTimeout(() => {
      setIsAddingFaculty(false);
      setAddFacultySuccess(true);
      setNewFaculty({ name: "", mobile: "", email: "" });
    }, 700);
  };

  // CSV Export handlers
  const handleExportSummaryCsv = () => {
    const csvContent = [
      "Metric,Value,Description",
      `"Reporting Period (Days)",${c.periodDays},"Days in reporting window"`,
      `"Total Students",${c.totalStudents},"Total students enrolled in department"`,
      `"Total Faculty",${c.totalFaculty ?? faculty.length},"Total faculty mentors in department"`,
      `"Students Reached",${c.studentsReached},"Unique students with meeting logged"`,
      `"Unreached Students",${c.totalStudents - c.studentsReached},"Students without meeting logged"`,
      `"Coverage Rate (%)",${coveragePercent}%,"Percentage of department students reached"`,
      `"Meetings Logged",${c.meetingsLogged},"Total mentoring sessions recorded"`,
      `"Pending Follow-Ups",${c.pendingFollowUps},"Open follow-up action items"`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `department-coverage-summary-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleExportFacultyCsv = () => {
    const header = "Faculty Name,Mobile,Assigned Students,Students Reached,Pending Follow-Ups";
    const rows = faculty.map((f) =>
      `"${f.name.replace(/"/g, '""')}","${f.mobile}",${f.assignedCount},${f.reachedCount},${f.pendingFollowUpsCount}`
    );
    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `department-faculty-summary-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // CSV File Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError(null);
    setIsParsingCsv(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvError("CSV file must contain a header row and at least one data row.");
          setIsParsingCsv(false);
          return;
        }
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
        setCsvHeaders(headers);

        const parsedRows = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || "";
          });
          return rowObj;
        });

        setCsvPreviewRows(parsedRows);
        setIsParsingCsv(false);
      } catch {
        setCsvError("Failed to parse CSV file. Please check format.");
        setIsParsingCsv(false);
      }
    };
    reader.onerror = () => {
      setCsvError("Error reading uploaded file.");
      setIsParsingCsv(false);
    };
    reader.readAsText(file);
  };

  // Filtered lists
  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.mobile.includes(facultySearch)
  );

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (studentFilter === "reached" && !s.reached) return false;
    if (studentFilter === "unreached" && s.reached) return false;
    if (studentFilter === "unassigned" && s.mentorId) return false;

    if (selectedFacultyFilter !== "all" && s.mentorId !== selectedFacultyFilter) return false;

    return true;
  });

  return (
    <div className="min-h-screen pb-20 bg-[#edf2f7] transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-25 bg-[#edf2f7]/90 backdrop-blur-md border-b border-slate-300/60 shadow-[0_4px_12px_rgba(163,177,198,0.25)] transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold shadow-md shadow-teal-700/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Department Overview</h1>
                <Badge variant="secondary" className="bg-teal-100 text-teal-900 border-teal-300 font-bold text-xs">
                  HOD Portal
                </Badge>
              </div>
              <p className="text-xs text-slate-600 font-semibold">{user.name} · Confidential Aggregate Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportSummaryCsv}
              className="px-3.5 py-2 rounded-xl bg-[#f0f4f8] text-teal-900 font-bold text-xs neumo-card hover:shadow-[4px_4px_10px_rgba(163,177,198,0.5)] transition-all flex items-center gap-1.5 active:scale-95"
              aria-label="Export department summary CSV"
            >
              <Download className="h-4 w-4 text-teal-700" />
              <span>Export Summary</span>
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Navigation Sub-Header Tabs */}
      <div className="bg-[#e6edf4] border-b border-slate-300/60 shadow-[inset_0_2px_4px_rgba(163,177,198,0.15)]">
        <div className="mx-auto flex max-w-6xl px-4 sm:px-8 gap-2 overflow-x-auto py-2.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "overview"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/20 scale-[1.02]"
                : "text-slate-700 hover:text-slate-900 bg-[#f0f4f8] neumo-card"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Overview & Thresholds
          </button>
          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "faculty"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/20 scale-[1.02]"
                : "text-slate-700 hover:text-slate-900 bg-[#f0f4f8] neumo-card"
            }`}
          >
            <Users className="h-4 w-4" />
            Faculty Management ({faculty.length})
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "students"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/20 scale-[1.02]"
                : "text-slate-700 hover:text-slate-900 bg-[#f0f4f8] neumo-card"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Student Roster ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "import"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/20 scale-[1.02]"
                : "text-slate-700 hover:text-slate-900 bg-[#f0f4f8] neumo-card"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV Import Tool
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-8 space-y-6">
        {/* TAB 1: OVERVIEW & THRESHOLDS */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Banner with period and privacy note */}
            <div className="neumo-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-teal-300 bg-gradient-to-br from-[#f0f4f8] via-teal-50/30 to-[#f0f4f8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-700" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Faculty Mentoring Coverage</h2>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Reporting over the last <span className="font-bold text-slate-900">{c.periodDays} days</span>. Counts and departmental analytics only; individual student notes remain strictly confidential.
                </p>
              </div>
              <Badge variant="secondary" className="self-start sm:self-auto gap-1.5 bg-teal-100 border-teal-300 px-4 py-2.5 text-teal-900 font-bold text-sm shadow-xs shrink-0">
                <BarChart3 className="h-4 w-4 text-teal-700" />
                {coveragePercent}% Student Coverage Rate
              </Badge>
            </div>

            {/* Coverage Progress Bar Card */}
            <div className="neumo-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-700" /> Overall Mentee Reach
                </span>
                <span className="font-extrabold text-teal-900">{c.studentsReached} of {c.totalStudents} students reached</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full neumo-inset p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-600 transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                <span>{unreached} students have not had a meeting logged in this period.</span>
                <span className="text-teal-800 font-extrabold">{coveragePercent}% Target Benchmark</span>
              </div>
            </div>

            {/* 4 Interactive Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Students Reached */}
              <div
                onClick={() => setExpandedCard(expandedCard === "students" ? null : "students")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedCard(expandedCard === "students" ? null : "students"); }}
                className={`neumo-card p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[8px_8px_18px_rgba(163,177,198,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                  expandedCard === "students" ? "neumo-card-pressed" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Students Reached</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shadow-inner shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">{c.studentsReached}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>out of {c.totalStudents} students</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expandedCard === "students" ? "rotate-180 text-teal-800" : ""}`} />
                </div>
                {expandedCard === "students" && (
                  <div className="mt-4 pt-3 border-t border-slate-300 space-y-2 text-xs text-slate-800 animate-fadeIn font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between font-bold">
                      <span>Reach Rate:</span>
                      <span className="text-teal-900">{coveragePercent}%</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Unreached:</span>
                      <span className="font-bold">{unreached} students</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Faculty Mentors */}
              <div
                onClick={() => setExpandedCard(expandedCard === "faculty" ? null : "faculty")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedCard(expandedCard === "faculty" ? null : "faculty"); }}
                className={`neumo-card p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[8px_8px_18px_rgba(163,177,198,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  expandedCard === "faculty" ? "neumo-card-pressed" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Faculty Mentors</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 shadow-inner shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">{c.totalFaculty ?? faculty.length}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>active department faculty</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expandedCard === "faculty" ? "rotate-180 text-indigo-800" : ""}`} />
                </div>
                {expandedCard === "faculty" && (
                  <div className="mt-4 pt-3 border-t border-slate-300 space-y-2 text-xs text-slate-800 animate-fadeIn font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between font-bold">
                      <span>Avg Mentees per Mentor:</span>
                      <span className="text-indigo-900">
                        {faculty.length > 0 ? (c.totalStudents / faculty.length).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Unassigned Students:</span>
                      <span className="font-bold text-amber-700">{unassignedCount}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Meetings Logged */}
              <div
                onClick={() => setExpandedCard(expandedCard === "meetings" ? null : "meetings")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedCard(expandedCard === "meetings" ? null : "meetings"); }}
                className={`neumo-card p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[8px_8px_18px_rgba(163,177,198,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  expandedCard === "meetings" ? "neumo-card-pressed" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Meetings Logged</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-inner shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">{c.meetingsLogged}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>recorded in {c.periodDays} days</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expandedCard === "meetings" ? "rotate-180 text-emerald-800" : ""}`} />
                </div>
                {expandedCard === "meetings" && (
                  <div className="mt-4 pt-3 border-t border-slate-300 space-y-2 text-xs text-slate-800 animate-fadeIn font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between font-bold">
                      <span>Avg per Reached Student:</span>
                      <span className="text-emerald-900">
                        {c.studentsReached > 0 ? (c.meetingsLogged / c.studentsReached).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Follow-Ups Pending */}
              <div
                onClick={() => setExpandedCard(expandedCard === "followups" ? null : "followups")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedCard(expandedCard === "followups" ? null : "followups"); }}
                className={`neumo-card p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[8px_8px_18px_rgba(163,177,198,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
                  expandedCard === "followups" ? "neumo-card-pressed" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Follow-Ups Pending</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-inner shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">{c.pendingFollowUps}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>action items awaiting completion</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expandedCard === "followups" ? "rotate-180 text-amber-800" : ""}`} />
                </div>
                {expandedCard === "followups" && (
                  <div className="mt-4 pt-3 border-t border-slate-300 space-y-2 text-xs text-slate-800 animate-fadeIn font-medium" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between font-bold">
                      <span>Tracking Status:</span>
                      <span className="text-amber-900">Active Monitoring</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* HOD Alert Threshold Settings Card */}
            <div className="neumo-card p-6 sm:p-7 space-y-4 border-teal-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shadow-inner shrink-0">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Department Alert Thresholds</h3>
                    <p className="text-xs text-slate-600 font-medium">Configure early warning detection thresholds for your department</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowThresholdSettings(!showThresholdSettings)}
                  className="px-4 py-2 rounded-xl bg-[#f0f4f8] text-teal-900 font-bold text-xs neumo-card hover:shadow-[4px_4px_10px_rgba(163,177,198,0.5)] transition-all flex items-center gap-1.5 active:scale-95"
                >
                  {showThresholdSettings ? "Hide Settings" : "Configure Thresholds"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showThresholdSettings ? "rotate-180" : ""}`} />
                </button>
              </div>

              {showThresholdSettings && (
                <form onSubmit={handleSaveThresholds} className="mt-4 pt-4 border-t border-slate-300 space-y-4 animate-fadeIn">
                  <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>Persistence not connected yet — values are for local UI preview testing only and will not modify database configurations.</span>
                  </div>

                  {thresholdError && (
                    <div className="rounded-xl p-3 bg-red-50 border border-red-200 text-xs text-red-900 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
                      <span>{thresholdError}</span>
                    </div>
                  )}

                  {thresholdSuccess && (
                    <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                      <span>Local UI preview settings successfully updated (Database persistence pending connection).</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                    <div className="space-y-1.5">
                      <label htmlFor="lowAttendancePct">Low Attendance Threshold (%)</label>
                      <input
                        id="lowAttendancePct"
                        type="number"
                        step="any"
                        value={thresholds.lowAttendancePct}
                        onChange={(e) => setThresholds({ ...thresholds, lowAttendancePct: e.target.value })}
                        className="w-full rounded-xl neumo-inset px-3.5 py-2.5 text-slate-900 font-semibold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="criticalAttendancePct">Critical Attendance Threshold (%)</label>
                      <input
                        id="criticalAttendancePct"
                        type="number"
                        step="any"
                        value={thresholds.criticalAttendancePct}
                        onChange={(e) => setThresholds({ ...thresholds, criticalAttendancePct: e.target.value })}
                        className="w-full rounded-xl neumo-inset px-3.5 py-2.5 text-slate-900 font-semibold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="dropWindowWeeks">Attendance Drop Window (Weeks)</label>
                      <input
                        id="dropWindowWeeks"
                        type="number"
                        step="1"
                        value={thresholds.dropWindowWeeks}
                        onChange={(e) => setThresholds({ ...thresholds, dropWindowWeeks: e.target.value })}
                        className="w-full rounded-xl neumo-inset px-3.5 py-2.5 text-slate-900 font-semibold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="dropPoints">Attendance Drop Points (%)</label>
                      <input
                        id="dropPoints"
                        type="number"
                        step="any"
                        value={thresholds.dropPoints}
                        onChange={(e) => setThresholds({ ...thresholds, dropPoints: e.target.value })}
                        className="w-full rounded-xl neumo-inset px-3.5 py-2.5 text-slate-900 font-semibold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="marksDropPoints">Marks Decline Threshold (Points)</label>
                      <input
                        id="marksDropPoints"
                        type="number"
                        step="any"
                        value={thresholds.marksDropPoints}
                        onChange={(e) => setThresholds({ ...thresholds, marksDropPoints: e.target.value })}
                        className="w-full rounded-xl neumo-inset px-3.5 py-2.5 text-slate-900 font-semibold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lmsInactiveDays">LMS Inactivity Threshold (Days)</label>
                      <input
                        id="lmsInactiveDays"
                        type="number"
                        step="1"
                        value={thresholds.lmsInactiveDays}
                        onChange={(e) => setThresholds({ ...thresholds, lmsInactiveDays: e.target.value })}
                        className="w-full rounded-xl neumo-inset px-3.5 py-2.5 text-slate-900 font-semibold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingThresholds}
                      className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-md hover:bg-teal-800 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                      {isSavingThresholds && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isSavingThresholds ? "Updating Preview..." : "Save Preview Settings"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FACULTY MANAGEMENT */}
        {activeTab === "faculty" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="neumo-card p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Department Faculty & Mentors</h3>
                  <p className="text-xs text-slate-600 font-medium">Manage faculty assignments, view reach rates, and add department mentors.</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleExportFacultyCsv}
                    className="px-4 py-2.5 rounded-xl bg-[#f0f4f8] text-teal-900 font-bold text-xs neumo-card hover:shadow-[4px_4px_10px_rgba(163,177,198,0.5)] transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Download className="h-4 w-4 text-teal-700" />
                    <span>Export Faculty CSV</span>
                  </button>
                  <button
                    onClick={() => setShowAddFacultyModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-md hover:bg-teal-800 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Faculty</span>
                  </button>
                </div>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-2 pt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search faculty by name or mobile..."
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    className="w-full rounded-xl neumo-inset pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                  />
                </div>
              </div>

              {/* Faculty Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-[#e6edf4] text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Faculty Name</th>
                      <th className="px-4 py-3">Mobile Identifier</th>
                      <th className="px-4 py-3 text-center">Assigned Mentees</th>
                      <th className="px-4 py-3 text-center">Reached</th>
                      <th className="px-4 py-3 text-center">Pending Follow-Ups</th>
                      <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredFaculty.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 font-semibold">
                          No faculty members found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredFaculty.map((f) => {
                        const reachRate = f.assignedCount > 0 ? Math.round((f.reachedCount / f.assignedCount) * 100) : 0;
                        return (
                          <tr key={f.id} className="hover:bg-slate-100/60 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                                {f.name.charAt(0)}
                              </div>
                              <div>
                                <p>{f.name}</p>
                                <span className="text-[10px] text-slate-500 font-medium">ID: {f.id.slice(-6)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-700 font-semibold">{f.mobile}</td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-900">{f.assignedCount}</td>
                            <td className="px-4 py-3.5 text-center">
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold text-[11px]">
                                {f.reachedCount} ({reachRate}%)
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Badge variant="secondary" className={`font-bold text-[11px] ${f.pendingFollowUpsCount > 0 ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-slate-100 text-slate-700"}`}>
                                {f.pendingFollowUpsCount} open
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => setSelectedFacultyForAssignment(f)}
                                className="px-3 py-1.5 rounded-lg bg-[#f0f4f8] text-teal-900 font-bold text-xs neumo-card hover:shadow-[4px_4px_10px_rgba(163,177,198,0.5)] transition-all active:scale-95"
                              >
                                View Assignments
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT ROSTER (MODERNIZED WITH FACULTY CARDS & MODERN DROPDOWN) */}
        {activeTab === "students" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="neumo-card p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Department Student Roster</h3>
                  <p className="text-xs text-slate-600 font-medium">Inspect department students, reach status, and faculty mentor mappings.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-teal-100 text-teal-900 border-teal-300 font-bold text-xs px-3 py-1.5">
                    Total Enrolled: {students.length}
                  </Badge>
                </div>
              </div>

              {/* Interactive Faculty Overview Cards for Quick Filtering */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Filter Roster by Faculty Mentor</h4>
                  {selectedFacultyFilter !== "all" && (
                    <button
                      onClick={() => setSelectedFacultyFilter("all")}
                      className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
                    >
                      Clear Faculty Filter <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div
                    onClick={() => setSelectedFacultyFilter("all")}
                    role="button"
                    tabIndex={0}
                    className={`neumo-card p-3.5 cursor-pointer transition-all hover:-translate-y-1 ${
                      selectedFacultyFilter === "all" ? "ring-2 ring-teal-600 bg-teal-50/60 shadow-md" : ""
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-600">All Faculty</p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">{students.length} Students</p>
                  </div>
                  {faculty.map((f) => {
                    const isSelected = selectedFacultyFilter === f.id;
                    const reachRate = f.assignedCount > 0 ? Math.round((f.reachedCount / f.assignedCount) * 100) : 0;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFacultyFilter(isSelected ? "all" : f.id)}
                        role="button"
                        tabIndex={0}
                        className={`neumo-card p-3.5 cursor-pointer transition-all hover:-translate-y-1 ${
                          isSelected ? "ring-2 ring-teal-600 bg-teal-50/60 shadow-md" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-extrabold text-slate-900 truncate">{f.name}</p>
                          <Badge variant="secondary" className="bg-teal-100 text-teal-900 font-bold text-[10px]">
                            {reachRate}%
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 font-semibold mt-1">{f.assignedCount} Mentees</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filters & Search Toolbar with Modernized Custom Dropdown */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-300/60">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student by name or roll number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full rounded-xl neumo-inset pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                  />
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 relative">
                  {/* Modernized Status Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="px-4 py-2.5 rounded-xl bg-[#f0f4f8] text-slate-800 font-bold text-xs neumo-card hover:shadow-[4px_4px_10px_rgba(163,177,198,0.5)] transition-all flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4 text-teal-700" />
                      <span>
                        Status: {studentFilter === "all" ? "All" : studentFilter === "reached" ? "Reached" : studentFilter === "unreached" ? "Unreached" : "Unassigned"}
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showStatusDropdown && (
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#f0f4f8] shadow-2xl border border-slate-300/80 z-30 p-1.5 space-y-1 animate-fadeIn">
                        {[
                          { key: "all", label: "All Students" },
                          { key: "reached", label: "Reached" },
                          { key: "unreached", label: "Unreached" },
                          { key: "unassigned", label: "Unassigned" },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setStudentFilter(opt.key as any);
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                              studentFilter === opt.key ? "bg-teal-700 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200/60"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-[#e6edf4] text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-3.5 rounded-l-xl">Roll Number</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Assigned Mentor</th>
                      <th className="px-4 py-3.5 text-center">Meeting Status</th>
                      <th className="px-4 py-3.5 text-center rounded-r-xl">Open Follow-Ups</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500 font-semibold">
                          No students found matching your search or filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-100/60 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-900">{s.rollNo}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">{s.name}</td>
                          <td className="px-4 py-3.5 text-slate-700 font-semibold">
                            {s.mentorName ? (
                              <span className="text-teal-900 font-bold">{s.mentorName}</span>
                            ) : (
                              <span className="text-amber-700 font-bold italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Badge variant="secondary" className={`font-bold text-[11px] ${s.reached ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-amber-100 text-amber-900 border-amber-300"}`}>
                              {s.reached ? "Reached" : "Unreached"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                            {s.pendingFollowUpsCount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CSV IMPORT TOOL */}
        {activeTab === "import" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="neumo-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shadow-inner shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Client-Side CSV Import Tool</h3>
                  <p className="text-xs text-slate-600 font-medium">Upload student or faculty CSV rosters for client-side formatting validation and preview.</p>
                </div>
              </div>

              <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Preview & Validation Mode:</span> Bulk database import requires backend endpoint connectivity. Uploading a CSV here provides secure client-side parsing, column header checking, and row preview without modifying database records.
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="text-xs font-extrabold text-slate-700">Import Target:</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === "students"}
                      onChange={() => setImportType("students")}
                      className="text-teal-700 focus:ring-teal-600"
                    />
                    Student Roster
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === "faculty"}
                      onChange={() => setImportType("faculty")}
                      className="text-teal-700 focus:ring-teal-600"
                    />
                    Faculty Roster
                  </label>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 neumo-inset bg-[#f0f4f8]">
                <Upload className="mx-auto h-8 w-8 text-teal-700" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {csvFile ? `Selected file: ${csvFile.name}` : "Drag and drop your CSV file here, or click to browse"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {importType === "students"
                      ? "Expected CSV columns: rollNo, name, mobile (or email)"
                      : "Expected CSV columns: name, mobile, email"}
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  aria-label="Upload CSV file for roster import"
                  className="mx-auto block text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-700 file:text-white hover:file:bg-teal-800 cursor-pointer transition-colors"
                />
              </div>

              {csvError && (
                <div className="rounded-xl p-3 bg-red-50 border border-red-200 text-xs text-red-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              {isParsingCsv && (
                <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-slate-700">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
                  <span>Parsing and validating CSV structure...</span>
                </div>
              )}

              {csvPreviewRows.length > 0 && !isParsingCsv && (
                <div className="space-y-4 pt-4 border-t border-slate-300 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">
                      CSV Parse Preview ({csvPreviewRows.length} rows detected)
                    </span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold text-xs">
                      Headers Validated
                    </Badge>
                  </div>

                  <div className="overflow-x-auto max-h-64 rounded-xl neumo-inset p-2">
                    <table className="w-full text-left text-xs text-slate-800">
                      <thead className="bg-[#e6edf4] text-slate-700 font-extrabold uppercase tracking-wider">
                        <tr>
                          {csvHeaders.map((h, i) => (
                            <th key={i} className="px-3 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {csvPreviewRows.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/40">
                            {csvHeaders.map((h, i) => (
                              <td key={i} className="px-3 py-2">{row[h] || "—"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvPreviewRows.length > 10 && (
                    <p className="text-[11px] text-slate-500 italic">Showing first 10 of {csvPreviewRows.length} rows.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD FACULTY */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="neumo-card w-full max-w-md p-6 sm:p-7 space-y-4 bg-[#edf2f7] shadow-2xl relative">
            <button
              onClick={() => setShowAddFacultyModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-[#f0f4f8] text-slate-700 flex items-center justify-center neumo-card hover:bg-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shadow-inner shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add Faculty Member</h3>
                <p className="text-xs text-slate-600 font-medium">Register a new faculty mentor in department</p>
              </div>
            </div>

            <form onSubmit={handleAddFaculty} className="space-y-4 pt-2">
              <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Backend persistence requires admin account provisioning. Form input is validated for UI preview.</span>
              </div>

              {addFacultyError && (
                <div className="rounded-xl p-3 bg-red-50 border border-red-200 text-xs text-red-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-700 shrink-0" />
                  <span>{addFacultyError}</span>
                </div>
              )}

              {addFacultySuccess && (
                <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>Faculty form validated successfully (Backend account provisioning pending).</span>
                </div>
              )}

              <div className="space-y-1.5 text-xs font-bold text-slate-700">
                <label htmlFor="facultyName">Faculty Full Name *</label>
                <input
                  id="facultyName"
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  className="w-full rounded-xl neumo-inset px-3.5 py-2.5 text-slate-900 font-semibold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5 text-xs font-bold text-slate-700">
                <label htmlFor="facultyMobile">Mobile Identifier (Login ID) *</label>
                <input
                  id="facultyMobile"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newFaculty.mobile}
                  onChange={(e) => setNewFaculty({ ...newFaculty, mobile: e.target.value })}
                  className="w-full rounded-xl neumo-inset px-3.5 py-2.5 text-slate-900 font-semibold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-transparent transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#f0f4f8] text-slate-700 font-bold text-xs neumo-card hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingFaculty}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-md hover:bg-teal-800 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {isAddingFaculty && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isAddingFaculty ? "Validating..." : "Register Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FACULTY ASSIGNMENTS DRAWER */}
      {selectedFacultyForAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="neumo-card w-full max-w-xl p-6 sm:p-7 space-y-4 bg-[#edf2f7] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFacultyForAssignment(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-[#f0f4f8] text-slate-700 flex items-center justify-center neumo-card hover:bg-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shadow-inner shrink-0 font-extrabold text-sm">
                {selectedFacultyForAssignment.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedFacultyForAssignment.name}</h3>
                <p className="text-xs text-slate-600 font-medium">Assigned Mentees & Mentoring Activity</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="neumo-inset p-3 rounded-xl text-center">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Assigned</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{selectedFacultyForAssignment.assignedCount}</p>
              </div>
              <div className="neumo-inset p-3 rounded-xl text-center">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Reached</span>
                <p className="text-xl font-extrabold text-emerald-800 mt-1">{selectedFacultyForAssignment.reachedCount}</p>
              </div>
              <div className="neumo-inset p-3 rounded-xl text-center">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Open Follow-Ups</span>
                <p className="text-xl font-extrabold text-amber-800 mt-1">{selectedFacultyForAssignment.pendingFollowUpsCount}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Assigned Students Roster</h4>
              {selectedFacultyForAssignment.students.length === 0 ? (
                <div className="rounded-xl p-4 neumo-inset text-center text-xs text-slate-500 font-semibold">
                  No students currently assigned to this faculty member.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedFacultyForAssignment.students.map((s) => (
                    <div key={s.id} className="neumo-card p-3 flex items-center justify-between text-xs transition-all hover:bg-slate-100/60">
                      <div>
                        <p className="font-extrabold text-slate-900">{s.name}</p>
                        <span className="text-[11px] text-slate-500 font-semibold">Roll No: {s.rollNo}</span>
                      </div>
                      <Badge variant="secondary" className={`font-bold text-[11px] ${s.reached ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-amber-100 text-amber-900 border-amber-300"}`}>
                        {s.reached ? "Reached" : "Unreached"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFacultyForAssignment(null)}
                className="px-5 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-md hover:bg-teal-800 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
