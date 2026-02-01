"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/user/UserSidebar";
import Navbar from "@/components/user/Navbar";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= Fetch Dashboard Data =================
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [userRes, appliedRes, savedRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/settings/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/applied-jobs/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/saved-jobs/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const safeJson = async (res) => {
          try {
            return await res.json();
          } catch {
            return null;
          }
        };

        const userData = await safeJson(userRes);
        const appliedData = await safeJson(appliedRes);
        const savedData = await safeJson(savedRes);

        setUser(userData?.user || {});
        setAppliedJobs(Array.isArray(appliedData) ? appliedData : []);
        setSavedJobs(Array.isArray(savedData) ? savedData : []);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // ================= Unsave Job =================
  const handleUnsave = async (jobId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/api/jobs/${jobId}/save/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      // تحديث فوري للـ UI
      setSavedJobs((prev) =>
        prev.filter((item) => item.job.id !== jobId)
      );
    } catch (err) {
      console.error("Unsave error:", err);
    }
  };

  return (
    <main className="bg-black min-h-screen text-white flex flex-col">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-10 gap-10">
        <Sidebar />

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-6 text-sky-400">
            Overview
          </h1>

          {/* ===== User Info ===== */}
          {loading ? (
            <p className="text-gray-400 mb-8">Loading...</p>
          ) : user ? (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 mb-8 flex items-center gap-6">
              <img
                src={user.profile_picture_url || "/default-avatar.png"}
                alt="User"
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h2 className="text-xl font-semibold">
                  {user.full_name || "Unnamed User"}
                </h2>
                <p className="text-gray-400 text-sm">
                  {user.headline || "No headline yet"}
                </p>
              </div>
            </div>
          ) : null}

          {/* ===== Stats ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 text-center">
              <h3 className="text-2xl font-bold text-sky-400">
                {appliedJobs.length}
              </h3>
              <p className="text-gray-400 mt-2">Applied Jobs</p>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 text-center">
              <h3 className="text-2xl font-bold text-yellow-400">
                {savedJobs.length}
              </h3>
              <p className="text-gray-400 mt-2">Saved Jobs</p>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 text-center">
              <h3 className="text-2xl font-bold text-sky-400">
                Active CV
              </h3>
              <p className="text-gray-400 mt-2">Updated Profile</p>
            </div>
          </div>

          {/* ===== Applied Jobs ===== */}
          <h2 className="text-xl font-semibold mb-4">
            Applied Jobs
          </h2>

          <div className="space-y-4 mb-10">
            {appliedJobs.length > 0 ? (
              appliedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/user/jobs/${job.id}`}
                  className="block"
                >
                  <div className="bg-[#111] border border-gray-800 rounded-lg p-4 flex justify-between items-center hover:border-sky-500 transition">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-gray-400 text-sm">
                        {job.company_profile?.company_name || "Company"}
                      </p>
                    </div>
                    <span className="text-sky-400 text-sm">
                      Applied
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No applied jobs yet.</p>
            )}
          </div>

          {/* ===== Saved Jobs (تختفي لو فاضية) ===== */}
          {savedJobs.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mb-4">
                Saved Jobs
              </h2>

              <div className="space-y-4">
                {savedJobs.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#111] border border-gray-800 rounded-lg p-4 flex justify-between items-center"
                  >
                    <Link href={`/user/jobs/${item.job.id}`}>
                      <div>
                        <h3 className="font-semibold">
                          {item.job.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {item.job.company_profile?.company_name ||
                            "Company"}
                        </p>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleUnsave(item.job.id)}
                      className="text-sm text-red-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
