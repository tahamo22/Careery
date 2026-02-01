"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Globe2 } from "lucide-react";

export default function Step2({ next, back }) {
  const [nationality, setNationality] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [marital, setMarital] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch existing data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) return;
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
      } catch (err) {
        console.error("Error loading profile info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ✅ Save & update instantly
  const save = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${API_BASE_URL}/api/account-settings/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        setMessage(" Saved successfully!");
        next();
      } else {
        const err = await res.json();
        setMessage(" Error: " + JSON.stringify(err));
      }
    } catch (err) {
      setMessage(" Error: " + err.message);
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <section className="bg-[#0b0b0b] border border-gray-800 rounded-2xl shadow-lg p-10">
      <h2 className="flex items-center gap-2 text-2xl font-bold mb-8 text-white">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/15 border border-blue-500/40">
          <Globe2 className="h-5 w-5 text-blue-400" />
        </span>
        <span>Profile Information</span>
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-sm text-gray-400">Nationality</label>
          <input
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Enter nationality"
            className="w-full mt-1 bg-[#111] border border-gray-700 rounded px-3 py-2 focus:border-sky-500 transition"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full mt-1 bg-[#111] border border-gray-700 rounded px-3 py-2 focus:border-sky-500 transition"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full mt-1 bg-[#111] border border-gray-700 rounded px-3 py-2"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">Marital Status</label>
          <select
            value={marital}
            onChange={(e) => setMarital(e.target.value)}
            className="w-full mt-1 bg-[#111] border border-gray-700 rounded px-3 py-2"
          >
            <option value="">Select Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm text-gray-400">Biography</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Write a short biography..."
          className="w-full mt-1 bg-[#111] border border-gray-700 rounded px-3 py-2 focus:border-sky-500 transition"
        />
      </div>

      <div className="flex justify-between mt-10">
        <button
          onClick={back}
          className="bg-gray-700 px-8 py-3 rounded-lg text-white"
        >
          ← Back
        </button>
        <button
          onClick={save}
          className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-lg font-semibold text-white transition"
        >
          Save & Continue →
        </button>
      </div>

      {message && (
        <p className="text-sm mt-4 text-center text-gray-300">{message}</p>
      )}
    </section>
  );
}
