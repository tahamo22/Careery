"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import Sidebar from "@/components/employer/Sidebar";
import MainNavbar from "@/components/employer/MainNavbar";

// دالة صغيرة علشان نطبع أي قيمة كنص من غير ما تقع
function read(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

// ✅ Parse description blocks (Job Summary / Working Hours / Benefits / About the Company / How to Apply / Travel)
function parseDescriptionBlocks(description) {
  const result = {
    summary: "",
    workingDays: "",
    workingHours: "",
    shifts: "",
    salaryInfo: "",
    benefitsText: "",
    aboutCompany: "",
    companyIndustry: "",
    companySize: "",
    applyEmail: "",
    applyWhatsApp: "",
    applyLink: "",
    travelRequirements: "",
  };

  if (!description) return result;
  const desc = String(description);

  // ---- Job Summary ----
  if (desc.includes("Job Summary:")) {
    const after = desc.split("Job Summary:")[1];
    const block = after.split(/\n\s*\n/)[0];
    result.summary = block.trim();
  }

  // ---- Working Hours ----
  if (desc.includes("Working Hours:")) {
    const after = desc.split("Working Hours:")[1];
    const block = after.split(/\n\s*\n/)[0];
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (line.toLowerCase().startsWith("workdays per week:")) {
        result.workingDays = line.replace(/workdays per week:/i, "").trim();
      } else if (line.toLowerCase().startsWith("daily working hours:")) {
        result.workingHours = line.replace(/daily working hours:/i, "").trim();
      } else if (line.toLowerCase().startsWith("shifts:")) {
        result.shifts = line.replace(/shifts:/i, "").trim();
      }
    }
  }

  // ---- Benefits ----
  if (desc.includes("Benefits:")) {
    const after = desc.split("Benefits:")[1];
    const block = after.split(/\n\s*\n/)[0];
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let benefitsLines = [];

    for (const line of lines) {
      if (line.toLowerCase().startsWith("salary / compensation:")) {
        result.salaryInfo = line.replace(/salary \/ compensation:/i, "").trim();
      } else if (line.toLowerCase().startsWith("benefits:")) {
        const text = line.replace(/benefits:/i, "").trim();
        if (text) benefitsLines.push(text);
      } else {
        benefitsLines.push(line);
      }
    }

    if (benefitsLines.length > 0) result.benefitsText = benefitsLines.join("\n");
  }

  // ---- About the Company ----
  if (desc.includes("About the Company:")) {
    const after = desc.split("About the Company:")[1];
    const block = after.split(/\n\s*\n/)[0];
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const aboutLines = [];

    for (const line of lines) {
      if (line.toLowerCase().startsWith("industry:")) {
        result.companyIndustry = line.replace(/industry:/i, "").trim();
      } else if (line.toLowerCase().startsWith("company size:")) {
        result.companySize = line.replace(/company size:/i, "").trim();
      } else {
        aboutLines.push(line);
      }
    }

    if (aboutLines.length > 0) result.aboutCompany = aboutLines.join("\n");
  }

  // ---- How to Apply ----
  if (desc.includes("How to Apply:")) {
    const after = desc.split("How to Apply:")[1];
    const block = after.split(/\n\s*\n/)[0];
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (line.toLowerCase().startsWith("email:")) {
        result.applyEmail = line.replace(/email:/i, "").trim();
      } else if (line.toLowerCase().startsWith("whatsapp:")) {
        result.applyWhatsApp = line.replace(/whatsapp:/i, "").trim();
      } else if (line.toLowerCase().startsWith("application link:")) {
        result.applyLink = line.replace(/application link:/i, "").trim();
      }
    }
  }

  // ---- Travel Requirements ----
  // يدعم:
  // 1) Travel Requirements: xxx
  // 2) Travel Requirements (optional): xxx
  // 3) داخل أي سطر في النص (مش لازم بلوك)
  const travelMatch =
    desc.match(/travel requirements\s*(?:\(\s*optional\s*\))?\s*:\s*(.+)/i);

  if (travelMatch && travelMatch[1]) {
    result.travelRequirements = travelMatch[1].trim();
  }

  return result;
}

