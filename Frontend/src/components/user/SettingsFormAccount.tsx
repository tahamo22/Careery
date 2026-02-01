"use client";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function SettingsFormAccount() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const handlePasswordChange = async () => {
    if (newPassword !== confirm) {
      setMessage("❌ Passwords do not match");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) return setMessage("⚠️ Not logged in!");

    try {
      const res = await fetch(`${API_BASE_URL}/api/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (res.ok) {
        setMessage("✅ Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirm("");
      } else {
        const err = await res.json();
        setMessage("❌ Error: " + JSON.stringify(err));
      }
    } catch (err: any) {
      setMessage("⚠️ " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Change Password</h2>

      <div>
        <label className="block text-sm text-gray-400">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400">Confirm New Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2"
        />
      </div>

      <button
        onClick={handlePasswordChange}
        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold"
      >
        Update Password
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}
