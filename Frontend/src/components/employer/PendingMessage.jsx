"use client";

import { useRouter } from "next/navigation";

export default function PendingMessage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-[#0f0f0f] border border-gray-800 rounded-xl p-8 text-center shadow-lg">
        
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">
          Company Profile Under Review
        </h2>

        <p className="text-gray-400 text-sm leading-relaxed">
          Your company profile is currently under admin review.
        </p>

        <p className="mt-3 text-yellow-300 text-sm font-medium">
          You must complete all required company details before approval.
        </p>

        <button
          onClick={() => router.push("/employer/settings")}
          className="mt-6 px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-medium"
        >
          Go to Settings
        </button>
      </div>
    </div>
  );
}
