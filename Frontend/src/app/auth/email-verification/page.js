"use client";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react"; // استيراد Suspense

// 1. فصلنا محتوى الصفحة في مكون لوحده
function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email"); 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Image
          src="/auth/login/logo.png"
          alt="logo"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="font-bold text-xl text-black">
          Careery
        </span>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-black mb-3">
        Email Verification
      </h2>

      {/* Description */}
      <p className="text-gray-700 text-center mb-8 max-w-md">
        We’ve sent a verification code to{" "}
        <span className="font-semibold">{email || "your email"}</span>. <br />
        Please enter the code below to verify your account.
      </p>

      {/* Form */}
      <form className="w-full max-w-md flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter verification code"
          required
          className="w-full px-4 py-3 rounded-md bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
        />

        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "/auth/reset-password";
          }}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-md shadow hover:bg-green-600 transition"
        >
          Verify my account →
        </button>
      </form>

      {/* Footer Links */}
      <p className="mt-6 text-gray-600 text-sm">
        Didn’t receive a code yet?{" "}
        <Link href="#" className="text-green-600 font-medium hover:underline">
          Send again
        </Link>
      </p>
    </div>
  );
}

// 2. المكون الأساسي اللي Next.js بينادي عليه وبنلفه بـ Suspense
export default function EmailVerification() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <EmailVerificationContent />
    </Suspense>
  );
}