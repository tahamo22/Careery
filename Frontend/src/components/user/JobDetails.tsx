"use client";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function JobDetails({ job }: { job: any }) {
  // ✅ لو مفيش بيانات جايه من الـ API
  if (!job)
    return (
      <p className="text-center text-gray-400 py-10">
        No job details available.
      </p>
    );

  // ✅ بيانات الشركة من الـ backend
  const company = job.company_profile || {};
  const logoUrl =
    company.company_logo?.startsWith("http")
      ? company.company_logo
      : company.company_logo
      ? `${API_BASE_URL}${company.company_logo}`
      : "/default-company.png";

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8 mt-8">
      {/* ===== Job Title + Company ===== */}
      <div className="flex items-center gap-4 mb-6">
        <Image
          src={logoUrl}
          alt="company logo"
          width={60}
          height={60}
          className="rounded-md border border-gray-200 bg-white"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-gray-600">
            at{" "}
            <span className="text-green-600 font-medium">
              {company.company_name || "Unnamed Company"}
            </span>{" "}
            • {job.job_type || "FULL-TIME"}
          </p>
          <p className="text-gray-500 text-sm">
            {job.city || "—"}, {job.country || ""}
          </p>
        </div>
      </div>

      {/* ===== Job Description ===== */}
      {job.description && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">
            Job Description
          </h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </div>
      )}

      {/* ===== Job Requirements ===== */}
      {job.requirements && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">
            Requirements
          </h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {job.requirements}
          </p>
        </div>
      )}

      {/* ===== Job Overview ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm text-gray-700">
        <div>
          <strong>Posted:</strong>{" "}
          {job.created_at
            ? new Date(job.created_at).toLocaleDateString()
            : "N/A"}
        </div>
        <div>
          <strong>Level:</strong> {job.job_level || "Not specified"}
        </div>
        <div>
          <strong>Experience:</strong> {job.experience || "Not specified"}
        </div>
        <div>
          <strong>Education:</strong> {job.education || "Not specified"}
        </div>
        <div>
          <strong>Salary:</strong> {job.salary || "Not specified"}
        </div>
        <div>
          <strong>Vacancies:</strong> {job.vacancies || "N/A"}
        </div>
      </div>

      {/* ===== Company Info ===== */}
      <div className="border-t pt-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          About the Company
        </h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {company.company_description ||
            "No company description available."}
        </p>

        {company.industry_type && (
          <p className="text-gray-700 mt-2">
            <strong>Industry:</strong> {company.industry_type}
          </p>
        )}

        {company.team_size && (
          <p className="text-gray-700 mt-1">
            <strong>Team Size:</strong> {company.team_size} Employees
          </p>
        )}

        {company.company_website && (
          <p className="text-gray-700 mt-1">
            <strong>Website:</strong>{" "}
            <Link
              href={company.company_website}
              target="_blank"
              className="text-green-600 hover:underline"
            >
              {company.company_website}
            </Link>
          </p>
        )}
      </div>

      {/* ===== Apply Button ===== */}
      <div className="mt-6">
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition">
          Apply Now →
        </button>
      </div>
    </div>
  );
}
