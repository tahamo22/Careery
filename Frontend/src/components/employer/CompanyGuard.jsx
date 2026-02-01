"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PendingMessage from "./PendingMessage";
import { API_BASE_URL } from "@/lib/api";

export default function CompanyGuard({ children }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState(null);

  useEffect(() => {
    const checkCompanyStatus = async () => {
      const token = localStorage.getItem("access");
      const userType = localStorage.getItem("user_type");

      if (!token || userType !== "company") {
        router.replace("/auth/company/login");
        return;
      }

      try {
        // 1️⃣ Company profile
        const profileRes = await fetch(
          `${API_BASE_URL}/api/company-profiles/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!profileRes.ok) {
          router.replace("/auth/company/login");
          return;
        }

        const data = await profileRes.json();

        if (!Array.isArray(data) || data.length === 0) {
          router.replace("/employer/settings");
          return;
        }

        const company = data[0];

        if (company.status === "pending") {
          setShowPending(true);
          setLoading(false);
          return;
        }

        if (company.status === "rejected") {
          router.replace("/employer/settings");
          return;
        }

        // 2️⃣ Permission check (approved + verified)
        const guardRes = await fetch(
          `${API_BASE_URL}/api/employer/dashboard/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (guardRes.status === 403) {
          const err = await guardRes.json();
          setBlockedMessage(
            err.detail || "Your company account is not active."
          );
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("CompanyGuard error:", err);
        router.replace("/auth/company/login");
      }
    };

    checkCompanyStatus();
  }, [router]);

  /* ===================== Loading ===================== */
  if (loading && !showPending && !blockedMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Checking company status...
      </div>
    );
  }

  /* ===================== Pending ===================== */
  if (showPending) {
    return <PendingMessage />;
  }

  /* ===================== Blocked ===================== */
  if (blockedMessage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-lg bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-gray-800 rounded-xl p-8 text-center shadow-lg">
          <h2 className="text-2xl font-semibold text-red-500">
            Account Restricted
          </h2>

          <p className="mt-4 text-gray-400 text-sm leading-relaxed">
            {blockedMessage}
          </p>

          {blockedMessage.toLowerCase().includes("verify") && (
            <p className="mt-3 text-blue-400 text-sm">
              Please check your email inbox and verify your company
              account.
            </p>
          )}

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

  /* ===================== Allowed ===================== */
  return <>{children}</>;
}
