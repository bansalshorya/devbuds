"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Users, BookOpen, Calendar, Clock, TrendingUp, CheckCircle2, ShieldCheck, FileText, Check, AlertCircle } from "lucide-react";

const STAGES = [
  {
    step: "01",
    title: "Student",
    subtitle: "Assigned Cohorts & Profiles",
    desc: "Students are organized into dedicated faculty mentoring cohorts with clear roll numbers, academic profiles, and early warning status indicators.",
    icon: Users,
    detail: "Centralized student directory with secure role access.",
    previewType: "student",
  },
  {
    step: "02",
    title: "Mentor",
    subtitle: "Faculty Guidance & Oversight",
    desc: "Faculty mentors conduct structured 10-minute check-ins, keeping track of student well-being and academic progress.",
    icon: BookOpen,
    detail: "Dedicated faculty portal for fast, impactful touchpoints.",
    previewType: "mentor",
  },
  {
    step: "03",
    title: "Meeting",
    subtitle: "Logs & Voice-Assisted Notes",
    desc: "Record mentoring sessions effortlessly. Dictate reflections via voice inputs and automatically extract key action items.",
    icon: Calendar,
    detail: "Structured notes and speech-to-text integration.",
    previewType: "meeting",
  },
  {
    step: "04",
    title: "Follow-up",
    subtitle: "Commitments & Reminders",
    desc: "Keep agreed commitments on track with integrated reminders, calendar sync links, and instant status updates.",
    icon: Clock,
    detail: "Automated alerts prevent academic drift.",
    previewType: "followup",
  },
  {
    step: "05",
    title: "Progress",
    subtitle: "Milestones & Department Insights",
    desc: "Visualize academic milestones on a chronological timeline while HODs monitor overall department coverage.",
    icon: TrendingUp,
    detail: "Real-time coverage analytics and progress tracking.",
    previewType: "progress",
  },
];

