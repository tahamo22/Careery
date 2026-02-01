"use client";

import Sidebar from "@/components/employer/Sidebar";
import MainNavbar from "@/components/employer/MainNavbar";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CompanyGuard from "@/components/employer/CompanyGuard";


const getCompanyProfile = async () => {
  const token = localStorage.getItem("access");

  const res = await fetch(`${API_BASE_URL}/api/settings/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.company_profile || null;
};
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// 🔹 فورم فاضي (نستخدمه في reset / init)
const emptyJobData = {
  // Basic info
  title: "",
  role: "",
  level: "",
  employmentType: "",
  applicationsLimit: "",
  applicationDeadline: "",


  // About company
  aboutCompany: "",
  companyIndustry: "",
  companySize: "",

  // Location
  country: "",
  city: "",
  isRemote: false,
  travelRequirements: "",

  // Summary
  summary: "",

  // Requirements
  qualifications: "",
  minExperience: "",
  education: "",
  acceptFreshGraduates: false,
  requiredSkills: "", // technical skills
  niceSkills: "", // soft skills
  languages: "",

  vacancies: "",

  // Benefits
  salaryInfo: "",
  benefitsText: "", // free text benefits

  // Working hours
  workingDays: "",
  workingHours: "",
  shifts: "",

  // Apply
  applyOption: "jobpilot",
  applyEmail: "",
  applyWhatsApp: "",
  applyLink: "",
};

// 🔹 تحويل tags string -> skills / languages / remote
const parseTagsToForm = (tags) => {
  if (!tags)
    return {
      requiredSkills: "",
      niceSkills: "",
      languages: "",
      isRemote: false,
    };

  const parts = tags
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);

  let requiredSkillsArr = [];
  let niceSkillsArr = [];
  let languagesArr = [];
  let isRemote = false;

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === "remote") {
      isRemote = true;
    } else if (lower.startsWith("soft:")) {
      niceSkillsArr.push(part.replace(/soft:\s*/i, ""));
    } else if (lower.startsWith("languages:")) {
      languagesArr.push(part.replace(/languages:\s*/i, ""));
    } else {
      requiredSkillsArr.push(part);
    }
  }

  return {
    requiredSkills: requiredSkillsArr.join(", "),
    niceSkills: niceSkillsArr.join(", "),
    languages: languagesArr.join(", "),
    isRemote,
  };
};

// 🔹 نفكك description القديمة (Job Summary / Working Hours / Benefits / About the Company / How to Apply)
const parseDescriptionBlocks = (description) => {
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
  };

  if (!description) return result;
  const desc = String(description);

  // ---- Job Summary ----
  if (desc.includes("Job Summary:")) {
    const after = desc.split("Job Summary:")[1];
    const block = after.split(/\n\s*\n/)[0]; // لحد سطر فاضي
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
        result.workingHours = line
          .replace(/daily working hours:/i, "")
          .trim();
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
        result.salaryInfo = line
          .replace(/salary \/ compensation:/i, "")
          .trim();
      } else if (line.toLowerCase().startsWith("benefits:")) {
        const text = line.replace(/benefits:/i, "").trim();
        if (text) benefitsLines.push(text);
      } else {
        benefitsLines.push(line);
      }
    }

    if (benefitsLines.length > 0) {
      // لو فيه نقط • سيبها زي ما هي
      result.benefitsText = benefitsLines.join("\n");
    }
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

    if (aboutLines.length > 0) {
      result.aboutCompany = aboutLines.join("\n");
    }
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
        result.applyLink = line
          .replace(/application link:/i, "")
          .trim();
      }
    }
  }

  return result;
};

export  function PostJobPagecom() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  const [jobData, setJobData] = useState(emptyJobData);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(isEditing); // لو edit نبدأ بـ loading

  // ===================== LOAD COMPANY INFO FROM ONBOARDING (Step 1 & 2) =====================
  useEffect(() => {
    const loadCompanyInfoFromOnboarding = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access")
          : null;

      // 1) Try Backend first (recommended)
      let profile = null;

      if (token) {
        const endpointsToTry = [
          `${API_BASE_URL}/api/company-profiles/me/`,
          `${API_BASE_URL}/api/company-profile/`,
          `${API_BASE_URL}/api/employer/company-profile/`,
          `${API_BASE_URL}/api/me/company-profile/`,
        ];

        for (const url of endpointsToTry) {
          try {
            const res = await fetch(url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              profile = await res.json();
              break;
            }
            if (profile) {
  setCompanyProfile(profile);

  setJobData((prev) => ({
    ...prev,
    aboutCompany:
      profile.company_description ||
      profile.about_company ||
      "",
    companyIndustry:
      profile.industry_type ||
      profile.company_industry ||
      "",
    companySize:
      profile.team_size
        ? String(profile.team_size)
        : profile.company_size || "",
  }));
}
          } catch (e) {
            // ignore and try next
          }
        }
      }

      // 2) Fallback to localStorage (if onboarding saved data there)
      if (!profile && typeof window !== "undefined") {
        const candidates = [
          "companyProfile",
          "company_profile",
          "onboardingCompany",
          "onboarding_company",
          "onboardingStep1",
          "onboarding_step1",
          "onboardingStep2",
          "onboarding_step2",
          "employerOnboardingStep1",
          "employerOnboardingStep2",
        ];

        for (const key of candidates) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
              profile = { ...(profile || {}), ...parsed };
            }
          } catch (e) {
            // ignore invalid json
          }
        }
      }

      if (!profile) return;

      // Map common field names from onboarding to our jobData fields
      const about =
        profile.aboutCompany ||
        profile.about_company ||
        profile.companyAbout ||
        profile.company_about ||
        profile.about ||
        profile.description ||
        "";

      const industry =
        profile.companyIndustry ||
        profile.company_industry ||
        profile.industry ||
        profile.field ||
        "";

      const size =
        profile.companySize ||
        profile.company_size ||
        profile.size ||
        "";

      // Fill ONLY if current form fields are empty (so editing job won't be overwritten)
      setJobData((prev) => ({
        ...prev,
        aboutCompany: prev.aboutCompany?.trim() ? prev.aboutCompany : about || "",
        companyIndustry: prev.companyIndustry?.trim()
          ? prev.companyIndustry
          : industry || "",
        companySize: prev.companySize?.trim() ? prev.companySize : size || "",
      }));
    };

    loadCompanyInfoFromOnboarding();
  }, [API_BASE_URL]);

  // ===================== LOAD JOB FOR EDIT =====================
  useEffect(() => {
    const loadJobForEdit = async () => {
      if (!isEditing || !editId) return;

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access")
          : null;

      if (!token) {
        alert("Please log in first as a company.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs/${editId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to fetch job for edit:", data);
          alert("Failed to load job data for editing.");
          return;
        }

        // 🔹 parse tags
        const tagsParsed = parseTagsToForm(data.tags);

        // 🔹 نفكك description لو هي بالطريقة القديمة
        const parsedDesc = parseDescriptionBlocks(data.description || "");

        // 🔹 parse minExperience من experience أو من requirements لو القديمة
        let minExperience = "";
        if (data.experience) {
          const m = String(data.experience).match(/(\d+)/);
          if (m) minExperience = m[1];
        } else if (data.requirements) {
          const matchReq = String(data.requirements).match(
            /experience:\s*(\d+)/i
          );
          if (matchReq) minExperience = matchReq[1];
        }

        // 🔹 benefitsText:
        let benefitsText = "";
        if (data.benefits_text) {
          benefitsText = data.benefits_text;
        } else if (Array.isArray(data.benefits) && data.benefits.length) {
          benefitsText = data.benefits.join("\n");
        } else if (parsedDesc.benefitsText) {
          benefitsText = parsedDesc.benefitsText;
        }

        // 🔹 Summary & Qualifications
        const summaryFinal =
          data.summary || parsedDesc.summary || data.description || "";
        const qualificationsFinal =
          data.qualifications || data.requirements || "";

        // 🔹 Remote logic
        const isRemoteFinal =
          tagsParsed.isRemote || (!data.country && !data.city);

        setJobData({
          ...emptyJobData,
          // Basic
          title: data.title || "",
          role: data.role || "",
          level: data.job_level || "",
          employmentType: data.job_type || "",

          // Location
          country: data.country || "",
          city: data.city || "",
          isRemote: isRemoteFinal,
          travelRequirements: data.travel_requirements || "",

          // Summary & requirements
          summary: summaryFinal,
          qualifications: qualificationsFinal,

          // Experience & education
          minExperience,
          education: data.education || "",
          acceptFreshGraduates: Boolean(data.accept_fresh_graduates),

          // Skills / languages
          requiredSkills: tagsParsed.requiredSkills || "",
          niceSkills: tagsParsed.niceSkills || "",
          languages: data.languages || tagsParsed.languages || "",

          // Vacancies
          vacancies: data.vacancies ? String(data.vacancies) : "",
          
          // Benefits
          salaryInfo: data.salary_info || parsedDesc.salaryInfo || "",
          benefitsText,

          // Working hours
          workingDays: data.working_days || parsedDesc.workingDays || "",
          workingHours: data.working_hours || parsedDesc.workingHours || "",
          shifts: data.shifts || parsedDesc.shifts || "",

          // Apply
          applyOption: data.apply_option || "jobpilot",
          applyEmail: data.apply_email || parsedDesc.applyEmail || "",
          applyWhatsApp: data.apply_whatsapp || parsedDesc.applyWhatsApp || "",
          applyLink: data.apply_link || parsedDesc.applyLink || "",

          // About company
          aboutCompany: data.about_company || parsedDesc.aboutCompany || "",
          companyIndustry:
            data.company_industry || parsedDesc.companyIndustry || "",
          companySize: data.company_size || parsedDesc.companySize || "",
        });
      } catch (error) {
        console.error("Error loading job for edit:", error);
        alert("Server error while loading job.");
      } finally {
        setLoading(false);
      }
    };

    loadJobForEdit();
  }, [isEditing, editId]);

  // ===================== SUBMIT =====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token =
      typeof window !== "undefined" ? localStorage.getItem("access") : null;

    if (!token) {
      alert("Please log in first as a company.");
      return;
    }

    // --------- Tags (لـ AI matching) ----------
    const tagsParts = [];
    if (jobData.requiredSkills.trim()) {
      tagsParts.push(jobData.requiredSkills.trim()); // technical
    }
    if (jobData.niceSkills.trim()) {
      tagsParts.push("soft: " + jobData.niceSkills.trim()); // soft
    }
    if (jobData.languages.trim()) {
      tagsParts.push("languages: " + jobData.languages.trim());
    }
    if (jobData.isRemote) {
      tagsParts.push("remote");
    }
    const tags = tagsParts.join(" | ");

    // --------- Experience string ----------
    const experienceStr = jobData.minExperience
      ? `${jobData.minExperience}+ years`
      : "";

    // --------- Benefits array ----------
    let benefitsArray = [];
    if (jobData.benefitsText.trim()) {
      benefitsArray = jobData.benefitsText
        .split(/\n|,/)
        .map((b) => b.trim())
        .filter(Boolean);
    }

    // --------- Description (نفس التركيب في create & edit) ----------
    const descriptionParts = [];

    if (jobData.summary.trim()) {
      descriptionParts.push(`Job Summary:\n${jobData.summary.trim()}`);
    }

    if (
      jobData.workingDays.trim() ||
      jobData.workingHours.trim() ||
      jobData.shifts.trim()
    ) {
      const workingLines = [];
      if (jobData.workingDays.trim()) {
        workingLines.push(`Workdays per week: ${jobData.workingDays.trim()}`);
      }
      if (jobData.workingHours.trim()) {
        workingLines.push(
          `Daily working hours: ${jobData.workingHours.trim()}`
        );
      }
      if (jobData.shifts.trim()) {
        workingLines.push(`Shifts: ${jobData.shifts.trim()}`);
      }
      descriptionParts.push(`Working Hours:\n${workingLines.join("\n")}`);
    }

    if (jobData.salaryInfo.trim() || benefitsArray.length > 0) {
      const lines = [];
      if (jobData.salaryInfo.trim()) {
        lines.push(`Salary / Compensation: ${jobData.salaryInfo.trim()}`);
      }
      if (benefitsArray.length > 0) {
        lines.push(`Benefits: ${benefitsArray.join(", ")}`);
      }
      descriptionParts.push(`Benefits:\n${lines.join("\n")}`);
    }

    if (jobData.aboutCompany.trim()) {
      const aboutLines = [];
      aboutLines.push(jobData.aboutCompany.trim());
      if (jobData.companyIndustry.trim()) {
        aboutLines.push(`Industry: ${jobData.companyIndustry.trim()}`);
      }
      if (jobData.companySize.trim()) {
        aboutLines.push(`Company size: ${jobData.companySize.trim()}`);
      }
      descriptionParts.push(`About the Company:\n${aboutLines.join("\n")}`);
    }

    if (
      jobData.applyOption !== "jobpilot" &&
      (jobData.applyEmail.trim() ||
        jobData.applyWhatsApp.trim() ||
        jobData.applyLink.trim())
    ) {
      const applyLines = [];
      if (jobData.applyEmail.trim()) {
        applyLines.push(`Email: ${jobData.applyEmail.trim()}`);
      }
      if (jobData.applyWhatsApp.trim()) {
        applyLines.push(`WhatsApp: ${jobData.applyWhatsApp.trim()}`);
      }
      if (jobData.applyLink.trim()) {
        applyLines.push(`Application link: ${jobData.applyLink.trim()}`);
      }
      descriptionParts.push(`How to Apply:\n${applyLines.join("\n")}`);
    }

    const description = descriptionParts.join("\n\n");

    // --------- Requirements (بردو موحد) ----------
    const requirementsParts = [];

    if (jobData.qualifications.trim()) {
      requirementsParts.push(
        `Qualifications:\n${jobData.qualifications.trim()}`
      );
    }

    if (experienceStr || jobData.acceptFreshGraduates) {
      const expLines = [];
      if (experienceStr) expLines.push(`Experience: ${experienceStr}`);
      if (jobData.acceptFreshGraduates) {
        expLines.push("Fresh graduates may apply.");
      }
      requirementsParts.push(expLines.join("\n"));
    }

    if (jobData.education.trim()) {
      requirementsParts.push(`Education level: ${jobData.education.trim()}`);
    }

    if (jobData.requiredSkills.trim()) {
      requirementsParts.push(`Technical skills:\n${jobData.requiredSkills.trim()}`);
    }

    if (jobData.niceSkills.trim()) {
      requirementsParts.push(`Soft skills:\n${jobData.niceSkills.trim()}`);
    }

    if (jobData.languages.trim()) {
      requirementsParts.push(`Languages:\n${jobData.languages.trim()}`);
    }

    const requirements = requirementsParts.join("\n\n");

    // ========= PAYLOAD (متوافق مع JobCreateUpdateSerializer) =========
    const payload = {
      title: jobData.title,
      role: jobData.role || "",
      job_type: jobData.employmentType || "",
      job_level: jobData.level || "",
      description,
      requirements,
      tags,
      education: jobData.education || "",
      experience: experienceStr,
      vacancies: jobData.vacancies ? parseInt(jobData.vacancies, 10) : null,
      country: jobData.isRemote ? "" : jobData.country || "",
      city: jobData.isRemote ? "" : jobData.city || "",
      benefits: benefitsArray,
      apply_option: jobData.applyOption || "jobpilot",

      // ✅ NEW: save company info in backend
      about_company: jobData.aboutCompany || "",
      company_industry: jobData.companyIndustry || "",
      company_size: jobData.companySize || "",
    };

    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/jobs/${editId}/`
        : `${API_BASE_URL}/api/jobs/`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(
          isEditing ? "✅ Job updated successfully!" : "✅ Job posted successfully!"
        );
        // بعد الحفظ رجّع المستخدم لـ My Jobs
        window.location.href = "/employer/jobs";
      } else {
        console.error("Post/Update job error:", data);
        alert(`❌ Failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("Error posting/updating job:", error);
      alert("❌ Server connection failed. Please check backend.");
    }
  };

  return (
    <CompanyGuard>
    <div className="min-h-screen bg-black text-white flex flex-col">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">
            {isEditing ? "Edit Job" : "Post a Job"}
          </h1>

          {loading ? (
            <div className="text-gray-400">Loading job data...</div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-8 bg-[#111] p-6 rounded-xl"
            >
              {/* ========== 1) Job Title ========== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  1. Job Title
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Backend Developer"
                      value={jobData.title}
                      onChange={(e) =>
                        setJobData({ ...jobData, title: e.target.value })
                      }
                      required
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Job Role (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Backend Engineer, Team Lead"
                      value={jobData.role}
                      onChange={(e) =>
                        setJobData({ ...jobData, role: e.target.value })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Seniority Level
                    </label>
                    <select
                      value={jobData.level}
                      onChange={(e) =>
                        setJobData({ ...jobData, level: e.target.value })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    >
                      <option value="">Select level</option>
                      <option value="junior">Junior</option>
                      <option value="mid">Mid-level</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Employment Type
                    </label>
                    <select
                      value={jobData.employmentType}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          employmentType: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    >
                      <option value="">Select type</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="internship">Internship</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* ========== 2) About the Company ========== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  2. About the Company (optional but useful)
                </h2>

                <div>
                  <label className="block mb-2 text-sm text-gray-300">
                    About the Company
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief introduction about your company, product, mission..."
                    value={jobData.aboutCompany}
                    onChange={(e) =>
                      setJobData({
                        ...jobData,
                        aboutCompany: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded bg-black border border-gray-700"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Industry / Field
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fintech, Construction, SaaS"
                      value={jobData.companyIndustry}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          companyIndustry: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Company Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 11–50 employees"
                      value={jobData.companySize}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          companySize: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Company Location (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dubai, UAE"
                      value={
                        jobData.city && jobData.country
                          ? `${jobData.city}, ${jobData.country}`
                          : ""
                      }
                      readOnly
                      className="w-full p-3 rounded bg-black border border-gray-700 opacity-70"
                    />
                  </div>
                </div>
              </section>

              {/* ========== 3) Job Description (Summary) ========== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  3. Job Description (Summary)
                </h2>

                <textarea
                  rows={4}
                  placeholder="Short summary of the role, team, and impact..."
                  value={jobData.summary}
                  onChange={(e) =>
                    setJobData({ ...jobData, summary: e.target.value })
                  }
                  className="w-full p-3 rounded bg-black border border-gray-700"
                />
              </section>

              {/* ========== 4) Job Requirements ========== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  4. Job Requirements
                </h2>

                {/* Qualifications */}
                <div>
                  <label className="block mb-2 text-sm text-gray-300">
                    1) Qualifications
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Required degree, field of study, certifications..."
                    value={jobData.qualifications}
                    onChange={(e) =>
                      setJobData({
                        ...jobData,
                        qualifications: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded bg-black border border-gray-700"
                  />
                </div>

                {/* Experience & education & vacancies */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Minimum Experience (years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 2"
                      value={jobData.minExperience}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          minExperience: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        id="freshgrads"
                        type="checkbox"
                        checked={jobData.acceptFreshGraduates}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            acceptFreshGraduates: e.target.checked,
                          })
                        }
                      />
                      <label
                        htmlFor="freshgrads"
                        className="text-xs text-gray-400 cursor-pointer"
                      >
                        Fresh graduates can apply
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Education Level
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bachelor in Computer Science"
                      value={jobData.education}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          education: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Vacancies
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Number of openings (e.g. 3)"
                      value={jobData.vacancies}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          vacancies: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      3) Technical Skills
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. HTML/CSS/JS, React, Excel, AutoCAD..."
                      value={jobData.requiredSkills}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          requiredSkills: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      4) Soft Skills
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. communication, teamwork, problem-solving..."
                      value={jobData.niceSkills}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          niceSkills: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block mb-2 text-sm text-gray-300">
                    5) Languages
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. English (Fluent), Arabic (Good)..."
                    value={jobData.languages}
                    onChange={(e) =>
                      setJobData({
                        ...jobData,
                        languages: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded bg-black border border-gray-700"
                  />
                </div>
              </section>

              {/* ========== 5) Benefits ========== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  5. Benefits
                </h2>

                <div>
                  <label className="block mb-2 text-sm text-gray-300">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8,000–10,000 AED + commission (negotiable)"
                    value={jobData.salaryInfo}
                    onChange={(e) =>
                      setJobData({
                        ...jobData,
                        salaryInfo: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded bg-black border border-gray-700"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-300">
                    Benefits (write them for this specific job)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Health insurance, Paid vacations, Remote / Hybrid work, Learning budget..."
                    value={jobData.benefitsText}
                    onChange={(e) =>
                      setJobData({
                        ...jobData,
                        benefitsText: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded bg-black border border-gray-700"
                  />
                </div>
              </section>

              {/* ========== 6) Location ========== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  6. Location
                </h2>

                <div className="flex items-center gap-3 mb-2">
                  <input
                    id="remote"
                    type="checkbox"
                    checked={jobData.isRemote}
                    onChange={(e) =>
                      setJobData((prev) => ({
                        ...prev,
                        isRemote: e.target.checked,
                        country: e.target.checked ? "" : prev.country,
                        city: e.target.checked ? "" : prev.city,
                      }))
                    }
                  />
                  <label
                    htmlFor="remote"
                    className="text-sm text-gray-300 cursor-pointer"
                  >
                    This job is Remote (can work from anywhere)
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Egypt, UAE, KSA"
                      value={jobData.country}
                      disabled={jobData.isRemote}
                      onChange={(e) =>
                        setJobData({ ...jobData, country: e.target.value })
                      }
                      className={`w-full p-3 rounded border border-gray-700 ${
                        jobData.isRemote
                          ? "bg-zinc-900 opacity-60 cursor-not-allowed"
                          : "bg-black"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cairo, Dubai"
                      value={jobData.city}
                      disabled={jobData.isRemote}
                      onChange={(e) =>
                        setJobData({ ...jobData, city: e.target.value })
                      }
                      className={`w-full p-3 rounded border border-gray-700 ${
                        jobData.isRemote
                          ? "bg-zinc-900 opacity-60 cursor-not-allowed"
                          : "bg-black"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-300">
                    Travel Requirements (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Occasional travel inside UAE / No travel required"
                    value={jobData.travelRequirements}
                    onChange={(e) =>
                      setJobData({
                        ...jobData,
                        travelRequirements: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded bg-black border border-gray-700"
                  />
                </div>
              </section>

              {/* ========== 7) Working Hours ========== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  7. Working Hours
                </h2>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Workdays per week
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5 days (Sunday–Thursday)"
                      value={jobData.workingDays}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          workingDays: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Daily working hours
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8 hours (9:00 AM – 5:00 PM)"
                      value={jobData.workingHours}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          workingHours: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-300">
                      Shifts (if applicable)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Morning / Night shifts – rotational"
                      value={jobData.shifts}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          shifts: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded bg-black border border-gray-700"
                    />
                  </div>
                </div>
              </section>

              {/* ========== 8) How to Apply ========== */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  8. How to Apply
                </h2>

                <div className="flex flex-wrap gap-4 mb-4">
                  <label className="flex items-center gap-2 border p-3 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="applyOption"
                      value="jobpilot"
                      checked={jobData.applyOption === "jobpilot"}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          applyOption: e.target.value,
                        })
                      }
                    />
                    On platform (Careery)
                  </label>
                  <label className="flex items-center gap-2 border p-3 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="applyOption"
                      value="external"
                      checked={jobData.applyOption === "external"}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          applyOption: e.target.value,
                        })
                      }
                    />
                    External platform / form link
                  </label>
                  <label className="flex items-center gap-2 border p-3 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="applyOption"
                      value="email"
                      checked={jobData.applyOption === "email"}
                      onChange={(e) =>
                        setJobData({
                          ...jobData,
                          applyOption: e.target.value,
                        })
                      }
                    />
                    Company Email / WhatsApp
                  </label>
                </div>

                {(jobData.applyOption === "email" ||
                  jobData.applyOption === "external") && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-300">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. careers@company.com"
                        value={jobData.applyEmail}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            applyEmail: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded bg-black border border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm text-gray-300">
                        WhatsApp (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +971 50 000 0000"
                        value={jobData.applyWhatsApp}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            applyWhatsApp: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded bg-black border border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm text-gray-300">
                        Application link (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. https://company.com/apply"
                        value={jobData.applyLink}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            applyLink: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded bg-black border border-gray-700"
                      />
                    </div>
                  </div>
                )}
              </section>

              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition"
              >
                {isEditing ? "Update Job" : "Post Job"}
              </button>
            </form>
          )}
        </main>
      </div>

      <footer className="w-full mt-16 py-4 text-center text-gray-500 text-sm border-t border-gray-700">
        © 2025 CareerBridge - Job Portal. All rights reserved
      </footer>
    </div>
    </CompanyGuard>
  );
}

export default function PostJobPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostJobPagecom />
    </Suspense>
  );

}