"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserOnboardingNavbar from "@/components/user/OnboardingNavbar";
import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";
import Step4 from "./step4";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function UserOnboardingPage() {
  const [step, setStep] = useState(1);

  // ⬇️ مهمين جدًا
  const [checkingCV, setCheckingCV] = useState(true);
  const router = useRouter();

  // ✅ حساب البروجريس
  const progress = `${(step / 4) * 100}%`;

  const next = () => setStep((prev) => Math.min(prev + 1, 4));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  // ==================================================
  // 🔐 Check: هل اليوزر عنده CV ولا لأ؟
  // ==================================================
  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const checkCV = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // مفيش CV → يوزر جديد
          setCheckingCV(false);
          return;
        }

        const data = await res.json();

        // ✅ لو عنده CV بالفعل → على الداشبورد فورًا
        if (Array.isArray(data) && data.length > 0) {
          router.replace("/user/dashboard");
          return;
        }

        // غير كده → onboarding عادي
        setCheckingCV(false);
      } catch (error) {
        console.error("Error checking CV:", error);
        setCheckingCV(false);
      }
    };

    checkCV();
  }, [router]);

  // ==================================================
  // ⏳ أثناء الفحص – منرندرش حاجة
  // ==================================================
  if (checkingCV) {
    return (
      <main className="bg-black min-h-screen flex items-center justify-center text-gray-400">
        Checking your profile...
      </main>
    );
  }

  // ==================================================
  // 🧩 Onboarding Steps (يوزر جديد فقط)
  // ==================================================
  return (
    <main className="bg-black min-h-screen text-white">
      <UserOnboardingNavbar
        activeStep={
          step === 1
            ? "Personal Info"
            : step === 2
            ? "Profile Info"
            : step === 3
            ? "Social Links"
            : "Completed"
        }
        progress={progress}
        setStep={setStep}
      />

      <div className="max-w-5xl mx-auto py-10 px-6">
        {step === 1 && <Step1 next={next} />}
        {step === 2 && <Step2 next={next} back={back} />}
        {step === 3 && <Step3 next={next} back={back} />}
        {step === 4 && <Step4 />}
      </div>
    </main>
  );
}
