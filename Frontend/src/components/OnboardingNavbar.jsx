"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function OnboardingNavbar({
  activeStep = "Company Info",
  progress = "0%",
}) {
  const steps = [
    {
      key: "Company Info",
      label: "Company Info",
      path: "/employer/onboarding/step1",
      icon: "ri-building-line",
    },
    {
      key: "Founding Info",
      label: "Founding Info",
      path: "/employer/onboarding/step2",
      icon: "ri-lightbulb-line",
    },
    {
      key: "Social Media Profile",
      label: "Social Media Profile",
      path: "/employer/onboarding/step4",
      icon: "ri-share-line",
    },
    {
      key: "Contact",
      label: "Contact",
      path: "/employer/onboarding/step3",
      icon: "ri-phone-line",
    },
    {
      key: "Completed",
      label: "Completed",
      path: "/employer/onboarding/step5",
      icon: "ri-check-line",
    },
  ];

  return (
    <header className="w-full flex flex-col border-b border-gray-800 bg-black text-white shadow-lg">
      {/* ===== Top Bar: Logo + Title ===== */}
      <div className="w-full flex justify-between items-center px-10 py-5">
        <div className="flex items-center gap-3 cursor-pointer select-none">
          {/* Logo Icon */}
          <Sparkles className="h-6 w-6 text-sky-400" />
          {/* Brand Name */}
          <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
            Careery Employer
          </span>
        </div>
      </div>

      {/* ===== Steps Navigation ===== */}
      <nav className="flex justify-center gap-12 px-10 pb-3">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.path}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md transition ${
              activeStep === step.key
                ? "text-sky-400 font-semibold"
                : "text-gray-400 hover:text-sky-300"
            }`}
          >
            <i className={step.icon}></i>
            <span>{step.label}</span>
          </Link>
        ))}
      </nav>

      {/* ===== Progress Bar (New Style) ===== */}
      <div className="px-10 pb-4">
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
          <div
            className="h-full bg-sky-500 transition-all duration-500"
            style={{ width: progress }}
          />
        </div>
      </div>
    </header>
  );
}
