"use client";
import { useEffect, useState } from "react";
import JobCard from "./JobCard";
import { API_BASE_URL } from "@/lib/api";

export default function JobGrid({ query }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        console.warn("⚠️ No token found. Please login first.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // ✅ تقدر تغيّر المصدر هنا لأي endpoint خارجي/داخلي لاحقًا
        const url = `${API_BASE_URL}/api/linkedin-jobs/?keywords=${encodeURIComponent(
          query || ""
        )}&location=Egypt`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("❌ API Error:", text);
          setJobs([]);
          return;
        }

        const data = await res.json();
        // يدعم الحالتين: [] أو {jobs: []}
        let fetched = Array.isArray(data) ? data : data?.jobs || [];
        setJobs(fetched);
      } catch (err) {
        console.error("❌ Error fetching jobs:", err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [query]);

  // ✅ حالة التحميل
  if (loading)
    return (
      <div className="text-center text-gray-400 py-10">
        ⏳ Loading available jobs...
      </div>
    );

  // ✅ حذف رسالة "No jobs found" بالكامل
  if (jobs.length === 0) return null;

  // ✅ عرض الكروت فقط لما توجد نتائج
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-7xl mx-auto">
      {jobs.map((job, i) => (
        <JobCard key={i} job={job} />
      ))}
    </div>
  );
}
