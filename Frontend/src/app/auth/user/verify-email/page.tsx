"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/verify-email/${token}/`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Verification failed");
        }
        setMessage(data.message || "Email verified successfully");
      })
      .catch((err) => {
        setError(true);
        setMessage(err.message || "Invalid or expired link");
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-6 rounded-lg border border-gray-700 text-center">
        {loading ? (
          <p>Verifying your email...</p>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">
              {error ? "Verification Failed" : "Email Verified"}
            </h2>

            <p className="text-gray-300 mb-6">{message}</p>

            <button
              onClick={() => router.push("/auth/user/login")}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
