"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { HeroVisualComposition } from "./landing/HeroVisualComposition";
import { MentorshipJourneySection } from "./landing/MentorshipJourneySection";
import { PlatformCapabilitiesSection } from "./landing/PlatformCapabilitiesSection";
import { ProductShowcaseSection } from "./landing/ProductShowcaseSection";
import { ClosingCtaAndFooter } from "./landing/ClosingCtaAndFooter";

export function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-[#F6F8F6] text-[#242924] overflow-x-hidden font-sans selection:bg-[#527A5B]/20 selection:text-[#242924]">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#E5F3E8] via-[#F0F5F1] to-transparent opacity-70 blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#F6F8F6]/90 backdrop-blur-md border-b border-[#DCE4DD]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#527A5B] text-white font-extrabold shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#242924]">
              Dev<span className="text-[#527A5B]">Buds</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-[#5F6962] hover:text-[#242924] px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#527A5B] text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-sm hover:bg-[#42664A] active:scale-95 transition-all"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2EF] border border-[#DCE4DD] text-xs font-bold text-[#527A5B]">
              <Sparkles className="h-3.5 w-3.5" /> Ten-Minute Faculty Mentoring System
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#242924] leading-[1.08]">
              Every student deserves a mentor who <span className="text-[#527A5B]">remembers.</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#5F6962] font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Transform academic guidance into a premium, connected experience. Empower faculty with structured check-ins, voice-assisted notes, and early warning insights.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#527A5B] text-white px-6 py-3.5 text-sm font-bold shadow-md hover:bg-[#42664A] active:scale-95 transition-all"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#journey"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#DCE4DD] text-[#242924] px-6 py-3.5 text-sm font-bold shadow-2xs hover:bg-[#F0F5F1] transition-all"
              >
                Explore the Platform
              </a>
            </div>

            <div className="pt-6 border-t border-[#DCE4DD] flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-xs font-bold text-[#737D76]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#527A5B] shrink-0" /> Structured Registers
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#527A5B] shrink-0" /> Early Warning AI
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#527A5B] shrink-0" /> HOD Department Views
              </div>
            </div>
          </motion.div>

          {/* Right Hero Visual Composition: Sophisticated Mentorship Ecosystem */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <HeroVisualComposition />
          </motion.div>

        </div>
      </section>

      {/* The Immersive Mentorship Journey Section */}
      <MentorshipJourneySection />

      {/* Premium Platform Capabilities Showcase Section */}
      <PlatformCapabilitiesSection />

      {/* Product Experience Showcase Section */}
      <ProductShowcaseSection />

      {/* Closing CTA and Footer Section */}
      <ClosingCtaAndFooter />
    </div>
  );
}
