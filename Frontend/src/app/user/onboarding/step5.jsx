"use client";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function Step5() {
  const router = useRouter();

  return (
    <div className="text-center py-20 space-y-6">
      <CheckCircle2 className="mx-auto mb-3 text-sky-400" size={56} />
      <h2 className="text-3xl font-bold text-sky-400">
        Onboarding Completed!
      </h2>
      <p className="text-gray-400">
        Your account has been successfully set up. You can now explore your
        dashboard and manage your profile anytime.
      </p>
      <button
        onClick={() => router.push("/user/dashboard")}
        className="bg-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-500 text-white transition"
      >
        Go to Dashboard →
      </button>
    </div>
  );
}