export  function EmployerJobViewDetailsPagecom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("id");

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // ========== FETCH JOB (✅ WITH AUTH) ========== //
  useEffect(() => {
    if (!jobId) {
      setError("No job id provided.");
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          typeof window !== "undefined" ? localStorage.getItem("access") : null;

        if (!token) {
          window.location.href = "/auth/login";
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to load job. Status ${res.status} - ${txt}`);
        }

        const data = await res.json();
        console.log("JOB DETAILS: ", data);
        setJob(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load job.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, API_BASE_URL]);

  // ========== PARSE DESCRIPTION (✅) ========== //
  const parsed = useMemo(() => {
    if (!job) return parseDescriptionBlocks("");
    return parseDescriptionBlocks(job.description);
  }, [job]);

  // ========== PARSE TAGS (✅ fix remote parsing) ========== //
  const { technicalSkills, softSkills, languageSkills, tagHasRemote } = useMemo(() => {
    if (!job) {
      return { technicalSkills: "", softSkills: "", languageSkills: "", tagHasRemote: false };
    }

    const tagsStr = read(job.tags || "");
    const parts = tagsStr
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);

    let tech = [];
    let soft = [];
    let lang = [];
    let remote = false;

    for (const p of parts) {
      const lower = p.toLowerCase();
      if (lower === "remote") remote = true;
      else if (lower.startsWith("soft:")) soft.push(p.replace(/^soft:\s*/i, ""));
      else if (lower.startsWith("languages:")) lang.push(p.replace(/^languages:\s*/i, ""));
      else tech.push(p);
    }

    return {
      technicalSkills: tech.join(" | "),
      softSkills: soft.join(", "),
      languageSkills: job.languages ? read(job.languages) : lang.join(", "),
      tagHasRemote: remote,
    };
  }, [job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-lg">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || "Job not found."}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  // ====== Read values with strong fallbacks ====== //

  const seniorityValue = job.job_level || job.level || job.seniority || "";
  const employmentValue = job.job_type || job.employment_type || job.contract_type || "";

  const companyProfile = job.company_profile || {};

  const aboutCompany =
    job.about_company || companyProfile.company_description || parsed.aboutCompany || "";

  const companyIndustry =
    job.company_industry || companyProfile.industry_type || parsed.companyIndustry || job.industry || "";

  const companySize =
    job.company_size || companyProfile.company_size || parsed.companySize || job.team_size || "";

  // Location string
  const companyLocation = [
    job.city || job.company_city || companyProfile.city || "",
    job.country || job.company_country || companyProfile.country || "",
  ]
    .filter(Boolean)
    .join(", ");

  // Requirements
  const minExperience = job.experience || job.min_experience || job.minimum_experience || "";
  const educationLevel = job.education || job.education_level || job.degree_required || "";
  const acceptFresh = job.accept_fresh_graduates === true || job.accept_fresh_graduates === "true";

  // Salary + Benefits
  const salary = job.salary_info || job.salary || job.salary_range || job.compensation || parsed.salaryInfo || "";
  const benefitsText =
    job.benefits_text ||
    (Array.isArray(job.benefits) ? job.benefits.join("\n") : job.benefits || "") ||
    parsed.benefitsText ||
    "";

  // ✅ Working hours fallback from parsed description
  const workdays =
    job.working_days || job.workdays_per_week || job.work_days || parsed.workingDays || "";

  const workingHours =
    job.working_hours || job.daily_working_hours || job.working_time || parsed.workingHours || "";

  const shifts =
    job.shifts || job.shift_details || parsed.shifts || "";

  // ✅ Travel requirements fallback from parsed + direct field
  const travelRequirements =
    job.travel_requirements ||
    job.travel ||
    job.travel_requirements_text ||
    parsed.travelRequirements ||
    "";

  // Apply section
  const applyMethod = job.apply_option || job.apply_method || "";
  const applyEmail = job.apply_email || job.contact_email || companyProfile.company_email || parsed.applyEmail || "";
  const applyWhatsapp = job.apply_whatsapp || job.contact_whatsapp || companyProfile.company_whatsapp || parsed.applyWhatsApp || "";
  const applyLink = job.apply_link || job.external_link || job.application_url || parsed.applyLink || "";

  // ✅ Remote logic قوي
  const isRemote =
    Boolean(job.is_remote) ||
    tagHasRemote ||
    (read(job.country).trim() === "" && read(job.city).trim() === "") ||
    read(job.country).toLowerCase() === "remote";

  // ✅ Summary (لو summary فاضي، استخدم parsed.summary بدل ما تعرض description كله)
  const summaryText = job.summary || parsed.summary || job.description || "";

  // ✅ Qualifications (أحيانًا بتكون جوه requirements)
  const qualificationsText = job.qualifications || job.requirements || "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-2xl font-semibold">View Job Details</h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs md:text-sm"
            >
              ← Back to My Jobs
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-8">
            {/* 1. Job Title */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base md:text-lg font-semibold">1. Job Title</h2>
                <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                  Read-only
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1">Job Title</label>
                  <input
                    type="text"
                    value={read(job.title)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Job Role (optional)</label>
                  <input
                    type="text"
                    value={read(job.role)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Seniority Level</label>
                  <input
                    type="text"
                    value={read(seniorityValue)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Employment Type</label>
                  <input
                    type="text"
                    value={read(employmentValue)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 2. About the Company */}
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-3">
                2. About the Company (optional but useful)
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1">About the Company</label>
                  <textarea
                    value={read(aboutCompany)}
                    readOnly
                    rows={3}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Industry / Field</label>
                  <input
                    type="text"
                    value={read(companyIndustry)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Company Size</label>
                  <input
                    type="text"
                    value={read(companySize)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Company Location (optional)</label>
                  <input
                    type="text"
                    value={read(companyLocation)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 3. Summary */}
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-3">
                3. Job Description (Summary)
              </h2>
              <textarea
                value={read(summaryText)}
                readOnly
                rows={4}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm resize-none"
              />
            </section>

            {/* 4. Requirements */}
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-3">4. Job Requirements</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1">Qualifications</label>
                  <textarea
                    value={read(qualificationsText)}
                    readOnly
                    rows={3}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Minimum Experience (years)</label>
                  <input
                    type="text"
                    value={read(minExperience)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Fresh graduates can apply</label>
                  <input
                    type="text"
                    value={acceptFresh ? "Yes" : "No"}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Education Level</label>
                  <input
                    type="text"
                    value={read(educationLevel)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Vacancies</label>
                  <input
                    type="text"
                    value={read(job.vacancies)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs mb-1">Technical Skills</label>
                  <textarea
                    value={read(technicalSkills)}
                    readOnly
                    rows={2}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs mb-1">Soft Skills</label>
                  <textarea
                    value={read(softSkills)}
                    readOnly
                    rows={2}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs mb-1">Languages</label>
                  <textarea
                    value={read(languageSkills)}
                    readOnly
                    rows={2}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            </section>

            {/* 5. Benefits */}
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-3">5. Benefits</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1">Salary / Compensation</label>
                  <input
                    type="text"
                    value={read(salary)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs mb-1">Benefits (for this job)</label>
                  <textarea
                    value={read(benefitsText)}
                    readOnly
                    rows={3}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            </section>

            {/* 6. Location */}
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-3">6. Location</h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs mb-1">
                    This job is Remote (can work from anywhere)
                  </label>
                  <input
                    type="text"
                    value={isRemote ? "Yes" : "No"}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Country</label>
                  <input
                    type="text"
                    value={isRemote ? "" : read(job.country)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">City</label>
                  <input
                    type="text"
                    value={isRemote ? "" : read(job.city)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs mb-1">Travel Requirements (optional)</label>
                  <input
                    type="text"
                    value={read(travelRequirements)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 7. Working Hours */}
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-3">7. Working Hours</h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs mb-1">Workdays per week</label>
                  <input
                    type="text"
                    value={read(workdays)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Daily working hours</label>
                  <input
                    type="text"
                    value={read(workingHours)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Shifts (if applicable)</label>
                  <input
                    type="text"
                    value={read(shifts)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 8. How to Apply */}
            <section>
              <h2 className="text-base md:text-lg font-semibold mb-3">8. How to Apply</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1">Apply Method</label>
                  <input
                    type="text"
                    value={read(applyMethod)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">External platform / form link</label>
                  <input
                    type="text"
                    value={read(applyLink)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Company Email</label>
                  <input
                    type="text"
                    value={read(applyEmail)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Company WhatsApp</label>
                  <input
                    type="text"
                    value={read(applyWhatsapp)}
                    readOnly
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}


export default function EmployerJobViewDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployerJobViewDetailsPagecom />
    </Suspense>
  );
}