"use client";
import Image from "next/image";
import Link from "next/link";

export default function ResetSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-12">
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

      {/* Message */}
      <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
        Your Password Has Been Reset
      </h2>

      {/* Continue Button */}
      <button
        onClick={() => (window.location.href = "/auth/login")}
        className="w-[240px] py-3 bg-green-500 text-white font-semibold rounded-md shadow hover:bg-green-600 transition flex justify-center items-center gap-2"
      >
        Continue →
      </button>
    </div>
  );
}
