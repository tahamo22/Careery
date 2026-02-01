"use client";

import Sidebar from "@/components/employer/Sidebar";
import MainNavbar from "@/components/employer/MainNavbar";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CompanyGuard from "@/components/employer/CompanyGuard";

import {
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const BRAND_BLUE = "#3B82F6";

// يرجّع أول حرف من الاسم
const getInitial = (name: string) =>
  (name && name.trim().charAt(0).toUpperCase()) || "?";

// ✅ Decode HTML entities مثل &amp;
const decodeHtml = (input: string) => {
  if (!input) return "";
  if (typeof window === "undefined") return input;
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent || "";
};

// ✅ Format skills مهما كان شكلها (string / array strings / array objects / object)
const formatSkills = (skills: any): string => {
  if (!skills) return "";

  if (typeof skills === "string") return decodeHtml(skills);

  if (Array.isArray(skills)) {
    if (skills.every((x) => typeof x === "string")) {
      return decodeHtml(skills.filter(Boolean).join(", "));
    }

    const lines: string[] = [];
    for (const s of skills) {
      if (!s) continue;

      if (typeof s === "object") {
        const category =
          s.category || s.title || s.group || s.type || s.name || "";
        const itemsRaw = s.items || s.values || s.list || s.skills || "";

        let items = "";
        if (Array.isArray(itemsRaw)) items = itemsRaw.filter(Boolean).join(", ");
        else items = String(itemsRaw || "");

        const line = category
          ? `${decodeHtml(String(category))}: ${decodeHtml(items)}`
          : decodeHtml(items || JSON.stringify(s));

        if (line.trim()) lines.push(line.trim());
        continue;
      }

      lines.push(String(s));
    }

    return lines.join("\n");
  }

  if (typeof skills === "object") {
    const category = skills.category || skills.title || skills.name || "";
    const itemsRaw = skills.items || skills.values || skills.list || "";

    let items = "";
    if (Array.isArray(itemsRaw)) items = itemsRaw.filter(Boolean).join(", ");
    else items = String(itemsRaw || "");

    const out = category ? `${category}: ${items}` : JSON.stringify(skills);
    return decodeHtml(out);
  }

  return decodeHtml(String(skills));
};

// ✅ يحوّل أي URL إلى URL كامل (لو جاي relative من Django)
const toAbsoluteUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

// ✅ Build latest endpoint (view=1 inline, view=0 attachment)
const buildLatestEndpoint = (candidateId: number, view: 0 | 1) =>
  `${API_BASE_URL}/api/cv/pdf/latest/?candidate_id=${candidateId}&kind=final&view=${view}`;

// ✅ Helper: attach/replace view param safely
const withViewParam = (url: string, view: 0 | 1) => {
  const absolute = toAbsoluteUrl(url);
  if (!absolute) return "";

  // remove any existing view param
  const u = new URL(absolute);
  u.searchParams.set("view", String(view));
  return u.toString();
};

// ✅ Helper: open url in new tab with token (no alerts)
const openPdfInNewTabWithToken = (absoluteUrl: string) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  if (!token) {
    console.error("[PDF] Missing token");
    return;
  }

  const newTab = window.open("about:blank", "_blank", "noopener,noreferrer");

  if (!newTab) {
    console.error("[PDF] Popup blocked");
    return;
  }

  // write a minimal HTML that fetches pdf with Authorization and shows it inline
  // ✅ NO alerts (only console errors)
  newTab.document.open();
  newTab.document.write(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CV PDF</title>
  <style>
    html, body { margin:0; padding:0; height:100%; background:#111; }
    .wrap { height:100%; display:flex; align-items:center; justify-content:center; color:#bbb; font-family: Arial, sans-serif; }
    iframe { width:100%; height:100%; border:0; }
  </style>
</head>
<body>
  <div class="wrap" id="status">Loading PDF...</div>
  <script>
    (async function(){
      try {
        const res = await fetch(${JSON.stringify(absoluteUrl)}, {
          method: "GET",
          headers: { "Authorization": "Bearer ${token}" },
          cache: "no-store"
        });

        if(!res.ok){
          const txt = await res.text().catch(()=> "");
          console.error("PDF fetch failed:", res.status, txt);
          document.getElementById("status").textContent = "Unable to load PDF.";
          return;
        }

        const ct = res.headers.get("content-type") || "";
        if(!ct.includes("application/pdf")){
          const txt = await res.text().catch(()=> "");
          console.error("Not a PDF:", ct, txt);
          document.getElementById("status").textContent = "Server did not return a PDF.";
          return;
        }

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const iframe = document.createElement("iframe");
        iframe.src = blobUrl;
        document.body.innerHTML = "";
        document.body.appendChild(iframe);

        // revoke later
        setTimeout(()=> URL.revokeObjectURL(blobUrl), 60_000);
      } catch(e){
        console.error(e);
        document.getElementById("status").textContent = "Unable to load PDF.";
      }
    })();
  </script>
</body>
</html>
  `);
  newTab.document.close();
};

// ✅ VIEW PDF (يفتحه في Tab جديد ويعرضه inline - بدون Alerts)
const viewPdf = async (fileUrl: string) => {
  try {
    // ✅ always force view=1 for view
    const absolute = withViewParam(fileUrl, 1);
    if (!absolute) return;
    openPdfInNewTabWithToken(absolute);
  } catch (err) {
    console.error(err);
    // no alert
  }
};

// ✅ DOWNLOAD PDF (تحميل فعلي + بدون Alerts)
const downloadPdf = async (fileUrl: string, fileName: string) => {
  try {
    // ✅ always force view=0 for download
    const absolute = withViewParam(fileUrl, 0);
    if (!absolute) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("access") : null;

    if (!token) {
      console.error("[PDF] Missing token");
      return;
    }

    const res = await fetch(absolute, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[PDF] Download failed:", res.status, txt);
      return;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/pdf")) {
      const txt = await res.text().catch(() => "");
      console.error("[PDF] Not PDF:", contentType, txt);
      return;
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || "CV.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error(err);
    // no alert
  }
};

export default function JobApplicationsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [columns, setColumns] = useState([
    { name: "All Applications", apps: [] as any[] },
    { name: "Shortlisted", apps: [] as any[] },
  ]);

  const [columnMenuOpen, setColumnMenuOpen] = useState<number | null>(null);
  const [cardMenuOpen, setCardMenuOpen] = useState<{
    colIndex: number;
    appIndex: number;
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newColumn, setNewColumn] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editColumnIndex, setEditColumnIndex] = useState<number | null>(null);
  const [editColumnName, setEditColumnName] = useState("");

  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ✅ جديد: هنخزن candidateId (عشان نطلب latest endpoint وقت الضغط)
  const [cvFetchLoading, setCvFetchLoading] = useState(false);

  // ✅ هات latest PDF endpoint (بس يرجّعه كـ URL، مش هنحمل هنا)
  const ensureLatestCvUrl = async (candidateId: number) => {
    if (!candidateId) throw new Error("Missing candidateId for this applicant.");

    const token =
      typeof window !== "undefined" ? localStorage.getItem("access") : null;

    if (!token) throw new Error("Missing token. Please login again.");

    // request صغير للتأكد إن PDF موجود ومسموح
    const probeUrl = buildLatestEndpoint(candidateId, 1);

    setCvFetchLoading(true);
    try {
      console.log("[LatestCV] probing:", probeUrl);

      const res = await fetch(probeUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("401 Unauthorized. Login again.");
        if (res.status === 403)
          throw new Error("403 Forbidden. Company not allowed for this candidate.");
        if (res.status === 404)
          throw new Error("404 Not Found. Candidate has no latest PDF uploaded.");
        throw new Error(`Failed (${res.status}). ${txt || ""}`.trim());
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/pdf")) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Not a PDF response. Content-Type=${ct}. ${txt || ""}`.trim()
        );
      }

      // ✅ لو وصلنا هنا يبقى موجود ومسموح
      return {
        viewUrl: buildLatestEndpoint(candidateId, 1),
        downloadUrl: buildLatestEndpoint(candidateId, 0),
        filename: `candidate_${candidateId}_CV.pdf`,
      };
    } finally {
      setCvFetchLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;

      if (!token) {
        setError("You must be logged in as employer.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/applications/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.detail || "Failed to load applications.");
        return;
      }

      const appsMapped = Array.isArray(data)
        ? data.map((a: any) => {
            const u = a.user || {};
            const cv = a.cv || {};

            const candidateId =
              u.id ??
              u.pk ??
              a.user_id ??
              a.candidate_id ??
              a.candidateId ??
              null;

            // ✅ DEBUG مهم جدًا
            console.log("[APP] applicationId=", a.id, "candidateId=", candidateId);

            return {
              id: a.id,
              candidateId,

              name: a.applicant_name || u.full_name || "Unknown",
              role: "Applicant",

              objective: cv.objective || "",
              skills: (cv as any).skills_text || cv.skills || [],
              experiences: cv.experiences || [],
              profileSummary: "",
              coverLetter: a.cover_letter || "No cover letter.",

              email: a.applicant_email || u.email || "",
              phone: cv.phone || "",
              location: cv.location || "",

              cvGeneratedUrl: cv.cv_generated || null,
              uploadedCvUrl:
                cv.uploaded_cv || cv.original_cv || cv.file || cv.pdf || null,

              is_saved: a.is_saved ?? false,
            };
          })
        : [];

      setColumns((prev) => [
        { ...prev[0], name: "All Applications", apps: appsMapped },
        prev[1] || { name: "Shortlisted", apps: [] },
      ]);
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Server error while fetching applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (loading) return;

    const appIdStr = searchParams.get("app");
    const appId = appIdStr ? Number(appIdStr) : NaN;
    if (!Number.isFinite(appId)) return;

    const allApps = columns.flatMap((c) => c.apps);
    const found = allApps.find((x: any) => Number(x.id) === appId);
    if (found) {
      setSelectedApplicant(found);
      setShowProfileModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading]);

  useEffect(() => {
    if (loading) return;

    const appIdStr = searchParams.get("app");
    const appId = appIdStr ? Number(appIdStr) : NaN;
    if (!Number.isFinite(appId)) return;

    const el = cardRefs.current[appId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading, searchParams, columns]);

  // ================= COLUMN ACTIONS =================
  const handleAddColumn = () => {
    if (newColumn.trim() !== "") {
      setColumns([...columns, { name: newColumn, apps: [] }]);
      setNewColumn("");
      setShowAddModal(false);
    }
  };

  const handleEditColumn = () => {
    if (editColumnName.trim() !== "" && editColumnIndex !== null) {
      const updated = [...columns];
      updated[editColumnIndex].name = editColumnName;
      setColumns(updated);
      setEditColumnIndex(null);
      setEditColumnName("");
      setShowEditModal(false);
    }
  };

  const handleDeleteColumn = (index: number) => {
    const updated = [...columns];
    updated.splice(index, 1);
    setColumns(updated);
    setColumnMenuOpen(null);
  };

  const moveCandidate = async (applicationId: number, stage: string) => {
    try {
      const token = localStorage.getItem("access");
      if (!token) return alert("Please login again");

      const res = await fetch(
        `${API_BASE_URL}/api/applications/${applicationId}/move_stage/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stage }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Failed to move candidate");
        return;
      }

      await fetchApplications();
      setCardMenuOpen(null);
    } catch (err) {
      console.error(err);
      alert("Server error while moving candidate");
    }
  };

  const handleToggleSave = async (applicationId: number) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) return alert("Please log in again as an employer.");

      const res = await fetch(
        `${API_BASE_URL}/api/applications/${applicationId}/toggle-save/`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.detail || data.error || "Failed to save candidate.");
        return;
      }

      setColumns((prevCols) =>
        prevCols.map((col) => ({
          ...col,
          apps: col.apps.map((app: any) =>
            Number(app.id) === Number(applicationId)
              ? { ...app, is_saved: data.saved }
              : app
          ),
        }))
      );
    } catch (err) {
      console.error("Toggle save error:", err);
      alert("Something went wrong while saving candidate.");
    }
  };

  const handleSaveToSavedCandidates = async (app: any) => {
    setCardMenuOpen(null);
    await handleToggleSave(Number(app.id));
  };

  // ✅ Download CV: لو مفيش URL جاهز، نجيب latest
  const handleDownloadCV = async (app: any) => {
    try {
      // اسم الملف
      const fileName = `${(app.name || "candidate")
        .toString()
        .trim()
        .replace(/\s+/g, "_")}_CV.pdf`;

      // لو عندك رابط مباشر من الـ CV data استخدمه
      let url = app.cvGeneratedUrl || app.uploadedCvUrl || null;

      // لو مفيش → ابني latest download endpoint مباشرة (بدون fetch probe)
      if (!url) {
        const candidateId = Number(app.candidateId);
        if (!candidateId) {
          console.error("Missing candidateId");
          return;
        }
        url = buildLatestEndpoint(candidateId, 0); // view=0 => download
      }

      // نفّذ التحميل
      await downloadPdf(url, fileName);
      setCardMenuOpen(null);
    } catch (e) {
      console.error(e);
    }
  };

  // ✅ View CV: لو مفيش URL جاهز، نجيب latest
  const handleViewCV = async (app: any) => {
    try {
      let url = app.cvGeneratedUrl || app.uploadedCvUrl || null;

      if (!url) {
        const candidateId = Number(app.candidateId);
        const latest = await ensureLatestCvUrl(candidateId);
        url = latest.viewUrl;
      }

      if (!url) return alert("This candidate has no CV file to view.");

      // ✅ open in new tab and render inline (no download)
      await viewPdf(url);
    } catch (e: any) {
      // ✅ remove alert (no message)
      console.error(e);
    }
  };

  const handleContactCandidate = (app: any) => {
    if (!app.email) return alert("No email found for this candidate.");
    window.location.href = `mailto:${app.email}?subject=Regarding your application`;
    setCardMenuOpen(null);
  };

  const openProfile = (app: any) => {
    setSelectedApplicant(app);
    setShowProfileModal(true);
    router.replace(`/employer/jobs/${jobId}/applications?app=${app.id}`);
  };

  const closeProfile = () => {
    setShowProfileModal(false);
    setSelectedApplicant(null);
    router.replace(`/employer/jobs/${jobId}/applications`);
  };

  // ================= RENDER =================
  return (
    <CompanyGuard>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <MainNavbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-6">
            <h1 className="text-2xl font-bold mb-6">Job Applications</h1>

            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded text-sm font-medium text-white"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                + Create Column
              </button>
            </div>

            {loading ? (
              <p className="text-gray-400">Loading applications...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {columns.map((col, colIdx) => (
                  <div
                    key={colIdx}
                    className="bg-[#111] rounded-lg p-4 relative border border-gray-800"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h2 className="font-semibold">
                          {col.name} ({col.apps.length})
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          {col.name === "All Applications"
                            ? "All received applications"
                            : col.name === "Shortlisted"
                            ? "Candidates you want to follow up with"
                            : "Custom stage"}
                        </p>
                      </div>

                      <div className="relative">
                        <button
                          className="text-gray-400 hover:text-white text-xl px-2"
                          onClick={() =>
                            setColumnMenuOpen(
                              columnMenuOpen === colIdx ? null : colIdx
                            )
                          }
                        >
                          ⋮
                        </button>
                        {columnMenuOpen === colIdx && (
                          <div className="absolute right-0 mt-2 w-40 bg-[#1c1c1c] border border-gray-700 rounded shadow-lg z-50">
                            <button
                              onClick={() => {
                                setEditColumnIndex(colIdx);
                                setEditColumnName(col.name);
                                setShowEditModal(true);
                                setColumnMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white text-sm"
                            >
                              Edit Column
                            </button>
                            <button
                              onClick={() => handleDeleteColumn(colIdx)}
                              className="w-full text-left px-4 py-2 hover:bg-red-600 text-red-400 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {col.apps.length === 0 && (
                        <p className="text-gray-500 text-sm">
                          No applications yet
                        </p>
                      )}

                      {col.apps.map((app, appIdx) => {
                        const key = `${colIdx}-${appIdx}`;
                        const initial = getInitial(app.name);

                        return (
                          <div
                            key={key}
                            ref={(el) => {
                              cardRefs.current[app.id] = el;
                            }}
                            className={`p-4 rounded-lg transition relative cursor-pointer
                              ${
                                String(app.id) === searchParams.get("app")
                                  ? "bg-green-500/10 border-2 border-green-400 ring-2 ring-green-500"
                                  : "bg-[#1c1c1c] hover:bg-[#222] border border-gray-800"
                              }
                            `}
                            onClick={() => openProfile(app)}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm"
                                style={{
                                  backgroundColor: BRAND_BLUE,
                                  color: "#000",
                                }}
                              >
                                {initial}
                              </div>

                              <div className="flex-1">
                                <p className="font-medium">{app.name}</p>
                                <p className="text-gray-400 text-xs">
                                  {app.role}
                                  {app.location ? ` • ${app.location}` : ""}
                                </p>
                                {app.email && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    {app.email}
                                  </p>
                                )}
                              </div>

                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="relative"
                              >
                                <button
                                  className="text-gray-400 hover:text-white text-xl px-2"
                                  onClick={() =>
                                    setCardMenuOpen(
                                      cardMenuOpen &&
                                        cardMenuOpen.colIndex === colIdx &&
                                        cardMenuOpen.appIndex === appIdx
                                        ? null
                                        : { colIndex: colIdx, appIndex: appIdx }
                                    )
                                  }
                                >
                                  ⋮
                                </button>

                                {cardMenuOpen &&
                                  cardMenuOpen.colIndex === colIdx &&
                                  cardMenuOpen.appIndex === appIdx && (
                                    <div className="absolute right-0 top-8 w-56 bg-[#1c1c1c] border border-gray-700 rounded-lg shadow-lg z-50">
                                      {col.name !== "All Applications" && (
                                        <button
                                          className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveCandidate(app.id, "all");
                                          }}
                                        >
                                          Move to “All Applications”
                                        </button>
                                      )}

                                      {col.name !== "Shortlisted" && (
                                        <button
                                          className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveCandidate(app.id, "shortlisted");
                                          }}
                                        >
                                          Move to “Shortlisted”
                                        </button>
                                      )}

                                      <button
                                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white"
                                        onClick={() =>
                                          handleSaveToSavedCandidates(app)
                                        }
                                      >
                                        {app.is_saved
                                          ? "Remove from Saved"
                                          : "Save to Saved Candidates"}
                                      </button>

                                      <button
                                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white"
                                        onClick={() => handleDownloadCV(app)}
                                      >
                                        Download CV
                                      </button>

                                      <button
                                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-white"
                                        onClick={() =>
                                          handleContactCandidate(app)
                                        }
                                      >
                                        Contact Candidate
                                      </button>
                                    </div>
                                  )}
                              </div>
                            </div>

                            <p className="text-sm text-gray-400">
                              Click to view full profile & CV
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* ====== PROFILE / CV MODAL ====== */}
        {showProfileModal && selectedApplicant && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6">
            <div className="bg-[#050505] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800 relative">
              <button
                onClick={closeProfile}
                className="absolute top-4 right-4 text-white text-2xl"
              >
                ✕
              </button>

              <div className="flex flex-col lg:flex-row justify-between items-start gap-4 px-8 pt-8 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-4">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-semibold"
                    style={{ backgroundColor: BRAND_BLUE, color: "#000" }}
                  >
                    {getInitial(selectedApplicant.name)}
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedApplicant.name}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {selectedApplicant.role}
                      {selectedApplicant.location
                        ? ` • ${selectedApplicant.location}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/employer/saved")}
                    className="h-10 w-10 rounded-md border border-gray-700 flex items-center justify-center hover:bg-[#111]"
                  >
                    <Sparkles className="h-5 w-5" style={{ color: BRAND_BLUE }} />
                  </button>

                  <button
                    onClick={() => handleContactCandidate(selectedApplicant)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Send Mail</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[2.1fr_1fr] gap-8 px-8 pb-8 pt-4">
                {/* LEFT */}
                <div className="space-y-6">
                  {selectedApplicant.objective && (
                    <section className="bg-[#0b0b0b] rounded-xl p-5 border border-gray-800">
                      <h3 className="text-xs font-semibold tracking-[0.18em] text-gray-400 mb-2">
                        OBJECTIVE
                      </h3>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {selectedApplicant.objective}
                      </p>
                    </section>
                  )}

                  {selectedApplicant.skills &&
                    String(selectedApplicant.skills).trim() !== "" && (
                      <section className="bg-[#0b0b0b] rounded-xl p-5 border border-gray-800">
                        <h3 className="text-xs font-semibold tracking-[0.18em] text-gray-400 mb-2">
                          SKILLS
                        </h3>
                        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                          {formatSkills(selectedApplicant.skills) ||
                            "No skills provided"}
                        </p>
                      </section>
                    )}

                  {selectedApplicant.experiences &&
                    selectedApplicant.experiences.length > 0 && (
                      <section className="bg-[#0b0b0b] rounded-xl p-5 border border-gray-800">
                        <h3 className="text-xs font-semibold tracking-[0.18em] text-gray-400 mb-4">
                          EXPERIENCE
                        </h3>
                        <div className="space-y-3 text-sm text-gray-200">
                          {selectedApplicant.experiences.map(
                            (exp: any, idx: number) => (
                              <div key={idx}>
                                <p className="font-semibold">
                                  {exp.role} {exp.company ? `@ ${exp.company}` : ""}
                                </p>
                                {(exp.from || exp.to) && (
                                  <p className="text-gray-400 text-xs">
                                    {exp.from || ""} {exp.to ? `- ${exp.to}` : ""}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </section>
                    )}

                  <section className="bg-[#0b0b0b] rounded-xl p-5 border border-gray-800">
                    <h3 className="text-xs font-semibold tracking-[0.18em] text-gray-400 mb-2">
                      MOTIVATION / COVER LETTER
                    </h3>
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                      {selectedApplicant.coverLetter || "No cover letter."}
                    </p>
                  </section>
                </div>

                {/* RIGHT */}
                <div className="space-y-6 text-sm">
                  <section className="bg-[#0b0b0b] rounded-xl p-5 border border-gray-800 space-y-3">
                    <h3 className="text-xs font-semibold tracking-[0.18em] text-gray-400 mb-2">
                      CANDIDATE SNAPSHOT
                    </h3>

                    {selectedApplicant.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4" style={{ color: BRAND_BLUE }} />
                        <div>
                          <p className="text-[11px] text-gray-400">LOCATION</p>
                          <p className="text-gray-200">{selectedApplicant.location}</p>
                        </div>
                      </div>
                    )}

                    {selectedApplicant.experiences &&
                      selectedApplicant.experiences.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Briefcase className="mt-0.5 h-4 w-4" style={{ color: BRAND_BLUE }} />
                          <div>
                            <p className="text-[11px] text-gray-400">EXPERIENCE</p>
                            <p className="text-gray-200">
                              {selectedApplicant.experiences.length} role
                              {selectedApplicant.experiences.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      )}
                  </section>

                  {/* ✅ CONTACT INFORMATION */}
                  <section className="bg-[#0b0b0b] rounded-xl p-5 border border-gray-800 space-y-3">
                    <h3 className="text-xs font-semibold tracking-[0.18em] text-gray-400 mb-2">
                      CONTACT INFORMATION
                    </h3>

                    {selectedApplicant.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="mt-0.5 h-4 w-4" style={{ color: BRAND_BLUE }} />
                        <div>
                          <p className="text-[11px] text-gray-400">EMAIL</p>
                          <p className="text-gray-200 break-all">{selectedApplicant.email}</p>
                        </div>
                      </div>
                    )}

                    {selectedApplicant.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="mt-0.5 h-4 w-4" style={{ color: BRAND_BLUE }} />
                        <div>
                          <p className="text-[11px] text-gray-400">PHONE</p>
                          <p className="text-gray-200">{selectedApplicant.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* ✅ Buttons */}
                    <div className="pt-2 border-t border-gray-800 space-y-2">
                      

                      <button
                        disabled={cvFetchLoading}
                        onClick={async () => handleDownloadCV(selectedApplicant)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md bg-black border text-xs
                          ${
                            cvFetchLoading
                              ? "border-gray-800 opacity-60 cursor-not-allowed"
                              : "border-gray-700 hover:border-blue-500"
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <Download className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                          <span>Download CV</span>
                        </span>
                        <Download className="h-4 w-4" style={{ color: BRAND_BLUE }} />
                      </button>

                      {!selectedApplicant.candidateId && (
                        <p className="text-[11px] text-red-400">
                          candidateId is missing in this application response (backend serializer issue).
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== ADD / EDIT COLUMN MODALS ====== */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#111] p-6 rounded-lg w-[400px] border border-gray-700">
              <h2 className="text-lg font-bold mb-4">Add New Column</h2>
              <input
                type="text"
                value={newColumn}
                onChange={(e) => setNewColumn(e.target.value)}
                placeholder="Column Name"
                className="w-full p-2 rounded bg-black border border-gray-600 text-white mb-4 text-sm"
              />
              <div className="flex justify-between">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddColumn}
                  className="px-4 py-2 rounded text-sm text-white"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  Add Column
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#111] p-6 rounded-lg w-[400px] border border-gray-700">
              <h2 className="text-lg font-bold mb-4">Edit Column</h2>
              <input
                type="text"
                value={editColumnName}
                onChange={(e) => setEditColumnName(e.target.value)}
                placeholder="Column Name"
                className="w-full p-2 rounded bg-black border border-gray-600 text-white mb-4 text-sm"
              />
              <div className="flex justify-between">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditColumn}
                  className="px-4 py-2 rounded text-sm text-white"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="w-full mt-16 py-4 text-center text-gray-500 text-sm border-t border-gray-700">
          © 2025 CareerBridge - Job Portal. All rights reserved
        </footer>
      </div>
    </CompanyGuard>
  );
}
