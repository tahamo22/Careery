"use client";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function Step4() {
  const router = useRouter();

  const finishOnboarding = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/api/settings/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_onboarded: true }),
      });
    } catch (err) {
      console.error("Failed to mark onboarding complete:", err);
    }

    router.push("/user/dashboard");
  };

  return (
    <section className="bg-[#0b0b0b] border border-gray-800 rounded-2xl shadow-lg p-10 text-center">
      <h2 className="text-3xl font-bold text-sky-400 mb-4">
        Setup Completed!
      </h2>
      <p className="text-gray-300 text-lg mb-8">
        You’ve successfully finished your onboarding.
        <br /> Let’s explore your dashboard.
      </p>
      <button
        onClick={finishOnboarding}
        className="bg-blue-600 hover:bg-blue-500 px-10 py-3 rounded-lg font-semibold text-white transition"
      >
        Go to Overview →
      </button>
    </section>
  );
}
