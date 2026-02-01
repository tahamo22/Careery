"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface Step {
  key: string;
  label: string;
  icon: string;
}

export default function EmployerOnboardingNavbar({
  activeStep,
  progress,
}: {
  activeStep: string;
  progress: string;
}) {
  const steps: Step[] = [
    { key: "Company Info", label: "Company Info", icon: "ri-building-line" },
    { key: "Founding Info", label: "Founding Info", icon: "ri-lightbulb-line" },
    { key: "Social Media Profile", label: "Social Media", icon: "ri-share-line" },
    { key: "Contact", label: "Contact", icon: "ri-phone-line" },
    { key: "Completed", label: "Completed", icon: "ri-check-line" },
  ];

  return (
    <header className="w-full bg-black text-white flex items-center justify-between px-8 py-5 border-b border-gray-800 shadow-lg">
      {/* ===== Left: Logo + Title ===== */}
      <div className="flex items-center gap-3 cursor-pointer select-none">
        {/* ✅ اللوجو نفس الموجود في الموقع */}
        <Sparkles className="h-6 w-6 text-blue-500" />
        <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Careery 
        </span>
      </div>

      {/* ===== Center: Steps ===== */}
      <nav className="flex items-center gap-8">
        {steps.map((step) => (
          <div key={step.key} className="flex flex-col items-center">
            <i
              className={cn(
                `ri ${step.icon} text-xl`,
                activeStep === step.key ? "text-green-400" : "text-gray-500"
              )}
            />
            <span
              className={cn(
                "text-xs mt-1",
                activeStep === step.key
                  ? "text-green-400 font-semibold"
                  : "text-gray-400"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </nav>

      {/* ===== Right: Progress Bar ===== */}
      <div className="w-40 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
          style={{ width: progress }}
        ></div>
      </div>
    </header>
  );
}
