"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/employer/Sidebar";
import MainNavbar from "@/components/employer/MainNavbar";
import Link from "next/link";
import CompanyGuard from "@/components/employer/CompanyGuard";


// Lucide Icons
import {
  Briefcase,
  Heart,
  Users,
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";



export default function EmployerOverview() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [savedCount, setSavedCount] = useState(0);


  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      try {
        // Company profile
        const profileRes = await fetch(
          `${API_BASE_URL}/api/company-profiles/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const profileData = await profileRes.json();
        if (Array.isArray(profileData) && profileData.length > 0) {
          setCompany(profileData[0]);
        }

        // Jobs
        const jobsRes = await fetch(`${API_BASE_URL}/api/jobs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const jobsData = await jobsRes.json();
        if (Array.isArray(jobsData)) {
          setJobs(jobsData);
        }
        // ===== Dashboard Stats =====
const statsRes = await fetch(
  `${API_BASE_URL}/api/employer/dashboard/`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

if (statsRes.ok) {
  const statsData = await statsRes.json();
  setSavedCount(statsData.saved_candidates || 0);
}

      } catch (err) {
        console.error("Error loading overview:", err);
      }
    };

    fetchData();
  }, []);

  // ================= Toggle Expire =================
  const handleToggleStatus = async (jobId, isExpired) => {
    if (!token) return alert("Please login first.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_expired: !isExpired }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, is_expired: !isExpired }
              : job
          )
        );
      } else {
        alert("Failed to update job status.");
      }
    } catch (error) {
      console.error("Error toggling job status:", error);
    }
  };

  // ================= Delete Job =================
  const handleDeleteJob = async (jobId) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok || res.status === 204) {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
      } else {
        alert("Failed to delete job.");
      }
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  const activeJobs = jobs.filter((j) => !j.is_expired).length;

  return (
     <CompanyGuard>
    <div className="min-h-screen bg-black text-white flex flex-col">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* ===== Company Info Card ===== */}
          {company && (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 mb-10 flex items-center gap-6">
              {/* Avatar */}
              {company.company_logo ? (
                <img
                  src={
                    company.company_logo.startsWith("http")
                      ? company.company_logo
                      : `${API_BASE_URL}${company.company_logo}`
                  }
                  alt="Company Logo"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">
                  {company.company_name
                    ? company.company_name.charAt(0).toUpperCase()
                    : "C"}
                </div>
              )}

              {/* Info */}
              <div>
                <h2 className="text-xl font-semibold">
                  {company.company_name || "Company"}
                </h2>
                <p className="text-gray-400 text-sm">
                  Employer Dashboard
                </p>
              </div>
            </div>
          )}

          {/* Subtitle */}
          <div className="mb-10">
            <p className="text-gray-400 text-sm">
              Here is your daily activities and applications
            </p>
          </div>

          {/* ===== STATS ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <Link
              href="/employer/jobs"
              className="flex items-center justify-between bg-[#111] border border-gray-800 text-white p-6 rounded-xl hover:scale-[1.02] transition"
            >
              <div>
                <p className="text-3xl font-bold">{activeJobs}</p>
                <p className="text-gray-600 text-sm">Open Jobs</p>
              </div>
              <Briefcase size={32} className="text-blue-400" />
            </Link>

            <Link
              href="/employer/saved"
              className="flex items-center justify-between bg-[#111] border border-gray-800 text-white p-6 rounded-xl hover:scale-[1.02] transition"

            >
              <div>
                <p className="text-3xl font-bold">{savedCount}</p>
                <p className="text-gray-600 text-sm">
                  Saved Candidates
                </p>
              </div>
              <Heart size={32} className="text-blue-400" />
            </Link>
          </div>

          {/* ===== RECENT JOBS ===== */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Recently Posted Jobs
            </h3>
            <Link
              href="/employer/jobs"
              className="text-blue-400 hover:underline text-sm"
            >
              View all →
            </Link>
          </div>

          {/* TABLE HEADER */}
          <div className="grid grid-cols-4 bg-[#1c1c1c] p-3 rounded-t-lg text-gray-400 text-sm border border-gray-800">
            <span>JOBS</span>
            <span>STATUS</span>
            <span>APPLICATIONS</span>
            <span>ACTIONS</span>
          </div>

          {/* JOB LIST */}
          <div className="border border-t-0 border-gray-800 rounded-b-lg divide-y divide-gray-800">
            {jobs.slice(0, 5).map((job, i) => (
              <div
                key={job.id}
                className="grid grid-cols-4 items-center p-4 hover:bg-[#111] transition relative"
              >
                {/* Job */}
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {job.job_type || "Full Time"} •{" "}
                    {job.expiration_date
                      ? `${Math.ceil(
                          (new Date(job.expiration_date) -
                            new Date()) /
                            (1000 * 60 * 60 * 24)
                        )} days remaining`
                      : "No expiry date"}
                  </p>
                </div>

                {/* Status */}
                <div>
                  {job.is_expired ? (
                    <span className="text-red-400 flex items-center gap-1 text-sm">
                      <XCircle size={16} /> Expired
                    </span>
                  ) : (
                    <span className="text-blue-400 flex items-center gap-1 text-sm">
                      <CheckCircle size={16} /> Active
                    </span>
                  )}
                </div>

                {/* Applications */}
                <div className="flex items-center gap-2 text-gray-400">
                  <Users size={18} className="text-blue-400" />
                  <span>
                    {job.applications_count || 0} Applications
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between relative">
                  <Link
                    href={`/employer/jobs/${job.id}/applications`}
                    className="px-4 py-2 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                   View Applications
                  </Link>


                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === i ? null : i)
                    }
                    className="text-gray-400 hover:text-white px-2"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {menuOpen === i && (
                    <div className="absolute right-0 top-10 w-56 bg-[#1c1c1c] border border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm"
                        onClick={() =>
                          alert(
                            "Promote Job feature coming soon!"
                          )
                        }
                      >
                        Promote Job
                      </button>

                      <Link
                        href={`/employer/jobs/viewdetails?id=${job.id}`}
                        className="block px-4 py-2 hover:bg-gray-700 text-sm"
                      >
                        View Details
                      </Link>

                      <Link
                        href={`/employer/jobs/post?edit=${job.id}`}
                        className="block px-4 py-2 hover:bg-gray-700 text-sm"
                      >
                        Edit Job
                      </Link>

                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-blue-400 text-sm"
                        onClick={() =>
                          handleToggleStatus(
                            job.id,
                            job.is_expired
                          )
                        }
                      >
                        {job.is_expired
                          ? "Make Active"
                          : "Mark as Expired"}
                      </button>

                      <button
                        className="w-full text-left px-4 py-2 hover:bg-red-600 text-red-400 text-sm border-t border-gray-700"
                        onClick={() =>
                          handleDeleteJob(job.id)
                        }
                      >
                        Delete Job
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No jobs posted yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </CompanyGuard>
  );
}
