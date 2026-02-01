"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/employer/Sidebar";
import MainNavbar from "@/components/employer/MainNavbar";
import CompanyGuard from "@/components/employer/CompanyGuard";
import { API_BASE_URL } from "@/lib/api";
import {
  Bookmark,
  BookmarkCheck,
  MapPin,
  Mail,
  Download,
  MoreVertical,
  Briefcase,
  CalendarDays,
  ExternalLink,
  User,
  X,
} from "lucide-react";

const BRAND_BLUE = "#3B82F6";

function read(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function initials(fullName: string) {
  const n = (fullName || "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

type SavedCandidate = {
  savedId: number;
  applicationId?: number;
  jobId?: number;

  userId?: number;
  name: string;
  jobTitle?: string;

  email?: string;
  location?: string;
  appliedAt?: string;

  avatarUrl?: string;
  cvFileUrl?: string;
};

export default function SavedCandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access");
  }, []);

  const fetchSaved = async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        setError("You are not logged in as an employer.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/saved-applications/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Saved applications error:", data);
        setError(data?.detail || data?.error || "Failed to load saved candidates.");
        setLoading(false);
        return;
      }

      // ✅ دعم pagination لو DRF بيرجع {results: [...]}
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      const mapped: SavedCandidate[] = (list || []).map((item: any) => {
        // ✅ Serializer بيرجع fields flat
        const savedId = Number(item?.id);

        const name = read(item?.candidate_name) || "Unknown";
        const jobTitle = read(item?.job_title) || "";

        const email = read(item?.candidate_email) || "";
        const location = read(item?.location) || "";
        const appliedAt = read(item?.applied_at) || "";

        const avatarUrl = read(item?.profile_picture_url) || "";
        const cvFileUrl = read(item?.uploaded_cv_url) || "";
        const jobId =
         item?.job_id ??
          item?.job ??
         item?.jobId ??
         null;

        const applicationId =
        item?.application_id ??
        item?.application ??
        item?.applicationId ??
         null;


        
        const userId = item?.user_id ? Number(item.user_id) : undefined;
        

        return {
          savedId,
          applicationId,
          jobId,
          userId,
          name,
          jobTitle,
          email,
          location,
          appliedAt,
          avatarUrl,
          cvFileUrl,
        };
      });

      setCandidates(mapped);
    } catch (err) {
      console.error("Saved candidates fetch error:", err);
      setError("Server error while loading saved candidates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const filteredCandidates = candidates.filter((c) => {
  if (!searchTerm.trim()) return true;

  const keyword = searchTerm.toLowerCase();

  const jobTitle = (c.jobTitle || "").toLowerCase();

  // 🔥 فلترة على التخصص فقط
  return jobTitle.includes(keyword);
});
const filteredCount = filteredCandidates.length;


  // Close menu on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpenFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unsaveCandidate = async (savedId: number) => {
    if (!token) return;

    setBusyId(savedId);

    const prev = candidates;
    setCandidates((p) => p.filter((x) => x.savedId !== savedId));
    setMenuOpenFor(null);

    try {
      // ⚠️ ViewSet ReadOnly => DELETE غالباً 405
      let res = await fetch(`${API_BASE_URL}/api/saved-applications/${savedId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // ✅ fallback: toggle-save على applicationId (وده الصح عندك)
        const found = prev.find((x) => x.savedId === savedId);
        const appId = found?.applicationId;

        if (appId) {
          res = await fetch(`${API_BASE_URL}/api/applications/${appId}/toggle-save/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.error("Unsave error:", errData);
        setCandidates(prev); // rollback
      }
    } catch (e) {
      console.error("Unsave exception:", e);
      setCandidates(prev);
    } finally {
      setBusyId(null);
    }
  };

  // ✅✅✅ التعديل هنا: يروح لصفحة job applications ويفتح نفس applicant
  const viewProfile = (c: SavedCandidate) => {
    setMenuOpenFor(null);

    // 1) الأفضل: لو عندي jobId + applicationId
    if (c.jobId && c.applicationId) {
      router.push(`/employer/jobs/${c.jobId}/applications?app=${c.applicationId}`);
      return;
    }

    // 2) لو عندي jobId بس
    if (c.jobId) {
      router.push(`/employer/jobs/${c.jobId}/applications`);
      return;
    }

    // 3) fallback
    router.push(`/employer/saved`);
  };

  const sendEmail = (c: SavedCandidate) => {
    setMenuOpenFor(null);
    if (!c.email) return;

    const subject = encodeURIComponent("Regarding your application");
    const body = encodeURIComponent(
      `Hi ${c.name},\n\nI reviewed your profile and would like to discuss next steps.\n\nBest regards,`
    );
    window.open(`mailto:${c.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const downloadCv = (c: SavedCandidate) => {
    setMenuOpenFor(null);
    if (!c.cvFileUrl) return;

    const url =
      c.cvFileUrl.startsWith("http") || c.cvFileUrl.startsWith("blob:")
        ? c.cvFileUrl
        : `${API_BASE_URL}${c.cvFileUrl.startsWith("/") ? "" : "/"}${c.cvFileUrl}`;

    window.open(url, "_blank");
  };

  return (
    <CompanyGuard>
    <div className="min-h-screen bg-black text-white flex flex-col">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {searchTerm.trim()
                 ? `${searchTerm.toUpperCase()} Candidates (${filteredCount})`
                  : `Saved Candidates (${candidates.length})`}
              </h1>

              <input
                type="text"
                 placeholder="Search by skill or specialization (e.g. backend, ai...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full mb-4 p-2 rounded bg-black border border-gray-700 text-white"
              />

              <p className="text-xs text-gray-500 mt-1">
                Keep track of top candidates and quickly reach out.
              </p>
            </div>

            <button
              onClick={fetchSaved}
              className="text-sm px-4 py-2 rounded-xl border border-gray-800 bg-[#0f0f0f] hover:bg-[#141414] transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="border border-gray-800 rounded-2xl bg-[#0f0f0f] p-6">
              <p className="text-gray-400">Loading saved candidates...</p>
            </div>
          ) : error ? (
            <div className="border border-red-800 bg-red-950/40 text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          ) : candidates.length === 0 ? (
            <div className="border border-gray-800 rounded-2xl p-6 bg-[#0f0f0f]">
              <p className="text-gray-400 text-sm">You don&apos;t have any saved candidates yet.</p>
              <p className="text-gray-500 text-xs mt-2">
                Go to <span className="font-semibold">Job Applications</span> and save a candidate from the card menu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((c) => {
                const busy = busyId === c.savedId;

                return (
                  <div
                    key={c.savedId}
                    className="group border border-gray-800 bg-[#0f0f0f] hover:bg-[#121212] transition rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    {/* LEFT */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative">
                        {c.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              c.avatarUrl.startsWith("http")
                                ? c.avatarUrl
                                : `${API_BASE_URL}${c.avatarUrl.startsWith("/") ? "" : "/"}${c.avatarUrl}`
                            }
                            alt={c.name}
                            className="h-12 w-12 rounded-full object-cover border border-gray-800"
                          />
                        ) : (
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center font-bold border border-gray-800"
                            style={{ backgroundColor: BRAND_BLUE, color: "#000" }}
                            title={c.name}
                          >
                            {initials(c.name)}
                          </div>
                        )}

                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-black border border-gray-800 flex items-center justify-center">
                          <BookmarkCheck className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold truncate">{c.name}</p>

                          {c.jobTitle ? (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-gray-800 bg-black/30 text-gray-300">
                              <Briefcase className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[260px]">{c.jobTitle}</span>
                            </span>
                          ) : (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-gray-800 bg-black/30 text-gray-500">
                              <User className="h-3.5 w-3.5" />
                              No job title
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-400">
                          {c.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {c.location}
                            </span>
                          ) : (
                            <span className="text-gray-600">No location</span>
                          )}

                          {c.appliedAt ? (
                            <span className="inline-flex items-center gap-1 text-gray-500">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(c.appliedAt)}
                            </span>
                          ) : null}

                          {c.email ? (
                            <span className="hidden md:inline-flex items-center gap-1 text-gray-500 truncate">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[280px]">{c.email}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={busy}
                        onClick={() => unsaveCandidate(c.savedId)}
                        className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-800 bg-black/20 hover:bg-black/40 transition text-sm disabled:opacity-60"
                        title="Remove from saved"
                      >
                        <Bookmark className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                        <span className="text-gray-200">{busy ? "Removing..." : "Unsave"}</span>
                      </button>

                      <button
  onClick={() => {
    if (!c.jobId || !c.applicationId) {
      alert("Job or Application ID is missing");
      return;
    }

    router.push(
      `/employer/jobs/${c.jobId}/applications?app=${c.applicationId}`
    );
  }}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-black font-semibold"
  style={{ backgroundColor: "#D9FBE7" }}
>
  View Profile
  <ExternalLink className="h-4 w-4" />
</button>



                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenFor((p) => (p === c.savedId ? null : c.savedId))}
                          className="h-10 w-10 rounded-xl border border-gray-800 bg-black/20 hover:bg-black/40 transition inline-flex items-center justify-center"
                          title="More actions"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-200" />
                        </button>

                        {menuOpenFor === c.savedId && (
                          <>
                            <button
                              aria-label="Close menu"
                              onClick={() => setMenuOpenFor(null)}
                              className="fixed inset-0 z-40 cursor-default"
                            />

                            <div className="absolute right-0 mt-2 w-56 z-50 rounded-2xl border border-gray-800 bg-[#0b0b0b] shadow-xl overflow-hidden">
                              <div className="px-3 py-2 flex items-center justify-between border-b border-gray-800">
                                <p className="text-xs text-gray-400">Candidate actions</p>
                                <button
                                  onClick={() => setMenuOpenFor(null)}
                                  className="h-7 w-7 rounded-lg border border-gray-800 bg-black/30 hover:bg-black/50 flex items-center justify-center"
                                  title="Close"
                                >
                                  <X className="h-4 w-4 text-gray-300" />
                                </button>
                              </div>

                              <button
                                onClick={() => sendEmail(c)}
                                disabled={!c.email}
                                className="w-full px-4 py-3 flex items-center gap-2 text-sm hover:bg-[#111] transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Mail className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                                <span>Send Email</span>
                                {!c.email && <span className="ml-auto text-[11px] text-gray-600">No email</span>}
                              </button>

                              <button
                                onClick={() => downloadCv(c)}
                                disabled={!c.cvFileUrl}
                                className="w-full px-4 py-3 flex items-center gap-2 text-sm hover:bg-[#111] transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Download className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                                <span>Download CV</span>
                                {!c.cvFileUrl && <span className="ml-auto text-[11px] text-gray-600">No CV</span>}
                              </button>

                              <div className="border-t border-gray-800" />

                              <button
                                onClick={() => unsaveCandidate(c.savedId)}
                                disabled={busy}
                                className="w-full px-4 py-3 flex items-center gap-2 text-sm hover:bg-[#111] transition disabled:opacity-60"
                              >
                                <Bookmark className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                                <span>{busy ? "Removing..." : "Remove from Saved"}</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <footer className="w-full mt-12 py-4 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2025 CareerBridge - Job Portal. All rights reserved
      </footer>
    </div>
    </CompanyGuard>
  );
}
