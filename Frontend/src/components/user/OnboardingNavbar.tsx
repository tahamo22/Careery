"use client";

import { Sparkles } from "lucide-react";

type StepKey = "Personal Info" | "Profile Info" | "Social Links" | "Completed";

type Props = {
  activeStep?: StepKey;
  progress?: string; // مثال: "25%"
  setStep?: (step: number) => void; // جاي من صفحة /user/onboarding
};

export default function UserOnboardingNavbar({
  activeStep = "Personal Info",
  progress = "0%",
  setStep,
}: Props) {
  const steps: { key: StepKey; label: string; step: number }[] = [
    { key: "Personal Info", label: "Personal Info", step: 1 },
    { key: "Profile Info", label: "Profile Info", step: 2 },
    { key: "Social Links", label: "Social Links", step: 3 },
    { key: "Completed", label: "Completed", step: 4 },
  ];

  return (
    <header className="w-full flex flex-col border-b border-slate-800 bg-black text-white shadow-lg">
      {/* ===== Top Bar: Logo ===== */}
      <div className="w-full flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-sky-400" />
          <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
            Careery
          </span>
        </div>
      </div>

      {/* ===== Steps Tabs (كليكابِل) ===== */}
      <nav className="flex justify-center gap-4 md:gap-6 px-4 pb-4">
        {steps.map((step) => {
          const isActive = activeStep === step.key;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => setStep && setStep(step.step)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer
              ${
                isActive
                  ? "bg-sky-600 text-white shadow-md"
                  : "bg-[#111318] text-slate-300 hover:bg-[#151a23] hover:text-white"
              }`}
            >
              {step.label}
            </button>
          );
        })}
      </nav>

      {/* ===== Progress Bar (أزرق) ===== */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 transition-all duration-300"
          style={{ width: progress }}
        />
      </div>
    </header>
  );
}
