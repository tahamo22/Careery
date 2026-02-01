"use client";

import Sidebar from "@/components/employer/Sidebar";
import MainNavbar from "@/components/employer/MainNavbar";
import { useState, useEffect } from "react";
import Link from "next/link";
import CompanyGuard from "@/components/employer/CompanyGuard";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// 🔵 لون اللوجو الأزرق
const BRAND_BLUE = "#3B82F6";


export default function MyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(null); // job.id أو null

  // ================= FETCH JOBS =================
  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) setJobs(data);
        else setError(data.error || "Failed to load jobs.");
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Server connection failed.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // ================= EXPIRE =================
  // ================= EXPIRE (✅ الحل الصح) =================
const handleExpire = async (jobId) => {
  const token = localStorage.getItem("access");
  if (!token) return;

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/jobs/${jobId}/expire/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.ok) {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: "expired" }
            : job
        )
      );
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Failed to expire job: ${err.detail || "Error"}`);
    }
  } catch (e) {
    console.error(e);
    alert("Server error while expiring job.");
  }
};



  // ================= PROMOTE (✅ الحل الصح) =================
  const handlePromote = async (jobId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/jobs/${jobId}/reactivate/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        // نحدّث الليست محليًا
        const future = new Date();
        future.setDate(future.getDate() + 30);

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, status: "active" }
              : job
          )
        );
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to promote job: ${err.detail || "Error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Server error while promoting job.");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (jobId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 204 || res.ok) {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to delete job: ${JSON.stringify(err)}`);
      }
    } catch (e) {
      console.error(e);
      alert("Server error while deleting job.");
    }
  };

  // ================= RENDER =================
  return (
    <CompanyGuard>
    <div
      className="min-h-screen bg-black text-white flex flex-col"
      onClick={() => setMenuOpen(null)}
    >
      <MainNavbar />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 relative">
          <h1 className="text-2xl font-bold mb-6">My Jobs</h1>

          <div className="bg-[#111] rounded-xl border border-gray-800">
            {/* HEADER */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-3 bg-[#1a1a1a] text-gray-400 text-sm font-semibold uppercase tracking-wide border-b border-gray-700">
              <div>JOBS</div>
              <div>STATUS</div>
              <div>APPLICATIONS</div>
              <div className="text-right">ACTIONS</div>
            </div>

            {/* BODY */}
            {loading ? (
              <div className="p-6 text-center text-gray-400">
                Loading jobs...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-400">{error}</div>
            ) : jobs.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No jobs found.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {jobs.map((job) => {
                  const expired = job.is_open === false;



                  return (
                    <div
                      key={job.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-4 items-center hover:bg-[#1a1a1a] transition relative"
                    >
                      {/* JOB TITLE */}
                      <div>
                        <Link
                          href={`/employer/jobs/${job.id}`}
                          className="font-medium hover:underline"
                          style={{ color: BRAND_BLUE }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.title}
                        </Link>
                        <p className="text-gray-400 text-xs mt-1">
                          {job.job_type || "full time"} •{" "}
                          {job.created_at
                            ? new Date(job.created_at).toLocaleDateString()
                            : ""}
                        </p>
                      </div>

                      {/* STATUS */}
                      <div>
                        <span
                          className="font-medium"
                          style={{
                                 color: expired ? "#f97373" : "#3B82F6",
                                }}
                          >
                          ● {expired ? "Closed" : "Open"}
                        </span>

                          
                          
                          
                         
                        
                         
                        
                      </div>

                      {/* APPLICATIONS */}
                      <div className="flex items-center gap-2 text-sm text-white">
                        <span>{job.applications_count || 0} Applications</span>
                      </div>

                      {/* ACTIONS */}
                      <div className="text-right relative">
                        <div className="flex justify-end items-center gap-2">
                          <Link
                            href={`/employer/jobs/${job.id}/applications`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 rounded text-white text-sm"
                            style={{ backgroundColor: BRAND_BLUE }}
                          >
                            View Applications
                          </Link>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpen(menuOpen === job.id ? null : job.id);
                            }}
                            className="px-2 py-1 rounded hover:bg-[#222] text-gray-300"
                          >
                            ⋮
                          </button>

                          {menuOpen === job.id && (
                            <div className="absolute right-0 top-10 w-56 bg-[#1c1c1c] border border-gray-700 rounded-lg shadow-lg z-50">
                              {expired && (
                               <button
                                onClick={() => {
                                   handlePromote(job.id);
                                   setMenuOpen(null);
                                   }}
                                   className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm"
                                >
                               Reactivate Job
                              </button>
                               )}


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
                                onClick={() => {
                                  handleExpire(job.id);
                                  setMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm"
                              >
                                Make It Expire
                              </button>

                              <button
                                onClick={() => {
                                  handleDelete(job.id);
                                  setMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-600 text-sm border-t border-gray-700"
                              >
                                Delete Job
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </CompanyGuard>
  );
}
