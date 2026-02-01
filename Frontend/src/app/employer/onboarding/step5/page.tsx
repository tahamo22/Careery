"use client";

import Button from "@/components/Button";
import OnboardingNavbar from "@/components/OnboardingNavbar";
import Link from "next/link";

export default function Step5Complete() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <OnboardingNavbar progress="100%" activeStep="Completed" />

      <main className="flex flex-col items-center justify-center flex-1 text-center px-4">
        <div className="bg-blue-600 rounded-full w-28 h-28 flex items-center justify-center mb-8">
          <span className="text-5xl">✔</span>
        </div>

        <h1 className="text-2xl font-bold mb-4">
          Congratulations, Your Profile is 100% Complete!
        </h1>

        <p className="text-gray-400 max-w-xl mb-10">
          Your company profile is now active. You can go to your dashboard or post a new job.
        </p>

        <div className="flex gap-4">
          <Link href="/employer/dashboard">
            <Button variant="secondary" className="!border-blue-500/40 hover:!border-blue-500">
              View Dashboard
            </Button>
          </Link>

          <Link href="/employer/jobs/post">
            <Button className="!bg-blue-600 hover:!bg-blue-700 !text-white">
              Post Job
            </Button>
          </Link>
        </div>
      </main>

      <footer className="w-full mt-16 py-4 text-center text-gray-500 text-sm border-t border-gray-700">
        © 2025 CareerBridge - Job Portal. All rights reserved
      </footer>
    </div>
  );
}
