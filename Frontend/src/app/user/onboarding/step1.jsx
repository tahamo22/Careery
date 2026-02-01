"use client";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";
import { User2, Camera } from "lucide-react";

export default function Step1({ next }) {
  const [fullName, setFullName] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [profilePreview, setProfilePreview] = useState(null); // صورة البروفايل
  const profileRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ 1. Fetch current data when step opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/settings/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        const u = data.user || {};

        setFullName(u.full_name || "");
        setExperience(u.experience || "");
        setEducation(u.education || "");

        if (u.profile_picture_url) {
          setProfilePreview(u.profile_picture_url);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ 2. Handle profile image upload + preview
  const handleUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (profilePreview) {
      try {
        URL.revokeObjectURL(profilePreview);
      } catch {}
    }

    setProfilePreview(url);
  };

  // ✅ 3. Save & update backend instantly
  const save = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setMessage(" Please login first.");
      return;
    }

    const fd = new FormData();
    fd.append("full_name", fullName);
    fd.append("experience", experience);
    fd.append("education", education);

    if (profileRef.current && profileRef.current.files && profileRef.current.files[0]) {
      fd.append("profile_picture", profileRef.current.files[0]);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(" Saved successfully!");
        next();
      } else {
        setMessage(" Failed: " + (data?.message || "Save error"));
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
          <User2 className="h-5 w-5 text-blue-400" />
        </span>
        <span>Personal Information</span>
      </h2>

      <div className="grid grid-cols-12 gap-10">
        {/* Profile Photo */}
        <div className="col-span-12 md:col-span-4 flex flex-col items-center">
          <div
            onClick={() => profileRef.current && profileRef.current.click()}
            className="w-48 h-48 rounded-full bg-[#111] border border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-sky-500 transition"
          >
            {profilePreview ? (
              <img
                src={profilePreview}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 text-center">
                <Camera className="h-6 w-6 mb-1" />
                <p className="text-sm">Upload Photo</p>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            ref={profileRef}
            onChange={handleUpload}
            className="hidden"
          />

          <p className="text-xs text-gray-500 mt-2">
            Recommended size: 400x400px
          </p>
        </div>

        {/* Right Form */}
        <div className="col-span-12 md:col-span-8 space-y-6">
          <div>
            <label className="text-sm text-gray-400">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full mt-1 bg-[#111] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Experience</label>
            <input
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 3 Years in Interior Design"
              className="w-full mt-1 bg-[#111] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Education</label>
            <input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. Bachelor's in Architecture"
              className="w-full mt-1 bg-[#111] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-10">
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
