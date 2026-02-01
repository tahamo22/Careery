"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { API_BASE_URL } from "@/lib/api";
import { useParams } from "next/navigation";
 import { getValidAccessToken } from "@/lib/auth";
import {
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  DollarSign,
  Building2,
} from "lucide-react";

export default function JobDetailsPage() {
  const { id: jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // ================= Fetch Job =================
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          setJob(null);
          return;
        }

        const data = await res.json();
        setJob(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) fetchJob();
  }, [jobId]);

  // ================= Check Saved =================
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token || !jobId) return;

    const checkSaved = async () => {
      const res = await fetch(`${API_BASE_URL}/api/saved-jobs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSaved(data.some((item) => item.job.id === Number(jobId)));
      }
    };

    checkSaved();
  }, [jobId]);

  // ================= Apply =================
  const handleApply = async () => {
    setApplying(true);
    setApplyMessage("");

    try {
      

  const token = await getValidAccessToken();
  if (!token) {
  setApplyMessage("You need to login first.");
  return;
              }


      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setApplyMessage(
        data.message || data.detail || "Application sent."
      );
    } catch {
      setApplyMessage("Server error.");
    } finally {
      setApplying(false);
    }
  };

  // ================= Save =================
  const handleSaveJob = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    setSaving(true);
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/save/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setSaved(data.saved);
    setSaving(false);
  };

  if (loading)
    return (
      <main className="min-h-screen bg-[#020617] text-white">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh] text-slate-400">
          Loading job details...
        </div>
        <Footer />
      </main>
    );

  if (!job)
    return (
      <main className="min-h-screen bg-[#020617] text-white">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          Job not found
        </div>
        <Footer />
      </main>
    );

  const company = job.company_profile || {};

  return (
    <main className="bg-[#020617] text-white min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mt-12 px-6">
        {/* LEFT */}
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-sky-300 mb-1">
            {job.title}
          </h1>
          <p className="text-slate-400 mb-6">
            at {company.company_name || "Company"}
          </p>

          {/* Existing Description (NOT removed) */}
          <p className="text-slate-300 mb-6">
            {job.description || "No job description available."}
          </p>

          {/* Requirements */}
          {job.requirements && (
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-sky-400 mb-2">
                Requirements
              </h2>
              <p className="text-slate-300 whitespace-pre-line">
                {job.requirements}
              </p>
            </section>
          )}

          {/* About Company */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-sky-400 mb-2">
              About the Company
            </h2>
            <p className="text-slate-300 mb-3">
              {company.company_description || "No company description."}
            </p>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>
                <b>Industry:</b>{" "}
                {company.industry_type || "Not specified"}
              </li>
              <li>
                <b>Team Size:</b>{" "}
                {company.team_size || "Not specified"}
              </li>
            </ul>
          </section>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">
          <div className="flex gap-3">
            <button
              onClick={handleSaveJob}
              className={`px-4 py-2 rounded ${
                saved ? "bg-yellow-500 text-black" : "bg-gray-700"
              }`}
            >
              {saved ? "★ Saved" : "☆ Save"}
            </button>

            <button
              onClick={handleApply}
              disabled={applying}
              className="bg-blue-600 px-5 py-2 rounded"
            >
              {applying ? "Applying..." : "Apply Now"}
            </button>
          </div>

          {applyMessage && (
            <p className="text-sm text-sky-300">{applyMessage}</p>
          )}

          {/* Job Overview */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h3 className="text-sky-400 font-semibold mb-3">
              Job Overview
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <MapPin size={16} /> {job.city || "—"} {job.country || ""}
              </li>
              <li className="flex gap-2">
                <Briefcase size={16} />{" "}
                {job.experience || "Not specified"}
              </li>
              <li className="flex gap-2">
                <GraduationCap size={16} />{" "}
                {job.education || "Not specified"}
              </li>
              <li className="flex gap-2">
                <DollarSign size={16} />{" "}
                {job.salary || "Not specified"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
