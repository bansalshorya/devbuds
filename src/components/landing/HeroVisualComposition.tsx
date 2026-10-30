"use client";

import { motion } from "motion/react";
import { Users, Clock, Mic, TrendingUp, GraduationCap, ShieldCheck } from "lucide-react";

export function HeroVisualComposition() {
  return (
    <div className="relative w-full max-w-lg aspect-square mx-auto flex items-center justify-center p-1 sm:p-4 select-none">
      {/* Background Soft Organic Backdrop Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#E5F3E8]/90 via-[#F0F5F1]/50 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Ecosystem Container */}
      <div className="relative z-10 w-full h-[400px] sm:h-full rounded-3xl bg-white/90 backdrop-blur-xl p-3 sm:p-6 border border-[#DCE4DD] shadow-xl flex flex-col justify-between overflow-hidden">

        {/* Top Header Node */}
        <div className="flex items-center justify-between border-b border-[#DCE4DD] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5F6962]">Mentorship Ecosystem</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#EEF2EF] px-2.5 py-0.5 rounded-md text-[#527A5B] border border-[#DCE4DD]">
            Active Network
          </span>
        </div>

        {/* Central Organic Connected Mentorship Ecosystem */}
        <div className="relative my-auto w-full h-[300px] sm:h-[300px] flex items-center justify-center">

          {/* SVG Connecting Curved Paths (Desktop Layout) - All 4 Nodes Visibly Connected to Student Core (200, 150) */}
          <svg className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 400 300" fill="none">
            {/* Faculty Mentor (Top Left: ~110, 50) to Student Core (~200, 150) */}
            <path d="M 110 65 Q 160 110 200 150" stroke="#527A5B" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />

            {/* 10-Min Session (Top Right: ~290, 50) to Student Core (~200, 150) */}
            <path d="M 290 65 Q 240 110 200 150" stroke="#527A5B" strokeWidth="2" className="opacity-30" />

            {/* Commitments (Bottom Right: ~290, 235) to Student Core (~200, 150) */}
            <path d="M 290 235 Q 240 190 200 150" stroke="#527A5B" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />

            {/* Progress Path (Bottom Left: ~110, 235) to Student Core (~200, 150) */}
            <path d="M 110 235 Q 160 190 200 150" stroke="#527A5B" strokeWidth="2" className="opacity-30" />

            {/* Animated Pulse Dot along Mentor-Student path */}
            <motion.circle
              cx="155"
              cy="108"
              r="4"
              fill="#527A5B"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>

          {/* SVG Connecting Paths (Mobile Layout) */}
          <svg className="block sm:hidden absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 350 300" fill="none">
            <path d="M 75 55 Q 125 100 175 150" stroke="#527A5B" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-40" />
            <path d="M 275 55 Q 225 100 175 150" stroke="#527A5B" strokeWidth="1.5" className="opacity-30" />
            <path d="M 275 245 Q 225 200 175 150" stroke="#527A5B" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-40" />
            <path d="M 75 245 Q 125 200 175 150" stroke="#527A5B" strokeWidth="1.5" className="opacity-30" />
          </svg>

          {/* ================= DESKTOP ABSOLUTE POSITIONED NODES ================= */}
          {/* Node 1: Faculty Mentor (Top Left) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden sm:flex absolute top-2 left-4 items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white border border-[#DCE4DD] shadow-md hover:border-[#527A5B] transition-all"
          >
            <div className="h-8 w-8 rounded-xl bg-[#E5F3E8] text-[#527A5B] flex items-center justify-center font-bold shadow-2xs">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#242924]">Faculty Mentor</p>
              <p className="text-[10px] text-[#5F6962] font-medium">Cohort Guide</p>
            </div>
          </motion.div>

          {/* Node 2: Central Student Core */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden sm:flex absolute top-[150px] left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center p-3 rounded-3xl bg-[#527A5B] text-white shadow-lg border-2 border-white z-20"
          >
            <div className="h-9 w-9 rounded-2xl bg-white/25 flex items-center justify-center font-bold mb-1 shadow-inner">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <p className="text-xs font-extrabold tracking-wide">Student Core</p>
            <span className="text-[9px] font-mono bg-white/20 px-2 py-0.5 rounded-full mt-0.5">Focus Node</span>
          </motion.div>

          {/* Node 3: Mentoring Session & Voice Note (Top Right) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden sm:flex absolute top-2 right-4 items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#EEF2EF] border border-[#DCE4DD] shadow-inner"
          >
            <div className="h-8 w-8 rounded-xl bg-[#527A5B] text-white flex items-center justify-center font-bold shadow-2xs">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#242924]">10-Min Session</p>
              <p className="text-[10px] text-[#5F6962] font-medium">Voice Notes</p>
            </div>
          </motion.div>

          {/* Node 4: Follow-up & Commitments (Bottom Right) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden sm:flex absolute bottom-4 right-4 items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white border border-[#DCE4DD] shadow-md hover:border-[#527A5B] transition-all"
          >
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shadow-2xs">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#242924]">Commitments</p>
              <p className="text-[10px] text-[#5F6962] font-medium">Action Reminders</p>
            </div>
          </motion.div>

          {/* Node 5: Academic Progress & Growth (Bottom Left) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="hidden sm:flex absolute bottom-4 left-4 items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white border border-[#DCE4DD] shadow-md hover:border-[#527A5B] transition-all"
          >
            <div className="h-8 w-8 rounded-xl bg-[#E5F3E8] text-[#527A5B] flex items-center justify-center font-bold shadow-2xs">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#242924]">Progress Path</p>
              <p className="text-[10px] text-[#5F6962] font-medium">Early Warning</p>
            </div>
          </motion.div>


          {/* ================= MOBILE DEDICATED SPACED POSITIONING (<640px) ================= */}
          {/* Node 1: Faculty Mentor (Mobile Top Left - Inset & Readable) */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex sm:hidden absolute top-3 left-2 items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-[#DCE4DD] shadow-sm z-10"
          >
            <div className="h-7 w-7 rounded-xl bg-[#E5F3E8] text-[#527A5B] flex items-center justify-center font-bold shrink-0">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-[#242924] leading-tight">Faculty Mentor</p>
              <p className="text-[9px] text-[#5F6962] font-medium">Cohort Guide</p>
            </div>
          </motion.div>

          {/* Central Student Core (Mobile Center - Enhanced Prominence) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex sm:hidden absolute top-[150px] left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center p-3.5 rounded-3xl bg-[#527A5B] text-white shadow-xl border-2 border-white z-30 scale-105"
          >
            <div className="h-9 w-9 rounded-2xl bg-white/25 flex items-center justify-center font-bold mb-1 shadow-inner">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <p className="text-xs font-extrabold tracking-wide whitespace-nowrap">Student Core</p>
            <span className="text-[8px] font-mono bg-white/25 px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap">Focus Node</span>
          </motion.div>

          {/* Node 3: Mentoring Session (Mobile Top Right - Inset & Readable) */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex sm:hidden absolute top-3 right-2 items-center gap-2 px-3 py-2 rounded-2xl bg-[#EEF2EF] border border-[#DCE4DD] shadow-sm z-10"
          >
            <div className="h-7 w-7 rounded-xl bg-[#527A5B] text-white flex items-center justify-center font-bold shrink-0">
              <Mic className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-[#242924] leading-tight">10-Min Session</p>
              <p className="text-[9px] text-[#5F6962] font-medium">Voice Notes</p>
            </div>
          </motion.div>

          {/* Node 4: Commitments (Mobile Bottom Right - Inset & Readable) */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex sm:hidden absolute bottom-3 right-2 items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-[#DCE4DD] shadow-sm z-10"
          >
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-[#242924] leading-tight">Commitments</p>
              <p className="text-[9px] text-[#5F6962] font-medium">Action Items</p>
            </div>
          </motion.div>

          {/* Node 5: Progress Path (Mobile Bottom Left - Inset & Readable) */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex sm:hidden absolute bottom-3 left-2 items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-[#DCE4DD] shadow-sm z-10"
          >
            <div className="h-7 w-7 rounded-xl bg-[#E5F3E8] text-[#527A5B] flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-[#242924] leading-tight">Progress Path</p>
              <p className="text-[9px] text-[#5F6962] font-medium">Early Warning</p>
            </div>
          </motion.div>

        </div>

        {/* Bottom Footer Status Bar */}
        <div className="pt-3 border-t border-[#DCE4DD] flex items-center justify-between text-xs font-bold text-[#5F6962] shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#527A5B]" /> Connected Mentorship System
          </div>
          <span className="text-[#527A5B] font-mono text-[11px]">DevBuds</span>
        </div>

      </div>
    </div>
  );
}
