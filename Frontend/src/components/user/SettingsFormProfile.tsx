"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function SettingsFormProfile() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [nationality, setNationality] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [marital, setMarital] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access");
      const res = await fetch(`${API_BASE_URL}/api/settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const u = data.user || {};

      setNationality(u.nationality || "");
      setDob(u.date_of_birth || "");
      setGender(u.gender || "");
      setMarital(u.marital_status || "");
      setBio(u.biography || "");
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const save = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${API_BASE_URL}/api/account-settings/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nationality,
          date_of_birth: dob,
          gender,
          marital_status: marital,
          biography: bio,
        }),
      });
      if (res.ok) {
        setMessage("✅ Saved successfully");
      } else {
        const err = await res.json();
        setMessage("❌ " + JSON.stringify(err));
      }
    } catch (e: any) {
      setMessage("⚠️ " + e.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Profile Information</h2>

      <div>
        <label className="text-sm">Nationality</label>
        <input
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="w-full mt-1 bg-[#0f0f0f] border border-gray-700 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm">Date of Birth</label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="w-full mt-1 bg-[#0f0f0f] border border-gray-700 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm">Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full mt-1 bg-[#0f0f0f] border border-gray-700 rounded px-3 py-2"
        >
          <option value="">Select...</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="text-sm">Marital Status</label>
        <select
          value={marital}
          onChange={(e) => setMarital(e.target.value)}
          className="w-full mt-1 bg-[#0f0f0f] border border-gray-700 rounded px-3 py-2"
        >
          <option value="">Select...</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
        </select>
      </div>

      <div>
        <label className="text-sm">Biography</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          className="w-full mt-1 bg-[#0f0f0f] border border-gray-700 rounded px-3 py-2"
          placeholder="Write down your biography..."
        />
      </div>

      <button
        onClick={save}
        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold"
      >
        Save Changes
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}
