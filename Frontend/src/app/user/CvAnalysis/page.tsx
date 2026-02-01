"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { usePostData } from "../create-cv/FinalCV/postData/usePostData";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type AnalysisResponse = {
  objective?: string;
  strengths?: string[] | string;
  weaknesses?: string[] | string;
  suggestions?: string[] | string;
  matching_analysis?: string;
  matching_jobs?: any;
  [key: string]: any;
};

function toList(value?: string[] | string): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(/\n|•|-|,/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function CvAnalysisPage() {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  // const {data:DataAi,loading:isLoaded}=usePostData()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)
   const [dataAi, setDataAi] = useState<any>(null);;

  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem("cvAnalysis");
    if (storedData) {
      setDataAi(JSON.parse(storedData));
    }
  }, []);
  /* ================= FETCH ANALYSIS ================= */

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("You must login first.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/analyze-cv/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const text = await res.text();
      let json: any = null;

      try {
        json = JSON.parse(text);
      } catch {
        setError("Backend did not return JSON:\n" + text);
        return;
      }

      if (!res.ok) {
        const errMsg =
          typeof json === "string"
            ? json
            : json.error || JSON.stringify(json);
        setError(String(errMsg));
        return;
      }

      const strengthsList = toList(json.description);
      const suggestionsList = Array.isArray(json.recommendation)
        ? json.recommendation.map((r: any) =>
            `${r.job_title || "Job"}: ${r.action || ""}`.trim()
          )
        : toList(json.recommendation);

      const matchingText = Array.isArray(json.matching_analysis)
        ? json.matching_analysis
            .map((m: any) => m.job_title)
            .filter(Boolean)
            .join(", ")
        : json.matching_analysis
        ? String(json.matching_analysis)
        : "";

      setData({
        ...json,
        objective: strengthsList[0],
        strengths: strengthsList,
        suggestions: suggestionsList,
        matching_analysis: matchingText,
      });
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strengths = toList(data?.strengths);
  const weaknesses = toList(data?.weaknesses);
  const suggestions = toList(data?.suggestions);

  const matchingSummary =
    data?.matching_analysis ||
    data?.matching_summary ||
    data?.summary ||
    "No matching analysis found.";

  /* =========================
     ✅ DOWNLOAD PDF (PUPPETEER)
     ========================= */
  const downloadFinalCvPdf = async () => {
    setDownloading(true);

    try {
      const token = localStorage.getItem("access");
      if (!token) return; // من غير رسائل

      const res = await fetch("/api/cv/final/pdf", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      // لو فشل: ما تعرضش حاجة
      if (!res.ok) return;

      const blob = await res.blob();

      // لو الملف فاضي/مش صحيح: برضه ما تعرضش حاجة
      if (!blob || blob.size < 500) return;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Final_CV.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // تجاهل أي خطأ بدون UI
    } finally {
      setDownloading(false);
    }
  };
 if (!dataAi) return <div>Loading...</div>;
  /* ================= RENDER ================= */

  return (
    <main className="bg-black min-h-screen text-white flex flex-col">
      <Navbar />

      <div className="flex-1 px-4 py-8 flex flex-col items-center">
   
        <div className="w-full max-w-5xl bg-[#050816] border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-slate-800">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-sky-400">
                AI CV Analysis
              </h1>
              <p className="text-sm text-slate-300">
                Automatic job objective & matching analysis via AI
              </p>
            </div>
          </div>

     <section className="bg-gray-900 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Matching Roles</h2>
        <ul className="list-disc list-inside">
          {dataAi.matching_analysis.map((role: any, idx: number) => (
            <li className="" key={idx}>{role.job_title|| role}</li>
          ))}
        </ul>
      </section>

      {/* Description */}
      <section className="bg-gray-900 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Descriptions</h2>
        {dataAi.description.map((desc: string, idx: number) => (
          <p key={idx} className="mb-2">{desc}</p>
        ))}
      </section>

      {/* Recommendations */}
      <section className="bg-gray-900 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Recommendations</h2>
        {dataAi.recommendation.map((rec: any, idx: number) => (
          <div key={idx} className="mb-3 p-3 border-l-4 border-blue-500 bg-gray-900  rounded shadow-sm">
            <h3 className="font-semibold">{rec.job_title}</h3>
            <p>{rec.action}</p>
          </div>
        ))}
      </section>


    
   
        </div>

        {/* ======= BOTTOM BUTTONS ======= */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={downloadFinalCvPdf}
            disabled={downloading}
            className="px-6 py-2 border border-slate-700 rounded-md hover:bg-white/10 transition disabled:opacity-60"
          >
            {downloading ? "Preparing PDF…" : "Download CV (PDF)"}
          </button>

          <button
            onClick={() => (window.location.href = "/user/jobs")}
            className="px-6 py-2 bg-primary text-zinc-900 font-semibold rounded-md hover:bg-white/70 transition"
          >
            Find Your Job →
          </button>
        </div>

      </div>

      <Footer />
    </main>
  );
}
