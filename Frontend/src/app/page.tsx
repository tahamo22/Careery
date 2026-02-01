// src/app/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { FinalCTASection } from "@/components/FinalCTASection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-white font-semibold">
      {/* ====== HEADER ====== */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#020617]/90 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-sky-400" />
            <span className="text-lg sm:text-xl font-bold">Careery</span>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#howitworks"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              How It Works
            </a>
          </nav>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="relative pt-28 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#020617] via-[#050726] to-[#020617]">
        {/* خلفيات نيون خفيفة */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 sm:w-80 md:w-96 h-72 sm:h-80 md:h-96 bg-sky-500/25 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-80 md:w-96 h-72 sm:h-80 md:h-96 bg-indigo-500/25 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 sm:mb-8 rounded-full bg-slate-900/70 text-sky-300 text-xs sm:text-sm font-medium border border-sky-500/40 shadow-sm shadow-sky-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Job Matching</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-balance">
            Connect talent with opportunity using{" "}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              AI intelligence
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed text-pretty">
            Create and analyze your CV with AI, get personalized job
            recommendations, or find the perfect candidates for your
            company—all in one intelligent platform.
          </p>

          {/* CTA BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full max-w-xl mx-auto">
            {/* زر إنشاء السيرة الذاتية */}
            <Link href="/auth/user/login" className="group w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 gap-2 flex items-center justify-center
                           cursor-pointer bg-sky-600 hover:bg-sky-500
                           shadow-lg shadow-sky-600/40"
              >
                <FileText className="h-5 w-5" />
                <span>Create Your CV</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {/* زر الشركة */}
            <Link href="/auth/company/login" className="group w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 gap-2 flex items-center justify-center
                           cursor-pointer rounded-full
                           border border-blue-400/70 bg-slate-900/80
                           text-blue-300 font-semibold
                           shadow-md shadow-blue-900/40
                           hover:bg-slate-800 hover:text-blue-200 hover:border-blue-300
                           transition-all"
              >
                <Briefcase className="h-5 w-5" />
                <span>Find the Right Talent</span>
              </Button>
            </Link>
          </div>

          {/* HERO IMAGE */}
          <div className="relative max-w-5xl mx-auto">
            <div className="aspect-[16/9] rounded-[20px] md:rounded-[24px] border border-white/10 bg-slate-900/70 backdrop-blur-sm overflow-hidden shadow-[0_0_60px_rgba(37,99,235,0.55)]">
              <img
                src="/modern-ai-job-platform-dashboard-showing-cv-analys.jpg"
                alt="AI Job Platform Dashboard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES / HOW IT WORKS / CTA ====== */}
      <section id="features" className="bg-[#020617] px-4 sm:px-6 lg:px-8">
        <FeaturesSection />
      </section>

      <section id="howitworks" className="bg-[#020617] px-4 sm:px-6 lg:px-8">
        <HowItWorksSection />
      </section>

      <section className="bg-[#020617] px-4 sm:px-6 lg:px-8 pb-16">
        <FinalCTASection />
      </section>

      
    </main>
  );
}
