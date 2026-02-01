"use client";

import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

type CV = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  objective?: string;
};

export default function SettingsFormPersonal() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* ================= USER FIELDS ================= */
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);

  /* ================= CV FIELDS ================= */
  const [cv, setCv] = useState<CV>({});

  /* ================= GET PERSONAL SETTINGS ================= */
  const fetchPersonal = async () => {
    try {
      const token = localStorage.getItem("access");

      const res = await fetch(
        `${API_BASE_URL}/api/personal-settings/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch personal settings");

      const data = await res.json();

      /* ---- USER ---- */
      setFullName(data.full_name || "");
      setHeadline(data.headline || "");
      setExperience(data.experience || "");
      setEducation(data.education || "");

      if (data.profile_picture_url) {
        setProfilePreview(data.profile_picture_url);
      } else {
        setProfilePreview(null);
      }

      /* ---- CV ---- */
      setCv({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        linkedin: data.linkedin || "",
        objective: data.objective || "",
      });
    } catch (e: any) {
      setMessage(" " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  /* ================= IMAGE PICK ================= */
  const onChooseProfile = () => profileFileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview مؤقت
    setProfilePreview(URL.createObjectURL(file));
  };

  /* ================= SAVE ================= */
  const save = async () => {
    try {
      setSaving(true);
      setMessage("");

      const token = localStorage.getItem("access");
      const fd = new FormData();

      /* ---- USER ---- */
      fd.append("full_name", fullName);
      fd.append("headline", headline);
      fd.append("experience", experience);
      fd.append("education", education);

      if (profileFileRef.current?.files?.[0]) {
        fd.append("profile_picture", profileFileRef.current.files[0]);
      }

      /* ---- CV ---- */
      fd.append("first_name", cv.first_name || "");
      fd.append("last_name", cv.last_name || "");
      fd.append("email", cv.email || "");
      fd.append("phone", cv.phone || "");
      fd.append("location", cv.location || "");
      fd.append("linkedin", cv.linkedin || "");
      fd.append("objective", cv.objective || "");

      const res = await fetch(
        `${API_BASE_URL}/api/personal-settings/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message || "Save failed");
      }

      /* 🔥 المهم: نجيب الداتا من السيرفر بعد الحفظ */
      await fetchPersonal();

      setMessage(" Saved successfully");
    } catch (e: any) {
      setMessage(" " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-300">Loading...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-sky-300">
        Basic Information
      </h3>

      <div className="grid grid-cols-12 gap-6">
        {/* ===== Profile Picture ===== */}
        <div className="col-span-12 md:col-span-4">
          <div className="border border-slate-800 rounded-xl p-4 h-full flex flex-col items-center justify-center">
            <div
              onClick={onChooseProfile}
              className="w-full h-48 bg-[#020617] border border-dashed border-slate-700 rounded-xl flex items-center justify-center cursor-pointer"
            >
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="profile"
                  className="max-h-44 rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <div className="mb-2 text-2xl text-sky-400">⬆️</div>
                  <div className="text-sky-300 font-medium">
                    Browse photo or drop here
                  </div>
                  <div className="text-xs text-slate-400">
                    A photo larger than 400px works best. Max 5MB.
                  </div>
                </div>
              )}
            </div>
            <input
              ref={profileFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        </div>

        {/* ===== FORM ===== */}
        <div className="col-span-12 md:col-span-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="bg-[#020617] border border-slate-700 rounded px-3 py-2"
            />
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Title / Headline"
              className="bg-[#020617] border border-slate-700 rounded px-3 py-2"
            />
            <input
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Experience"
              className="bg-[#020617] border border-slate-700 rounded px-3 py-2"
            />
            <input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Education"
              className="bg-[#020617] border border-slate-700 rounded px-3 py-2"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-6 py-2 rounded font-semibold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {message && <div className="text-sm">{message}</div>}
        </div>
      </div>
    </div>
  );
}
