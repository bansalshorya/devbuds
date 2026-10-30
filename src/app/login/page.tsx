"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { homeFor } from "@/lib/roles";
import { Phone, KeyRound, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function LoginPage() {
  const inFlight = useRef(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) { inFlight.current = false; setBusy(false); setOpening(false); }
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    let navigating = false;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : res.status >= 500 ? "The sign-in service is unavailable. Please try again shortly." : "Could not log in. Please check your details.");
        return;
      }
      if (!["MENTOR", "STUDENT", "HOD"].includes(data.role)) throw new Error("Invalid login response");
      window.location.assign(homeFor(data.role));
      navigating = true;
      setOpening(true);
      return;
    } catch (error) {
      setError(error instanceof Error && error.name === "TimeoutError" ? "Sign-in took too long. Please try again shortly." : "Could not connect to sign-in. Please try again.");
    } finally {
      if (!navigating) { inFlight.current = false; setBusy(false); }
    }
  }

  function handleCopyDemo(number: string) {
    setMobile(number);
    setOtp("123456");
    setCopiedMobile(number);
    setTimeout(() => setCopiedMobile(null), 2000);
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8 bg-[#F6F8F6] text-[#242924]">
      {/* Background Decorative Floating Shapes (respects prefers-reduced-motion) */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 rounded-full bg-[#E5F3E8] opacity-60 blur-3xl pointer-events-none motion-safe:animate-pulse duration-1000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#E5F3E8] opacity-70 blur-3xl pointer-events-none motion-safe:animate-pulse duration-1000 delay-700" />

      {/* Main Container: Mobile-first stacked layout expanding to 2-column on desktop */}
      <div className="relative z-10 mx-auto w-full max-w-md lg:max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">

          {/* Left Column: Branding, Illustration & Value Prop */}
          <div className="lg:col-span-6 text-center lg:text-left space-y-4 lg:space-y-6 motion-safe:animate-fadeIn">
            <div className="mx-auto lg:mx-0 w-28 h-28 sm:w-32 sm:h-32 lg:w-48 lg:h-48 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-[#E5F3E8]/80 blur-lg opacity-75 motion-safe:animate-pulse" />
              <div className="relative w-full h-full rounded-2xl lg:rounded-3xl p-2.5 flex items-center justify-center bg-white/70 backdrop-blur-md border border-[#DCE4DD] shadow-md motion-safe:animate-[float_6s_ease-in-out_infinite]">
                <Image
                  src="/icons/mentor-illustration.svg"
                  alt="DevBuds Mentorship Illustration"
                  width={110}
                  height={110}
                  priority
                  className="object-contain drop-shadow-sm w-[100px] h-[100px] sm:w-[110px] sm:h-[110px] lg:w-[160px] lg:h-[160px]"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2EF] border border-[#DCE4DD] text-[11px] sm:text-xs font-bold text-[#527A5B]">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Ten-Minute Faculty Mentoring System
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-[#242924]">
                DevBuds <span className="text-[#527A5B]">Mentor</span>
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-[#5F6962] font-medium max-w-sm sm:max-w-md mx-auto lg:mx-0 leading-relaxed">
                Empowering faculty and academic leaders with streamlined check-ins, early warning analytics, and structured mentoring registers.
              </p>
            </div>

            <div className="hidden lg:grid grid-cols-3 gap-3 pt-2 text-left">
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-[#DCE4DD] shadow-xs space-y-1">
                <ShieldCheck className="h-4 w-4 text-[#527A5B]" />
                <p className="text-xs font-extrabold text-[#242924]">Secure Auth</p>
                <p className="text-[11px] text-[#5F6962]">JWT token cookies</p>
              </div>
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-[#DCE4DD] shadow-xs space-y-1">
                <CheckCircle2 className="h-4 w-4 text-[#527A5B]" />
                <p className="text-xs font-extrabold text-[#242924]">Quick Sync</p>
                <p className="text-[11px] text-[#5F6962]">Automated batch jobs</p>
              </div>
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-[#DCE4DD] shadow-xs space-y-1">
                <Users className="h-4 w-4 text-[#527A5B]" />
                <p className="text-xs font-extrabold text-[#242924]">Role Access</p>
                <p className="text-[11px] text-[#5F6962]">Faculty, HOD & Student</p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Form & Demo Accounts */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto space-y-4 sm:space-y-6 motion-safe:animate-fadeIn delay-150">
            <div className="bg-[#FFFFFF] border border-[#DCE4DD] rounded-3xl p-5 sm:p-7 lg:p-8 space-y-5 sm:space-y-6 shadow-2xl relative">

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#242924]">Sign in to portal</h2>
                <p className="text-xs text-[#5F6962] font-medium">Enter your registered mobile number and verification code.</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#242924] flex items-center gap-1.5 mb-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#527A5B]" />
                    Mobile number
                  </label>
                  <Input
                    required
                    disabled={busy}
                    inputMode="numeric"
                    placeholder="e.g. 9000000001"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="h-11 sm:h-12 rounded-xl text-sm bg-[#FFFFFF] border-[#DCE4DD] focus-visible:ring-2 focus-visible:ring-[#527A5B] text-[#242924] font-semibold px-4 placeholder:text-[#737D76] transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#242924] flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-[#527A5B]" />
                      OTP Verification Code
                    </label>
                    <span className="text-[11px] font-semibold text-[#527A5B]">Demo OTP: 123456</span>
                  </div>
                  <Input
                    required
                    disabled={busy}
                    inputMode="numeric"
                    placeholder="e.g. 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-11 sm:h-12 rounded-xl text-sm bg-[#FFFFFF] border-[#DCE4DD] focus-visible:ring-2 focus-visible:ring-[#527A5B] text-[#242924] font-semibold px-4 placeholder:text-[#737D76] transition-all"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-700 shadow-xs animate-shake">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="group relative flex h-11 sm:h-12 w-full items-center justify-center rounded-xl bg-[#527A5B] hover:bg-[#42664A] text-sm font-extrabold text-[#FFFFFF] shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 overflow-hidden"
                >
                  <span className="flex items-center gap-2 transition-transform group-hover:translate-x-0.5">
                    {opening ? "Opening your portal…" : busy ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Verifying credentials...
                      </span>
                    ) : (
                      <>
                        <span>Log in to portal</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Demo Accounts Panel */}
              <div className="rounded-2xl bg-[#EEF2EF] border border-[#DCE4DD] p-3.5 sm:p-4 text-xs text-[#5F6962] space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#242924] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#527A5B]" /> Quick Demo Access:
                  </p>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#DCE4DD] font-semibold text-[#527A5B]">Click row to fill</span>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  {[
                    { label: "Faculty Mentor", number: "9000000001", role: "Mentor" },
                    { label: "Department Head (HOD)", number: "9000000002", role: "HOD" },
                    { label: "Student Mentee", number: "9100000001", role: "Student" },
                  ].map((acc) => {
                    const isCopied = copiedMobile === acc.number;
                    return (
                      <div
                        key={acc.number}
                        onClick={() => handleCopyDemo(acc.number)}
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between bg-[#FFFFFF] px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-[#DCE4DD] hover:border-[#527A5B] hover:shadow-xs transition-all cursor-pointer group"
                      >
                        <div>
                          <p className="font-bold text-[#242924] group-hover:text-[#527A5B] transition-colors">{acc.label}</p>
                          <p className="text-[10px] text-[#5F6962]">Role: {acc.role} · OTP: 123456</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-xs text-[#527A5B] bg-[#EEF2EF] px-2 py-1 rounded-lg border border-[#DCE4DD]">
                            {acc.number}
                          </code>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${isCopied ? "bg-emerald-100 text-emerald-800" : "text-[#5F6962] opacity-0 group-hover:opacity-100"}`}>
                            {isCopied ? "Filled!" : "Fill"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
