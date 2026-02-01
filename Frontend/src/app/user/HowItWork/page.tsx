"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HowItWorkPage() {
  const router = useRouter();

  const goHome = () => {
    router.push("/");
  };

  const startOnboarding = () => {
    // 🚀 المستخدم يروح يبدأ خطوات الـ onboarding أولاً
    router.push("/user/onboarding");
  };

  return (
    <>
      {/* Navbar */}
      <header className="w-full h-[70px] bg-black text-white flex items-center px-8 shadow-md fixed top-0 left-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={goHome}>
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span className="text-lg font-bold">Careery</span>
        </div>
      </header>

      {/* How It Works Section */}
      <section className="h-screen pt-[90px] px-6 text-center bg-black text-white overflow-hidden">
        {/* Title */}
        <h2 className="text-6xl font-extrabold mb-6">
          How It <span className="text-blue-500">Works</span>
        </h2>
        <p className="text-gray-300 text-2xl mb-12 leading-relaxed max-w-4xl mx-auto">
          Start your journey to the perfect job in four simple steps. <br />
          Whether you need to create a new CV or already have one, we've got you covered!
        </p>

        {/* Steps */}
        <div className="flex justify-center gap-8 mb-12 flex-wrap">
          {/* Step 1 */}
          <div
            className="relative bg-[#111] border border-gray-800 rounded-2xl shadow-lg p-8 w-[320px] min-h-[240px] flex flex-col items-center cursor-pointer transition hover:shadow-2xl hover:scale-105"
            onClick={startOnboarding}
          >
            <div className="absolute -top-7 bg-blue-600 text-white font-bold rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-lg">01</div>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Build Your Profile</h3>
            <p className="text-gray-400 text-base">Complete your personal and professional info so we can match you to the best jobs.</p>
          </div>

          {/* Step 2 */}
          <div
            className="relative bg-[#111] border border-gray-800 rounded-2xl shadow-lg p-8 w-[320px] min-h-[240px] flex flex-col items-center cursor-pointer transition hover:shadow-2xl hover:scale-105"
            onClick={() => router.push("/user/upload-cv")}
          >
            <div className="absolute -top-7 bg-blue-600 text-white font-bold rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-lg">02</div>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">CV Analysis</h3>
            <p className="text-gray-400 text-base">Upload your CV and let our AI analyze it to show your strengths and improvement points.</p>
          </div>

          {/* Step 3 */}
          <div
            className="relative bg-[#111] border border-gray-800 rounded-2xl shadow-lg p-8 w-[320px] min-h-[240px] flex flex-col items-center cursor-pointer transition hover:shadow-2xl hover:scale-105"
            onClick={() => router.push("/user/find-job")}
          >
            <div className="absolute -top-7 bg-blue-600 text-white font-bold rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-lg">03</div>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Find Your Job</h3>
            <p className="text-gray-400 text-base">Let AI recommend job positions that fit your profile perfectly.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-6 justify-center">
          <button className="px-8 py-4 rounded-xl font-bold text-white text-lg bg-blue-600 shadow-lg hover:bg-blue-700 transition" onClick={startOnboarding}>
            Get Started →
          </button>
        </div>

        <p className="text-gray-500 text-sm mt-6">You can complete your profile anytime from Settings.</p>
      </section>
    </>
  );
}