function StagePreview({ type }: { type: string }) {
  switch (type) {
    case "student":
      return (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE4DD]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B]">Student Directory Preview</span>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">Cohort Active</span>
          </div>
          <div className="space-y-2">
            {[
              { name: "Aarav Sharma", roll: "CS-2026-01", status: "On Track", badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
              { name: "Priya Patel", roll: "CS-2026-02", status: "Review Needed", badgeBg: "bg-amber-50 text-amber-800 border-amber-200" },
              { name: "Rohan Verma", roll: "CS-2026-03", status: "On Track", badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
            ].map((s) => (
              <div key={s.roll} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#DCE4DD] text-xs shadow-2xs">
                <div>
                  <p className="font-extrabold text-[#242924]">{s.name}</p>
                  <p className="text-[10px] font-mono text-[#5F6962]">{s.roll}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badgeBg}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case "mentor":
      return (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE4DD]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B]">Mentor Assignment Control</span>
            <span className="text-[10px] font-mono bg-[#EEF2EF] text-[#527A5B] px-2 py-0.5 rounded-full border border-[#DCE4DD]">1:1 Link</span>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#DCE4DD] space-y-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#E5F3E8] text-[#527A5B] flex items-center justify-center font-bold text-xs">Dr. K</div>
              <div>
                <p className="text-xs font-extrabold text-[#242924]">Dr. Kulkarni (Faculty Mentor)</p>
                <p className="text-[10px] text-[#5F6962]">Assigned Department: Computer Science</p>
              </div>
            </div>
            <div className="pt-2 border-t border-[#DCE4DD] flex items-center justify-between text-xs">
              <span className="text-[#5F6962]">Active Mentees: <strong className="text-[#242924]">18 Students</strong></span>
              <span className="text-[#527A5B] font-bold">Linked &amp; Verified</span>
            </div>
          </div>
        </div>
      );

    case "meeting":
      return (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE4DD]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B]">Voice &amp; Notes Log</span>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">10-Min Log</span>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#DCE4DD] space-y-2 text-xs shadow-2xs">
            <div className="flex items-center gap-2 text-[#527A5B] font-bold">
              <FileText className="h-3.5 w-3.5" /> Voice Transcript Excerpt:
            </div>
            <p className="text-[11px] text-[#5F6962] italic bg-[#EEF2EF] p-2 rounded-lg">
              &quot;Student discussed mid-term project goals and requested guidance on database indexing strategies.&quot;
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-[#242924]">
              <span>Action Item: Share index cheatsheet</span>
              <span className="text-amber-700">Due in 3 days</span>
            </div>
          </div>
        </div>
      );

    case "followup":
      return (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE4DD]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B]">Commitment Checklist</span>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">2 Pending</span>
          </div>
          <div className="space-y-2">
            {[
              { task: "Complete Prisma migration setup", due: "Due Tomorrow", done: false },
              { task: "Review faculty check-in guidelines", due: "Completed", done: true },
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#DCE4DD] text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className={`h-4 w-4 rounded-md flex items-center justify-center border ${f.done ? "bg-[#527A5B] border-[#527A5B] text-white" : "border-[#DCE4DD] bg-[#EEF2EF]"}`}>
                    {f.done && <Check className="h-3 w-3" />}
                  </div>
                  <span className={`font-bold ${f.done ? "line-through text-[#737D76]" : "text-[#242924]"}`}>{f.task}</span>
                </div>
                <span className={`text-[10px] font-medium ${f.done ? "text-[#737D76]" : "text-amber-700"}`}>{f.due}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "progress":
      return (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE4DD]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B]">Academic Progress Timeline</span>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">Milestones</span>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#DCE4DD] space-y-2 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-[#527A5B] text-white flex items-center justify-center text-[10px] font-bold">✓</div>
              <div>
                <p className="font-extrabold text-[#242924]">Week 1-4 Touchpoint Completed</p>
                <p className="text-[10px] text-[#5F6962]">All baseline mentoring benchmarks met successfully.</p>
              </div>
            </div>
            <div className="ml-3 border-l-2 border-[#527A5B]/30 pl-4 py-1">
              <p className="font-extrabold text-[#242924] text-[11px]">Mid-Semester Check-in (Active)</p>
              <p className="text-[10px] text-[#5F6962]">Early warning indicators green across cohort.</p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function MentorshipJourneySection() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section id="journey" className="py-24 bg-[#EEF2EF]/60 border-y border-[#DCE4DD] px-4 sm:px-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#E5F3E8]/50 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-16">

        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#527A5B] bg-white px-3 py-1 rounded-full border border-[#DCE4DD] shadow-2xs">
            Immersive Storytelling
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#242924]">
            The Mentorship Journey
          </h2>
          <p className="text-sm sm:text-base text-[#5F6962] font-medium leading-relaxed">
            Follow how DevBuds seamlessly connects students, faculty mentors, structured meetings, follow-ups, and academic growth.
          </p>
        </div>

        {/* ================= DESKTOP IMMERSIVE SCROLL / TABS EXPERIENCE ================= */}
        <div className="hidden lg:block space-y-12">

          {/* Interactive Stage Selector Bar */}
          <div className="grid grid-cols-5 gap-3 p-2 rounded-2xl bg-white border border-[#DCE4DD] shadow-sm">
            {STAGES.map((s, idx) => {
              const Icon = s.icon;
              const isActive = activeStage === idx;
              return (
                <button
                  key={s.step}
                  onClick={() => setActiveStage(idx)}
                  className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#527A5B] text-white shadow-md"
                      : "bg-transparent text-[#5F6962] hover:bg-[#EEF2EF] hover:text-[#242924]"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-[#EEF2EF] text-[#527A5B]"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-[10px] font-mono font-bold uppercase tracking-wider ${isActive ? "text-emerald-100" : "text-[#737D76]"}`}>
                      Stage {s.step}
                    </span>
                    <span className="block text-sm font-extrabold truncate">{s.title}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Deep-Dive Showcase Card with Stage-Specific Preview */}
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="neumo-card p-10 bg-white border-[#DCE4DD] shadow-xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E5F3E8]/60 rounded-full blur-3xl pointer-events-none" />

            <div className="lg:col-span-7 space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2EF] border border-[#DCE4DD] text-xs font-bold text-[#527A5B]">
                Stage {STAGES[activeStage].step} of 05 · {STAGES[activeStage].subtitle}
              </div>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#242924] tracking-tight">
                {STAGES[activeStage].title}
              </h3>

              <p className="text-base sm:text-lg text-[#5F6962] font-medium leading-relaxed">
                {STAGES[activeStage].desc}
              </p>

              <div className="pt-4 border-t border-[#DCE4DD] flex items-center gap-3 text-xs font-bold text-[#527A5B]">
                <CheckCircle2 className="h-4 w-4" /> {STAGES[activeStage].detail}
              </div>
            </div>

            {/* Stage-Specific Illustrative Product Preview Panel */}
            <div className="lg:col-span-5 relative z-10 flex items-center justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-[#EEF2EF] border border-[#DCE4DD] p-5 shadow-inner">
                <StagePreview type={STAGES[activeStage].previewType} />
              </div>
            </div>

          </motion.div>
        </div>


        {/* ================= MOBILE VERTICAL CONNECTED JOURNEY (<1024px) ================= */}
        <div className="block lg:hidden relative space-y-6">
          {/* Vertical Connecting Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-[#527A5B]/30 border-dashed pointer-events-none" />

          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="relative pl-14"
              >
                {/* Node Icon Circle */}
                <div className="absolute left-1.5 top-1.5 h-9 w-9 rounded-xl bg-[#527A5B] text-white flex items-center justify-center font-bold shadow-md border-2 border-[#EEF2EF]">
                  <Icon className="h-4 w-4" />
                </div>

                {/* Stage Card */}
                <div className="neumo-card p-5 bg-white border-[#DCE4DD] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#527A5B] bg-[#E5F3E8] px-2.5 py-0.5 rounded-md border border-[#DCE4DD]">
                      Stage {s.step}
                    </span>
                    <span className="text-xs font-bold text-[#5F6962]">{s.subtitle}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#242924]">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-[#5F6962] font-medium leading-relaxed">{s.desc}</p>

                  {/* Compact Mobile Product Preview Snippet */}
                  <div className="pt-3 border-t border-[#DCE4DD]">
                    <div className="p-3 rounded-xl bg-[#EEF2EF] border border-[#DCE4DD]">
                      <StagePreview type={s.previewType} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
