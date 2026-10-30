"use client";

import { motion } from "motion/react";
import { Users, GraduationCap, Building2, CheckCircle2, Clock, Calendar, TrendingUp, BarChart3, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ProductShowcaseSection() {
  return (
    <section className="py-24 bg-[#EEF2EF]/40 border-t border-[#DCE4DD] px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B] bg-white px-3.5 py-1 rounded-full border border-[#DCE4DD] shadow-2xs">
            Role-Based Portals
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#242924]">
            Tailored Experiences
          </h2>
          <p className="text-sm sm:text-base text-[#5F6962] font-medium leading-relaxed">
            Purpose-built portals designed for faculty mentors, students, and department leadership.
          </p>
        </div>

        {/* 3 Portal Showcase Cards with Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ================= 1. FACULTY / MENTOR PORTAL ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="neumo-card p-8 bg-white border-[#DCE4DD] flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group hover:border-[#527A5B] transition-all"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E5F3E8]/50 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-[#E5F3E8] text-[#527A5B] border border-[#DCE4DD] flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono font-bold bg-[#EEF2EF] text-[#527A5B] px-2.5 py-1 rounded-md border border-[#DCE4DD]">
                  Mentor Portal
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-[#242924]">Faculty Mentor Hub</h3>
                <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">
                  Review flagged student alerts, filter by severity, manage cohorts, and log 10-minute check-ins effortlessly.
                </p>
              </div>

              {/* Illustrative Interface Snippet */}
              <div className="p-4 rounded-2xl bg-[#EEF2EF] border border-[#DCE4DD] space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#DCE4DD]">
                  <span className="font-extrabold text-[#242924]">Assigned Mentees</span>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">2 Alerts</span>
                </div>
                {[
                  { name: "Aarav Sharma", status: "Met Today", alert: false },
                  { name: "Priya Patel", status: "Needs Check-in", alert: true },
                ].map((m) => (
                  <div key={m.name} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#DCE4DD]">
                    <span className="font-bold text-[#242924]">{m.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.alert ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 text-xs font-bold text-[#527A5B]">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Cohort Rosters &amp; Profiles</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Meeting Records &amp; Voice Notes</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Follow-up Commitment Tracking</div>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-between w-full p-3 rounded-xl bg-[#EEF2EF] hover:bg-[#E5F3E8] border border-[#DCE4DD] text-xs font-bold text-[#242924] transition-colors relative z-10"
            >
              <span>Access Faculty Portal</span>
              <ArrowRight className="h-4 w-4 text-[#527A5B]" />
            </Link>
          </motion.div>


          {/* ================= 2. STUDENT PORTAL ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="neumo-card p-8 bg-white border-[#DCE4DD] flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group hover:border-[#527A5B] transition-all"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E5F3E8]/50 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-[#527A5B] text-white border border-[#527A5B] flex items-center justify-center font-bold">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono font-bold bg-[#EEF2EF] text-[#527A5B] px-2.5 py-1 rounded-md border border-[#DCE4DD]">
                  Student Portal
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-[#242924]">Student Mentoring Portal</h3>
                <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">
                  Track agreed action items, view meeting history, and stay aligned with faculty mentor commitments.
                </p>
              </div>

              {/* Illustrative Interface Snippet */}
              <div className="p-4 rounded-2xl bg-[#EEF2EF] border border-[#DCE4DD] space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#DCE4DD]">
                  <span className="font-extrabold text-[#242924]">Agreed Commitments</span>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">1 Pending</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#DCE4DD]">
                  <span className="font-bold text-[#242924]">Submit GitHub Repo</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Due Tomorrow</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs font-bold text-[#527A5B]">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Mentoring History &amp; Logs</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Academic Progress Timeline</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Calendar Reminder Links</div>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-between w-full p-3 rounded-xl bg-[#EEF2EF] hover:bg-[#E5F3E8] border border-[#DCE4DD] text-xs font-bold text-[#242924] transition-colors relative z-10"
            >
              <span>Access Student Portal</span>
              <ArrowRight className="h-4 w-4 text-[#527A5B]" />
            </Link>
          </motion.div>


          {/* ================= 3. DEPARTMENT / HOD PORTAL ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="neumo-card p-8 bg-white border-[#DCE4DD] flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group hover:border-[#527A5B] transition-all"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E5F3E8]/50 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-[#EEF2EF] text-[#527A5B] border border-[#DCE4DD] flex items-center justify-center font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono font-bold bg-[#EEF2EF] text-[#527A5B] px-2.5 py-1 rounded-md border border-[#DCE4DD]">
                  HOD Portal
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-[#242924]">Department Overview</h3>
                <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">
                  Monitor faculty mentoring coverage percentages, student reach, and department-level analytics securely.
                </p>
              </div>

              {/* Illustrative Interface Snippet */}
              <div className="p-4 rounded-2xl bg-[#EEF2EF] border border-[#DCE4DD] space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#DCE4DD]">
                  <span className="font-extrabold text-[#242924]">Mentoring Coverage</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">88% Reach</span>
                </div>
                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#DCE4DD]">
                  <div className="h-full bg-[#527A5B] w-[88%]" />
                </div>
                <p className="text-[10px] text-[#5F6962]">142 of 160 students reached this cycle.</p>
              </div>

              <div className="space-y-2 pt-2 text-xs font-bold text-[#527A5B]">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Faculty Coverage Analytics</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Department Administration</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> CSV Imports &amp; Registries</div>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-between w-full p-3 rounded-xl bg-[#EEF2EF] hover:bg-[#E5F3E8] border border-[#DCE4DD] text-xs font-bold text-[#242924] transition-colors relative z-10"
            >
              <span>Access HOD Portal</span>
              <ArrowRight className="h-4 w-4 text-[#527A5B]" />
            </Link>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
