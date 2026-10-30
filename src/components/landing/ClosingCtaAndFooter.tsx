"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Sparkles, ArrowRight, GraduationCap, CheckCircle2 } from "lucide-react";

export function ClosingCtaAndFooter() {
  return (
    <>
      {/* ================= CLOSING CTA ================= */}
      <section className="py-24 px-4 sm:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="neumo-card p-10 sm:p-20 bg-gradient-to-br from-white via-[#F0F5F1] to-[#E5F3E8] border-[#DCE4DD] shadow-2xl relative overflow-hidden text-center sm:text-left grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#527A5B]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E5F3E8]/80 rounded-full blur-2xl pointer-events-none" />

          <div className="lg:col-span-8 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE4DD] text-xs font-bold text-[#527A5B] shadow-2xs mx-auto sm:mx-0">
              <Sparkles className="h-3.5 w-3.5" /> Transform Academic Guidance
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#242924] leading-[1.08]">
              Make every mentoring conversation <span className="text-[#527A5B]">count.</span>
            </h2>

            <p className="text-base sm:text-lg text-[#5F6962] font-medium max-w-2xl leading-relaxed">
              Empower faculty with structured student guidance, consistent follow-ups, and early warning insights that drive meaningful academic progress.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-6 text-xs font-bold text-[#737D76]">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#527A5B]" /> 10-Minute Check-ins</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#527A5B]" /> Automated Reminders</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#527A5B]" /> Department Insights</span>
            </div>
          </div>

          <div className="lg:col-span-4 relative z-10 flex flex-col items-center sm:items-start justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#527A5B] text-white px-8 py-4 text-sm font-bold shadow-md hover:bg-[#42664A] active:scale-95 transition-all w-full sm:w-auto justify-center"
            >
              Get Started Now <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs text-[#737D76] font-medium">Secure sign-in for faculty &amp; students</p>
          </div>
        </motion.div>
      </section>

      {/* ================= PROFESSIONAL FOOTER ================= */}
      <footer className="border-t border-[#DCE4DD] bg-[#F6F8F6] py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">

          {/* Brand & Descriptor */}
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#527A5B] text-white font-extrabold shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#242924]">
                Dev<span className="text-[#527A5B]">Buds</span>
              </span>
            </div>
            <p className="text-xs text-[#5F6962] font-semibold">Ten-Minute Faculty Mentoring System</p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-[#5F6962]">
            <a href="#journey" className="hover:text-[#242924] transition-colors">Mentorship Journey</a>
            <Link href="/automations" className="hover:text-[#242924] transition-colors">Automation Hub</Link>
            <Link href="/department" className="hover:text-[#242924] transition-colors">HOD Portal</Link>
            <Link href="/mentor" className="hover:text-[#242924] transition-colors">Mentor Portal</Link>
            <Link href="/student" className="hover:text-[#242924] transition-colors">Student Portal</Link>
            <Link href="/login" className="text-[#527A5B] hover:underline font-extrabold">Sign In</Link>
          </div>

          {/* Copyright */}
          <div className="text-xs text-[#737D76] font-medium space-y-1">
            <p>© {new Date().getFullYear()} DevBuds. All rights reserved.</p>
            <p className="text-[10px]">Secure institutional mentoring platform.</p>
          </div>

        </div>
      </footer>
    </>
  );
}
