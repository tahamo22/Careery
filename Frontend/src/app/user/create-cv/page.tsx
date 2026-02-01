"use client";
import React, { useState, useEffect } from "react";
import CvFormStep from "@/components/cv/CvFormStep";
import CvPreview from "@/components/cv/CvPreview";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function CreateCvPage() {
  const [formData, _setFormData] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    objective: "",
    skills: [],
    educations: [],
    experiences: [],
    projects: [],
    custom_sections: [],
  });

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [cvId, setCvId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const setFormData = (updater: any) => {
    setIsDirty(true);
    if (typeof updater === "function") {
      _setFormData((prev: any) => updater(prev));
    } else {
      _setFormData(updater);
    }
  };

  useEffect(() => {
    const fetchExistingCV = async () => {
      const token = localStorage.getItem("access");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !Array.isArray(data) || data.length === 0 || isDirty)
          return;

        setCvId(data[0].id);
        _setFormData({
          first_name: data[0].first_name || "",
          last_name: data[0].last_name || "",
          email: data[0].email || "",
          phone: data[0].phone || "",
          location: data[0].location || "",
          linkedin: data[0].linkedin || "",
          website: data[0].website || "",
          objective: data[0].objective || "",
          skills: data[0].skills || [],
          educations: data[0].educations || [],
          experiences: data[0].experiences || [],
          projects: data[0].projects || [],
          custom_sections: data[0].custom_sections || [],
        });
      } catch (err) {
        console.error(" Failed to fetch existing CV:", err);
      }
    };

    fetchExistingCV();
  }, [isDirty]);

  const handleSaveAndNext = async (nextStep: number) => {
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        alert(" You must login first.");
        window.location.href = "/auth/login";
        return;
      }

      const url = cvId
        ? `${API_BASE_URL}/api/cvs/${cvId}/`
        : `${API_BASE_URL}/api/cvs/`;

      const res = await fetch(url, {
        method: cvId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setCvId(data.id);
        localStorage.setItem("cvData", JSON.stringify(data));

        if (nextStep <= 6) {
          setStep(nextStep);
        } else {
          window.location.href = "/user/create-cv/FinalCV";
        }
      } else {
        setMessage(" Error: " + JSON.stringify(data));
      }
    } catch (err: any) {
      setMessage(" Something went wrong: " + err.message);
    }
  };

  return (
    <main className="min-h-screen text-white flex flex-col bg-gradient-to-b from-[#020617] via-[#050726] to-[#020617]">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-between w-full px-4 sm:px-6 py-6 gap-6">

        {/* LEFT: FORM STEPS */}
        <div className="w-full lg:w-1/2 bg-black/30 border border-gray-700 rounded-xl p-4 sm:p-6 overflow-y-auto max-h-[85vh] shadow-lg">
          <CvFormStep
            step={step}
            setStep={setStep}
            formData={formData}
            setFormData={setFormData}
            handleSaveAndNext={handleSaveAndNext}
            setIsDirty={setIsDirty}
          />
          {message && <p className="mt-3 text-sm text-red-400">{message}</p>}
        </div>

        {/* RIGHT: LIVE CV PREVIEW */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div
            id="cv-preview"
            className="w-full max-w-[95%] sm:max-w-2xl lg:max-w-3xl bg-white rounded-xl shadow-xl border border-gray-200 p-4 sm:p-8"
          >
            <CvPreview data={formData} />
          </div>
        </div>

      </div>

      <Footer />
    </main>

  );
}
