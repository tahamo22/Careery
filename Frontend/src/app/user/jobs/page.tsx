"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/user/Navbar";
import { getValidAccessToken } from "@/lib/auth";

import {
  Sparkles,
  MapPin,
  Loader2,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ExternalJob = {
  title: string;
  company?: string;
  location?: string;
  summary?: string;
  posted_at?: string;
  link: string;
  source: string;
  score?: number;
};

type InternalJob = {
  id: number;
  title: string;

  job_type?: string | null;
  city?: string | null;
  country?: string | null;

  created_at?: string | null;
  expiration_date?: string | null;

  applications_count?: number;
  applications_limit?: number;
  is_expired?: boolean;

  company_profile?: {
    company_name: string | null;
    company_logo: string | null;
  } | null;
};

const DEFAULT_LOCATION = "Egypt";
const PAGE_SIZE = 10;
const FETCH_LIMIT = 120;

/** ✅ Helpers */
const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesLoose = (haystack: string, needle: string) => {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return true; // لو مفيش keyword ما نفلترش
  return h.includes(n);
};

/** ✅ Robust extractor: يقرأ الـ role من مسارات مختلفة */
function extractBestRoleFromCvAnalysis(raw: string): string {
  if (!raw) return "";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "";
  }

  // localStorage ممكن يكون Array أو Object
  const root = Array.isArray(parsed) ? parsed[0] : parsed;

  if (!root) return "";

  const tryGet = (...paths: ((obj: any) => any)[]) => {
    for (const fn of paths) {
      const v = fn(root);
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };

  // 1) الشكل اللي كان عندنا
  const v1 = tryGet(
    (o) => o?.matching_roles?.[0]?.job_title,
    (o) => o?.matching_roles?.[0]?.title,
    (o) => o?.matching_roles?.[0] // لو String مباشر
  );
  if (v1) return v1;

  // 2) الشكل اللي إنت قولت عليه: descriptions[0]
  const desc0 = root?.matching_analysis?.[0] || root?.matching_analysis?.[0] || root?.matching_analysis;
  if (desc0) {
    const v2 = (() => {
      // ممكن descriptions[0] يكون string أو object
      if (typeof desc0 === "string") return desc0.trim();

      const fromDesc = tryGet(
        (o) => o?.matching_analysis?.[0]?.matching_roles?.[0]?.job_title,
       (o) => o?.matching_analysis?.[0]?.matching_roles?.[0],
      );
      if (fromDesc) return fromDesc;

      // أو داخل description object نفسه:
      const roles = (desc0 as any)?.matching_roles; 
      if (Array.isArray(roles) && roles.length) {
        const r0 = roles[0];
        if (typeof r0 === "string") return r0.trim();
        if (typeof r0?.job_title === "string") return r0.job_title.trim();
        if (typeof r0?.title === "string") return r0.title.trim();
      }

      // أو job_title مباشرة:
      if (typeof (desc0 as any)?.job_title === "string") return (desc0 as any).job_title.trim();

      return "";
    })();

    if (v2) return v2;
  }

  // 3) أي fallback منطقي: role/title على root
  const v3 = tryGet(
    (o) => o?.best_role,
    (o) => o?.role,
    (o) => o?.job_title,
    (o) => o?.title
  );
  return v3 || "";
}

export default function JobsPage() {
  const router = useRouter();

  // ✅ role جاي من CV Analysis
  const [cvKeywords, setCvKeywords] = useState("");

  const [location, setLocation] = useState<string>(DEFAULT_LOCATION);

  // External
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Internal (من الشركات)
  const [internalJobs, setInternalJobs] = useState<InternalJob[]>([]);
  const [loadingInternal, setLoadingInternal] = useState(false);
  const [internalErr, setInternalErr] = useState<string>("");

  // رسالة التقديم من الصفحة
  const [applyMsg, setApplyMsg] = useState<string>("");

  useEffect(() => {
    if (!applyMsg) return;
    const t = setTimeout(() => setApplyMsg(""), 2500);
    return () => clearTimeout(t);
  }, [applyMsg]);

  // ✅ اقرأ cvAnalysis من localStorage بمسارات متعددة
  useEffect(() => {
    const raw = localStorage.getItem("cvAnalysis") || "";
    const role = extractBestRoleFromCvAnalysis(raw);
    setCvKeywords(role);
  }, []);

  const effectiveKeywords = useMemo(() => cvKeywords.trim(), [cvKeywords]);

  // =============== FETCH INTERNAL JOBS (always) =====================
  useEffect(() => {
    let cancelled = false;

    const fetchInternal = async () => {
      setLoadingInternal(true);
      setInternalErr("");

      const setSafe = (jobsList: InternalJob[], errorMsg = "") => {
        if (cancelled) return;
        setInternalJobs(jobsList);
        setInternalErr(errorMsg);
      };

      try {
        // ✅ Always fetch public internal jobs then filter client-side
        const res = await fetch(`${API_BASE_URL}/api/jobs/`, { cache: "no-store" });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Request failed: ${res.status}`);
        }

        const data = await res.json();
        const list: InternalJob[] = Array.isArray(data) ? data : [];

        const loc = (location || DEFAULT_LOCATION).toLowerCase();

        // ✅ فلترة بالبلد + بالـ keyword (وظيفة قريبة/نفس الاسم)
        const filtered = list
          .filter((j) => {
            const c = (j.country || "").toLowerCase();
            const okLocation = !loc || c.includes(loc) || c === "" || c === "remote";
            const okKeyword = includesLoose(j.title || "", effectiveKeywords);
            return okLocation && okKeyword;
          })
          .slice(0, 20);

        setSafe(filtered);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load company jobs";
        setSafe([], message);
      } finally {
        if (!cancelled) setLoadingInternal(false);
      }
    };

    void fetchInternal();

    return () => {
      cancelled = true;
    };
  }, [location, effectiveKeywords]);

  // =============== FETCH EXTERNAL JOBS ====================
  const fetchJobs = useCallback(async (keywords: string, loc: string): Promise<void> => {
    if (!keywords) return;

    setLoading(true);
    setErr("");

    try {
      const url = `${API_BASE_URL}/api/external-jobs/?title=${encodeURIComponent(
        keywords
      )}&location=${encodeURIComponent(loc || DEFAULT_LOCATION)}&limit=${FETCH_LIMIT}&providers=jsearch&nocache=1`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      const out: ExternalJob[] = Array.isArray(data?.results) ? data.results : [];

      if (out.length === 0) {
        setErr("No results found.");
        setJobs([]);
      } else {
        setErr("");
        setJobs(out);
        setPage(1);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load jobs";
      setErr(message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ External fetch: بس لو keywords موجودة
  useEffect(() => {
    if (!effectiveKeywords) {
      setJobs([]);
      setErr("");
      setLoading(false);
      setPage(1);
      return;
    }

    const t = setTimeout(() => void fetchJobs(effectiveKeywords, location || DEFAULT_LOCATION), 200);
    return () => clearTimeout(t);
  }, [effectiveKeywords, location, fetchJobs]);

  // =============== PAGINATION ====================
  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const pageJobs = useMemo(
    () => jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [jobs, page]
  );

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goTo = (p: number) => setPage(() => Math.min(Math.max(1, p), totalPages));

  const countryChips = ["Saudi Arabia", "Egypt", "UAE", "Qatar", "Kuwait"];

  const handleViewDetails = (id: number) => {
    router.push(`/user/jobs/${id}`);
  };

  const handleApply = async (jobId: number) => {
    try {
      setApplyMsg("");
      const token = await getValidAccessToken();
      if (!token) {
        setApplyMsg("You need to login as a candidate to apply.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        setApplyMsg(data.detail || data.error || "Failed to apply for this job.");
        return;
      }

      setApplyMsg("Application submitted successfully ✅");
    } catch {
      setApplyMsg("Failed to apply for this job.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col text-white bg-[#020617]">
      <Navbar />

      {/* Header */}
      <section className="px-6 pt-8">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-sky-400" />
          <h1 className="text-3xl md:text-4xl font-bold text-sky-100">Find Jobs</h1>
        </div>

        <p className="text-slate-300 max-w-6xl mx-auto mt-2 text-sm md:text-base">
          Based on your CV analysis:
          <span className="text-sky-300 font-semibold"> {cvKeywords || "—"}</span>
        </p>

        {!cvKeywords && (
          <p className="text-slate-400 max-w-6xl mx-auto mt-2 text-xs">
            No matching role found in cvAnalysis (localStorage). Please run CV Analysis first.
          </p>
        )}
      </section>

      {/* LOCATION BLOCK */}
      <div className="px-6 mt-5">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <MapPin className="h-4 w-4" />
            </span>

            <input
              type="text"
              value={location}
              readOnly
              className="w-full bg-slate-950 border border-slate-800 rounded-full py-3 pl-9 pr-4 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/60 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {countryChips.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className={`px-4 py-1.5 rounded-full text-sm border transition ${
                  location.toLowerCase() === loc.toLowerCase()
                    ? "bg-sky-600 border-sky-500 text-white shadow-[0_0_18px_rgba(56,189,248,0.4)]"
                    : "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          <p className="text-slate-400 text-sm">
            Showing results for <span className="text-sky-300 font-semibold">{location}</span>
            {effectiveKeywords ? (
              <>
                {" "}
                • keyword: <span className="text-sky-300 font-semibold">{effectiveKeywords}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* ========= SECTION 1: INTERNAL COMPANY JOBS ========= */}
      <section className="max-w-6xl mx-auto w-full px-6 mt-6">
        <h2 className="text-xl md:text-2xl font-semibold text-sky-100 mb-3">
          Jobs from companies on Careery
        </h2>

        {loadingInternal && (
          <div className="flex items-center gap-3 text-slate-200 py-4 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            <span>Loading company jobs …</span>
          </div>
        )}

        {!loadingInternal && internalErr && (
          <div className="bg-red-950/60 border border-red-800 text-red-100 rounded-lg p-3 text-sm">
            {internalErr}
          </div>
        )}

        {!loadingInternal && !internalErr && internalJobs.length === 0 && (
          <p className="text-slate-400 text-sm py-3">
            No company jobs found{effectiveKeywords ? ` for “${effectiveKeywords}”` : ""} in{" "}
            <span className="text-sky-300 font-semibold">{location}</span>.
          </p>
        )}

        {!loadingInternal && !internalErr && internalJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {internalJobs.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-sky-300 leading-snug">{job.title}</h3>
                <p className="text-slate-300 text-sm mt-1">
                  {job.company_profile?.company_name || "Company"} • {job.city || ""}{" "}
                  {job.city && job.country ? "• " : ""}
                  {job.country || ""}
                </p>

                {job.job_type && (
                  <p className="text-xs text-slate-400 mt-2">
                    Job type: <span className="text-sky-300">{job.job_type}</span>
                  </p>
                )}

                <p className="text-xs text-slate-400 mt-2">
                  Posted:{" "}
                  <span className="text-slate-200">
                    {job.created_at ? new Date(job.created_at).toLocaleDateString() : "—"}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Expires:{" "}
                  <span className="text-slate-200">
                    {job.expiration_date
                      ? new Date(job.expiration_date).toLocaleDateString()
                      : "Open"}
                  </span>
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Applications:{" "}
                  <span className="text-sky-300 font-semibold">{job.applications_count || 0}</span>
                  {job.applications_limit ? ` / ${job.applications_limit}` : ""}
                </p>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handleViewDetails(job.id)}
                    className="px-3 py-1.5 rounded-full text-xs bg-slate-800 border border-slate-600 hover:bg-slate-700"
                  >
                    View details
                  </button>

                  <button
                    onClick={() => handleApply(job.id)}
                    className="px-3 py-1.5 rounded-full text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  >
                    Apply
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {applyMsg && <p className="text-xs text-sky-300 mt-3">{applyMsg}</p>}
      </section>

      {/* ========= SECTION 2: EXTERNAL API JOBS ========= */}
      <section className="max-w-6xl mx-auto w-full px-6 mt-8 mb-10 flex-1">
        {!effectiveKeywords && (
          <div className="text-slate-300 py-6 text-sm md:text-base">
            Run CV Analysis first to fetch external jobs.
          </div>
        )}

        {effectiveKeywords && loading && (
          <div className="flex items-center gap-3 text-slate-200 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
            <span>
              Fetching jobs for “{effectiveKeywords}” in “{location}” …
            </span>
          </div>
        )}

        {effectiveKeywords && !loading && err && (
          <div className="bg-red-950/60 border border-red-800 text-red-100 rounded-lg p-4 text-sm">
            {err}
          </div>
        )}

        {effectiveKeywords && !loading && !err && pageJobs.length === 0 && (
          <div className="text-slate-300 py-6 text-sm md:text-base">
            No external jobs found for{" "}
            <span className="text-sky-300 font-semibold">“{effectiveKeywords}”</span> in{" "}
            <span className="text-sky-300 font-semibold">“{location}”</span>.
          </div>
        )}

        {effectiveKeywords && !loading && !err && pageJobs.length > 0 && (
          <>
            <h2 className="text-xl md:text-2xl font-semibold text-sky-100 mb-3">
              More jobs from external platforms
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pageJobs.map((job, idx) => (
                <article
                  key={`${job.link}-${idx}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover:border-sky-500 hover:bg-slate-900 transition shadow-sm hover:shadow-[0_0_22px_rgba(56,189,248,0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold leading-snug text-sky-300">
                        {job.title || "Untitled Role"}
                      </h3>
                      <p className="text-slate-300 text-sm">
                        {job.company || "—"} • {job.location || "—"}
                      </p>
                    </div>

                    {typeof job.score === "number" && (
                      <span className="text-xs text-slate-200 bg-slate-800/90 px-2 py-1 rounded">
                        score {job.score.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {job.summary && (
                    <p className="text-slate-200 mt-3 text-sm line-clamp-4">{job.summary}</p>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400">{job.posted_at || ""}</span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-slate-800/90 text-slate-100 capitalize">
                        {job.source || "source"}
                      </span>

                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300"
                      >
                        <LinkIcon className="h-4 w-4" />
                        View
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={goPrev}
                disabled={page === 1}
                className={`h-9 w-9 rounded-full flex items-center justify-center border transition ${
                  page === 1
                    ? "bg-slate-800 border-slate-800 text-slate-500"
                    : "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-100"
                }`}
              >
                <ChevronLeft className="h-4 w-4 text-sky-400" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 5), page + 5)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => goTo(p)}
                    className={`h-9 w-9 rounded-full text-sm font-semibold border transition ${
                      page === p
                        ? "bg-sky-600 border-sky-500 text-white shadow-[0_0_16px_rgba(56,189,248,0.4)]"
                        : "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-100"
                    }`}
                  >
                    {String(p).padStart(2, "0")}
                  </button>
                ))}

              <button
                onClick={goNext}
                disabled={page === totalPages}
                className={`h-9 w-9 rounded-full flex items-center justify-center border transition ${
                  page === totalPages
                    ? "bg-slate-800 border-slate-800 text-slate-500"
                    : "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-100"
                }`}
              >
                <ChevronRight className="h-4 w-4 text-sky-400" />
              </button>
            </div>

            <p className="text-center text-slate-400 mt-3 text-sm">
              Page <span className="text-slate-100 font-semibold">{page}</span> of{" "}
              <span className="text-slate-100 font-semibold">{totalPages}</span> — showing{" "}
              <span className="text-slate-100 font-semibold">{pageJobs.length}</span> of{" "}
              <span className="text-slate-100 font-semibold">{jobs.length}</span> results
            </p>
          </>
        )}
      </section>
    </main>
  );
}