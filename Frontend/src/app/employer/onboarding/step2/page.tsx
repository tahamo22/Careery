"use client";

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import OnboardingNavbar from "@/components/OnboardingNavbar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Step2FoundingInfo() {
  const [organizationType, setOrganizationType] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [year, setYear] = useState("");
  const [website, setWebsite] = useState("");
  const [vision, setVision] = useState("");
  const [profileId, setProfileId] = useState<number | null>(null);

  // ================= Load existing profile =================
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access");
      if (!token) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/company-public-profile/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;

        const data = await res.json();

        // ✅ DRF بيرجع Array
        const profile = Array.isArray(data) ? data[0] : null;
        if (!profile) return;

        setProfileId(profile.id);
        setOrganizationType(profile.organization_type || "");
        setIndustryType(profile.industry_type || "");
        setTeamSize(
          profile.team_size !== null ? profile.team_size.toString() : ""
        );
        setYear(
          profile.year_of_establishment !== null
            ? profile.year_of_establishment.toString()
            : ""
        );
        setWebsite(profile.company_website || "");
        setVision(profile.vision || "");
      } catch (err) {
        console.error("Failed to fetch founding info:", err);
      }
    };

    fetchProfile();
  }, []);

  // ================= Save =================
  const handleSave = async () => {
    const token = localStorage.getItem("access");
    if (!token) return alert("Please login first");

    const formData = new FormData();
    formData.append("organization_type", organizationType);
    formData.append("industry_type", industryType);
    formData.append("team_size", teamSize);
    formData.append("year_of_establishment", year);
    formData.append("company_website", website);
    formData.append("vision", vision);

    const method = profileId ? "PATCH" : "POST";
    const url = profileId
      ? `${API_BASE_URL}/api/company-public-profile/${profileId}/`
      : `${API_BASE_URL}/api/company-public-profile/`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        window.location.href = "/employer/onboarding/step3";
      } else {
        const err = await res.text();
        console.error("Backend error:", err);
        alert("Failed to save founding info");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const inputClass =
    "w-full px-4 py-2 rounded-md bg-black border border-gray-700 text-white " +
    "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <OnboardingNavbar activeStep="Founding Info" progress="25%" />

      <main className="bg-black w-full max-w-5xl px-10 mt-10">
        <form className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <input
              className={inputClass}
              placeholder="Organization Type"
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Industry Type"
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
            />
            <input
              type="number"
              className={inputClass}
              placeholder="Team Size"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <input
              type="number"
              className={inputClass}
              placeholder="Year of Establishment (e.g. 2020)"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <input
              type="url"
              className={inputClass}
              placeholder="Company Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <textarea
            rows={5}
            className={inputClass}
            placeholder="Company Vision"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
          />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                (window.location.href = "/employer/onboarding/step1")
              }
            >
              ← Previous
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white"
            >
              Save & Next →
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
