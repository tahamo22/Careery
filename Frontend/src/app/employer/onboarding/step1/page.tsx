"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Button from "@/components/Button";
import OnboardingNavbar from "@/components/OnboardingNavbar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Step1CompanyInfo() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [about, setAbout] = useState("");

  // ✅ Load existing data
  useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/company-profiles/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        // DRF بيرجع Array
        const profile = Array.isArray(data) ? data[0] : data;

        if (!profile) return;

        setCompanyName(profile.company_name || "");
        setAbout(profile.company_description || "");

        if (profile.company_logo) {
          setLogoPreview(
            profile.company_logo.startsWith("http")
              ? profile.company_logo
              : API_BASE_URL + profile.company_logo
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchData();
}, []);


  // ✅ handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // ✅ save to backend
 const handleSave = async () => {
  const token = localStorage.getItem("access");
  if (!token) return alert("Please login first");

  const formData = new FormData();
  formData.append("company_name", companyName);
  formData.append("company_description", about);

  if (logoFile) {
    formData.append("company_logo", logoFile);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/company-profiles/`, {
      method: "POST", // ✅ دايمًا POST
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.ok) {
      window.location.href = "/employer/onboarding/step2";
    } else {
      const err = await res.json();
      console.error(err);
      alert("Failed to save company info");
    }
  } catch (e) {
    console.error(e);
    alert("Something went wrong");
  }
};

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <OnboardingNavbar activeStep="Company Info" progress="0%" />

      <main className="bg-black w-full max-w-5xl px-10 mt-8">
        <form className="space-y-6">
          <label className="border border-gray-700 hover:border-blue-500 focus-within:border-blue-500 transition rounded-md h-60 flex flex-col justify-center items-center text-center cursor-pointer bg-[#0b0b0b]">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="h-full w-full object-contain rounded-md"
              />
            ) : (
              <>
                <Image src="/Image 47.png" alt="upload" width={40} height={40} />
                <p className="mt-2 text-gray-400 text-sm">
                  Upload logo or banner <br />
                  <span className="text-xs text-gray-500">
                    Best size larger than 400px. Max 5MB.
                  </span>
                </p>
                <span className="mt-3 text-xs text-blue-500">
                  Click to upload
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <div>
            <label className="block mb-2 text-gray-300 text-sm">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              className="w-full px-4 py-2 rounded-md bg-black border border-gray-700 text-white
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-300 text-sm">About Us</label>
            <textarea
              rows={5}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Write about your company..."
              className="w-full px-4 py-2 rounded-md bg-black border border-gray-700 text-white
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition"
            />
          </div>

          <Button
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              handleSave();
            }}
            // ✅ لو Button بيدعم className هتبقى Blue زي Careery
            className="!bg-blue-600 hover:!bg-blue-700 !text-white"
          >
            Save & Next →
          </Button>
        </form>
      </main>
    </div>
  );
}
