"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function VerifyCompanyEmailPage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/auth/company/verify-email/${token}/`,
          { method: "GET" } // ✅ GET زي الباك
        );

        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  /* ===================== Loading ===================== */
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Verifying your company email...
      </div>
    );
  }

  /* ===================== Error ===================== */
  if (status === "error") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-lg bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-gray-800 rounded-xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-red-500">
            Verification Failed
          </h1>

          <p className="mt-3 text-gray-400 text-sm leading-relaxed">
            This verification link is invalid or expired.
          </p>

          <button
            onClick={() => router.replace("/auth/login")}
            className="mt-6 px-6 py-2 rounded-md bg-red-600 hover:bg-red-700 transition text-white text-sm font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* ===================== Success ===================== */
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-gray-800 rounded-xl p-8 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-green-500">
          Company email verified successfully
        </h1>

        <p className="mt-3 text-gray-400 text-sm leading-relaxed">
          Your company account has been activated.
          <br />
          You can now access all employer features.
        </p>

        <button
          onClick={() => router.replace("/employer/dashboard")}
          className="mt-6 px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-medium"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}
