"use client";
import { useState } from "react";
import Image from "next/image";

export default function ResetPass() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError(" Please fill in both fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(" Passwords do not match.");
      return;
    }

    // لو الباسوردين متطابقين
    setError(""); 
    window.location.href = "/auth/reset-success"; // يدخل صفحة النجاح
  };

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
      <h2 className="text-3xl font-bold text-black mb-3">Reset password</h2>
      <p className="text-gray-600 mb-6">
        Your new password must be different from previous passwords.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-md bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-md bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Error message */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-md shadow hover:bg-green-600 transition"
        >
          Reset Password →
        </button>
      </form>
    </div>
  );
}
