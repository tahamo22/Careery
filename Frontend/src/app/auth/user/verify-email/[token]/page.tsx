// src/app/auth/user/verify-email/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/verify-email/${token}/`
        );

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(" Email verified successfully");
          setTimeout(() => {
            router.push("/auth/user/login");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired verification link.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center max-w-md w-full">
        {status === "loading" && (
          <p className="text-slate-300">{message}</p>
        )}

        {status === "success" && (
          <p className="text-green-400 font-medium">{message}</p>
        )}

        {status === "error" && (
          <p className="text-red-400 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
