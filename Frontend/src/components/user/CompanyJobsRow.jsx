"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react"; // ✅ أيقونة الدبوس من lucide-react
import { API_BASE_URL } from "@/lib/api";

export default function CompanyJobsRow({ title, api }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(api);
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (api) fetchJobs();
  }, [api]);

  if (loading)
    return (
      <div className="flex justify-center text-gray-400 py-10">
        ⏳ Loading company jobs...
      </div>
    );

  if (!jobs.length)
    return (
      <div className="flex justify-center text-gray-400 py-10">
        ⚠️ No matching jobs found.
      </div>
    );

  return (
    <section className="max-w-6xl mx-auto mt-10 px-6">
      {title && (
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">
          {title}
        </h2>
      )}

      {/* ==== GRID ==== */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {jobs.map((job) => {
          const company = job.company_profile || {};
          const logoUrl =
            company.company_logo?.startsWith("http")
              ? company.company_logo
              : company.company_logo
              ? `${API_BASE_URL}${company.company_logo}`
              : "/default-company.png";

          return (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition relative"
            >
              {/* Save icon */}
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-green-600 transition"
                title="Save job"
              >
                <i className="ri-bookmark-line text-lg"></i>
              </button>

              {/* Job Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {job.title || "Untitled Job"}
              </h3>

              {/* Job Type */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded">
                  {job.job_type?.toUpperCase() || "FULL-TIME"}
                </span>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  COMPANY
                </span>
              </div>

              {/* Company info */}
              <div className="flex items-center gap-3">
                <Image
                  src={logoUrl}
                  alt="Company logo"
                  width={36}
                  height={36}
                  className="rounded-md border border-gray-200 bg-white"
                />
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {company.company_name || "Unnamed Company"}
                  </p>

                  {/* ✅ Location line with pin icon */}
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <MapPin size={14} strokeWidth={1.5} />
                    <span>
                      {job.city || "—"}, {job.country || ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Button */}
              <Link
                href={`/user/jobs/${job.id}`}
                className="mt-4 inline-block w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                View Details →
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
