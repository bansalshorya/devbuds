"use client";

import { motion } from "motion/react";
import { Users, Calendar, Mic, Clock, TrendingUp, Building2, CheckCircle2, FileText, Check, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export function PlatformCapabilitiesSection() {
  return (
    <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B] bg-[#EEF2EF] px-3.5 py-1 rounded-full border border-[#DCE4DD] shadow-2xs">
          Comprehensive Tooling
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#242924]">
          Platform Capabilities
        </h2>
        <p className="text-sm sm:text-base text-[#5F6962] font-medium leading-relaxed">
          Purpose-built workflows designed specifically for faculty mentors, students, and department leadership.
        </p>
      </div>

      {/* Asymmetric Editorial Grid */}
      <div className="space-y-6">

        {/* ================= 1. FEATURED CAPABILITY: Mentor-Student Management ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="neumo-card p-8 sm:p-12 bg-white border-[#DCE4DD] shadow-xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E5F3E8]/60 rounded-full blur-3xl pointer-events-none" />

          <div className="lg:col-span-6 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2EF] border border-[#DCE4DD] text-xs font-bold text-[#527A5B]">
              <Users className="h-4 w-4" /> Featured Capability
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#242924] tracking-tight">
              Mentor–Student Management
            </h3>
            <p className="text-base sm:text-lg text-[#5F6962] font-medium leading-relaxed">
              Organize student cohorts effortlessly, maintain secure roll number linkages, and ensure crystal-clear faculty accountability across every academic department.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-[#527A5B]">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Cohort Rosters</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Secure Linking</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Role Separation</span>
            </div>
          </div>

          {/* Illustrative Student Directory Preview */}
          <div className="lg:col-span-6 relative z-10">
            <div className="rounded-2xl bg-[#EEF2EF] border border-[#DCE4DD] p-5 shadow-inner space-y-3 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE4DD]">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B]">Active Cohort Directory</span>
                <span className="text-[10px] font-mono bg-white px-2.5 py-0.5 rounded-md text-[#5F6962] border border-[#DCE4DD]">CS-2026</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Aarav Sharma", roll: "CS-2026-01", mentor: "Dr. Kulkarni", status: "On Track" },
                  { name: "Priya Patel", roll: "CS-2026-02", mentor: "Prof. Sharma", status: "Review Needed" },
                  { name: "Rohan Verma", roll: "CS-2026-03", mentor: "Dr. Kulkarni", status: "On Track" },
                ].map((s) => (
                  <div key={s.roll} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#DCE4DD] text-xs shadow-2xs">
                    <div>
                      <p className="font-extrabold text-[#242924]">{s.name}</p>
                      <p className="text-[10px] font-mono text-[#5F6962]">{s.roll} · Mentor: {s.mentor}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.status === "On Track" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>


        {/* ================= 2-COLUMN GRID FOR REMAINING 5 CAPABILITIES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Capability 2: Meeting Records & Logs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="neumo-card p-6 bg-white border-[#DCE4DD] space-y-4 flex flex-col justify-between hover:border-[#527A5B] transition-all group"
          >
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#EEF2EF] text-[#527A5B] border border-[#DCE4DD] flex items-center justify-center font-bold group-hover:bg-[#527A5B] group-hover:text-white transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#242924]">Meeting Records &amp; Logs</h3>
              <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">
                Record concise 10-minute check-ins in minutes with structured tags, dates, and discussion summaries.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#EEF2EF] border border-[#DCE4DD] space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[#242924]">
                <span>Weekly Check-in #3</span>
                <span className="text-[10px] font-mono text-[#527A5B]">Logged Today</span>
              </div>
              <p className="text-[11px] text-[#5F6962] truncate">Status: Discussed project timeline &amp; attendance.</p>
            </div>
          </motion.div>

          {/* Capability 3: Voice-Assisted Notes */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="neumo-card p-6 bg-white border-[#DCE4DD] space-y-4 flex flex-col justify-between hover:border-[#527A5B] transition-all group"
          >
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#EEF2EF] text-[#527A5B] border border-[#DCE4DD] flex items-center justify-center font-bold group-hover:bg-[#527A5B] group-hover:text-white transition-colors">
                <Mic className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#242924]">Voice-Assisted Notes</h3>
              <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">
                Dictate meeting reflections via voice note inputs and automatically extract key action items.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#EEF2EF] border border-[#DCE4DD] space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#527A5B] font-bold">
                <FileText className="h-3.5 w-3.5" /> Speech Transcription:
              </div>
              <p className="text-[10px] text-[#5F6962] italic">&quot;Student requested extra practice on database indexing...&quot;</p>
            </div>
          </motion.div>

          {/* Capability 4: Follow-up Reminders */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="neumo-card p-6 bg-white border-[#DCE4DD] space-y-4 flex flex-col justify-between hover:border-[#527A5B] transition-all group"
          >
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#EEF2EF] text-[#527A5B] border border-[#DCE4DD] flex items-center justify-center font-bold group-hover:bg-[#527A5B] group-hover:text-white transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#242924]">Follow-up Reminders</h3>
              <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">
                Keep commitments on track with integrated reminders, calendar sync links, and status toggles.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#EEF2EF] border border-[#DCE4DD] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-sm bg-[#527A5B] flex items-center justify-center text-white"><Check className="h-2.5 w-2.5" /></div>
                <span className="font-bold text-[#242924]">Submit GitHub Repo</span>
              </div>
              <span className="text-[10px] font-mono text-amber-700">Due Friday</span>
            </div>
          </motion.div>

          {/* Capability 5: Student Progress Timelines */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="neumo-card p-6 bg-white border-[#DCE4DD] space-y-4 flex flex-col justify-between hover:border-[#527A5B] transition-all group"
          >
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#EEF2EF] text-[#527A5B] border border-[#DCE4DD] flex items-center justify-center font-bold group-hover:bg-[#527A5B] group-hover:text-white transition-colors">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#242924]">Student Progress Timelines</h3>
              <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">
                Visualize academic milestones and historical touchpoints in a clean, chronological timeline view.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#EEF2EF] border border-[#DCE4DD] space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="font-bold text-[#242924]">Week 1-4 Baseline Met</span>
              </div>
              <p className="text-[10px] text-[#5F6962] pl-4">Consistent check-ins recorded by mentor.</p>
            </div>
          </motion.div>

          {/* Capability 6: Department-Level Insights */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="neumo-card p-6 bg-white border-[#DCE4DD] space-y-4 flex flex-col justify-between hover:border-[#527A5B] transition-all group md:col-span-2 lg:col-span-1"
          >
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-[#EEF2EF] text-[#527A5B] border border-[#DCE4DD] flex items-center justify-center font-bold group-hover:bg-[#527A5B] group-hover:text-white transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#242924]">Department-Level Insights</h3>
              <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">
                Heads of Department gain comprehensive coverage analytics while respecting individual student privacy.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#EEF2EF] border border-[#DCE4DD] flex items-center justify-between text-xs">
              <span className="font-bold text-[#242924]">Overall Department Reach</span>
              <span className="font-mono font-extrabold text-[#527A5B] bg-white px-2 py-0.5 rounded border border-[#DCE4DD]">88% Covered</span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
