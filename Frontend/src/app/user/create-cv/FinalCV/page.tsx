"use client";
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";



import { usePostData } from "./postData/usePostData";
import { useRouter } from "next/navigation";



const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type SkillCategory = {
  category: string;
  items: string;
};

type Education = {
  degree?: string;
  school?: string;
  from?: string;
  to?: string;
  location?: string;
  desc?: string;
};

type Experience = {
  role?: string;
  company?: string;
  location?: string;
  from?: string;
  to?: string;
  tasks?: string[];
};

type Project = {
  title?: string;
  subtitle?: string;
  details?: string;
  from?: string;
  to?: string;
  location?: string;
};

type CustomSectionItem = {
  title?: string;
  subtitle?: string;
  details?: string;
  key_achievements?: string[];
  from?: string;
  to?: string;
  location?: string;
};

type CustomSection = {
  section_name?: string;
  items?: CustomSectionItem[];
};

export type CVData = {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  objective?: string;
  skills?: SkillCategory[];
  educations?: Education[];
  experiences?: Experience[];
  projects?: Project[];
  custom_sections?: CustomSection[];
  cv_generated?: any;
  cv_analysis?: any;
  user?: number;
};

/* ================= HELPERS ================= */

function normalizeBullets(input: string | string[] | undefined | null): string[] {
  if (!input) return [];

  let parts: string[] = [];

  if (Array.isArray(input)) {
    input.forEach((item) => {
      if (typeof item === "string") {
        parts.push(...item.split(/[\n•]/g));
      }
    });
  } else if (typeof input === "string") {
    parts = input.split(/[\n•]/g);
  }

  return parts.map((t) => t.trim()).filter((t) => t.length > 0);
}

function cleanText(text?: string | null) {
  if (!text) return "";

  let decoded = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  return decoded.replace(/\s+/g, " ").replace(/<br\s*\/?>/gi, " ").trim();
}

function SafeText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;

  let decoded = String(text);

  while (decoded.includes("&amp;")) {
    decoded = decoded.replace(/&amp;/g, "&");
  }

  decoded = decoded
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .trim();

  const escaped = decoded
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return <span className={className} dangerouslySetInnerHTML={{ __html: escaped }} />;
}

function BulletText({ text }: { text?: string | string[] }) {
  if (!text) return null;

  const isHtml = typeof text === "string" && /<[a-z][\s\S]*>/i.test(text);

  if (isHtml && typeof text === "string") {
    return <div className="text-[13px]" dangerouslySetInnerHTML={{ __html: text }} />;
  }

  const bullets = normalizeBullets(text);
  if (bullets.length === 0) return null;

  if (bullets.length === 1) {
    return <p className="text-[13px]">{bullets[0]}</p>;
  }

  return (
    <ul className="list-disc list-inside text-[13px]">
      {bullets.map((t, i) => (
        <li key={i} className="mb-1">
          {t}
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="uppercase font-bold text-[12px] tracking-[0.18em] text-gray-900 border-b-2 border-gray-700 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sep() {
  return <span className="opacity-70 mx-1">|</span>;
}

/* ================= MAIN PAGE ================= */

export default function FinalCVPage() {
  const [cv, setCv] = useState<CVData | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  // ✅ Print mode flag (when ?print=1)
  const isPrint = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("print") === "1";
  }, []);

  // ✅ مهم جداً للـ Puppeteer: خلي الصفحة تقول "أنا جاهزة"
  useEffect(() => {
    (window as any).__CV_READY__ = false;
  }, []);


  const { postData, loading } = usePostData();

    const handleSendData = async () => {
   
    try {
      await postData(cv);
      router.push("/user/CvAnalysis"); 
    } catch (err) {
      console.error(err);
    }
  };
 
  /* ---------- load CV data ---------- */
  useEffect(() => {
    const loadData = async () => {
      const local = localStorage.getItem("cvData");

      // ✅ 1) حاول من localStorage الأول
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setCv(parsed);
          (window as any).__CV_READY__ = true; // ✅ جاهز
          return; // ✅ لو لقيت داتا خلاص
        } catch (e) {
          console.error("Error parsing local cvData", e);
        }
      }

      // ✅ 2) لو مفيش localStorage، هات من الـ API
      const token = localStorage.getItem("access");
      if (!token) {
        if (!local) window.location.href = "/auth/login";
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCv(data[0]);
            localStorage.setItem("cvData", JSON.stringify(data[0]));
            (window as any).__CV_READY__ = true; // ✅ جاهز
            return;
          }
        }

        setMessage("No CV data found. Please create your CV first.");
        (window as any).__CV_READY__ = true; // ✅ حتى لو فاضي—خلصنا
      } catch (err: any) {
        console.error("Network error fetching CV:", err);
        setMessage("Failed to load CV. Please try again.");
        (window as any).__CV_READY__ = true; // ✅ خلصنا
      }
    };

    loadData();
  }, []);

  const cvData: CVData = cv || {};
  const firstName = cvData.first_name || "FIRSTNAME";
  const lastName = cvData.last_name || "LASTNAME";

  const processedSkills: { category: string; items: string[] }[] = [];
  if (Array.isArray(cvData.skills)) {
    cvData.skills
      .filter((skillObj) => skillObj != null)
      .forEach((skillObj) => {
        if (skillObj?.items) {
          const items = String(skillObj.items)
            .split(/[•]/g)
            .map((s) => s.trim())
            .filter(Boolean);

          if (items.length > 0) {
            processedSkills.push({
              category: skillObj.category || "Skills",
              items,
            });
          }
        }
      });
  }

  const isGithub = typeof cvData.website === "string" && cvData.website.toLowerCase().includes("github.com");
 
  
  return (
    <main
      className={
        isPrint
          ? "min-h-screen bg-white"
          : "min-h-screen text-white flex flex-col bg-gradient-to-b from-[#020617] via-[#050726] to-[#020617]"
      }
    >
      {/* ✅ Global styles WITHOUT styled-jsx */}
      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { background: #ffffff !important; }
          #cv-preview { box-shadow: none !important; border: none !important; }
        }

        #cv-preview h2 {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 8px;
          margin-bottom: 4px;
        }
        #cv-preview h3 {
          font-size: 15px;
          font-weight: bold;
          margin-top: 6px;
          margin-bottom: 3px;
        }
      `}</style>

      {!isPrint && <Navbar />}

      <div className={isPrint ? "py-6 px-6" : "flex-1 flex flex-col items-center py-8 px-4"}>
        {!isPrint && <h1 className="text-3xl font-bold mb-4 text-primary">Your Final CV</h1>}

        {!cv && !isPrint && (
          <p className="mb-6 text-sm text-slate-300 text-center whitespace-pre-wrap">
            {message || "Loading CV data..."}
          </p>
        )}

        {/* ✅ في وضع الـ Print لازم يظهر عنصر cv-preview حتى لو cv null */}
        <div className={isPrint ? "w-full flex justify-center" : "w-full max-w-4xl flex justify-center"}>
          <div
            id="cv-preview"
            className={
              isPrint
                ? "bg-white text-black w-full max-w-3xl px-10 py-8"
                : "bg-white text-black w-full max-w-3xl px-10 py-8 rounded-md shadow-lg border border-gray-300"
            }
            style={{
              fontFamily: '"Times New Roman", Georgia, serif',
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            {/* HEADER */}
            <header className="text-center mb-3">
              <h1 className="text-[24px] font-bold tracking-wide uppercase">
                {firstName} {lastName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-gray-800">
                {cvData.location && <SafeText text={cvData.location} className="whitespace-nowrap" />}
                {cvData.location && (cvData.phone || cvData.email || cvData.linkedin || cvData.website) && <Sep />}

                {cvData.phone && <SafeText text={cvData.phone} className="whitespace-nowrap" />}
                {cvData.phone && (cvData.email || cvData.linkedin || cvData.website) && <Sep />}

                {cvData.email && (
                  <>
                    <a href={`mailto:${cvData.email}`} className="whitespace-nowrap underline">
                      {cvData.email}
                    </a>
                    {(cvData.linkedin || cvData.website) && <Sep />}
                  </>
                )}

                {cvData.linkedin && cvData.linkedin.trim() !== "" && (
                  <>
                    <a href={cvData.linkedin} target="_blank" rel="noreferrer" className="whitespace-nowrap underline">
                      LinkedIn
                    </a>
                    {cvData.website && cvData.website.trim() !== "" && <Sep />}
                  </>
                )}

                {cvData.website && cvData.website.trim() !== "" && (
                  <a href={cvData.website} target="_blank" rel="noreferrer" className="whitespace-nowrap underline">
                    {isGithub ? "GitHub" : "Website"}
                  </a>
                )}
              </div>
            </header>

            {/* Summary */}
            {cvData.objective && (
              <Section title="SUMMARY">
                <p className="text-[13px]">
                  <SafeText text={cvData.objective} />
                </p>
              </Section>
            )}

            {/* EDUCATION */}
            {cvData.educations && cvData.educations.length > 0 && (
              <Section title="EDUCATION">
                {cvData.educations.map((edu, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        {edu.school && (
                          <p className="uppercase tracking-[0.16em] text-[11px] font-bold">{edu.school}</p>
                        )}
                        {edu.degree && <p className="italic text-[12px] text-gray-900">{edu.degree}</p>}
                      </div>

                      {(edu.from || edu.to || edu.location) && (
                        <div className="flex flex-col items-end text-right">
                          {(edu.from || edu.to) && (
                            <span className="text-[11px] text-gray-700 whitespace-nowrap">
                              {edu.from || ""}
                              {edu.from && edu.to ? " – " : ""}
                              {edu.to || ""}
                            </span>
                          )}
                          {edu.location && <SafeText text={edu.location} className="text-[11px] text-gray-700" />}
                        </div>
                      )}
                    </div>

                    {edu.desc && (
                      <p className="mt-1 text-[12px]">
                        <span className="font-semibold">Relevant Coursework: </span>
                        {edu.desc}
                      </p>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* EXPERIENCE */}
            {cvData.experiences && cvData.experiences.length > 0 && (
              <Section title="EXPERIENCE">
                {cvData.experiences.map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        {exp.company && (
                          <p className="uppercase tracking-[0.16em] text-[11px] font-bold">{exp.company}</p>
                        )}
                        {exp.role && <p className="italic text-[12px] text-gray-900">{exp.role}</p>}
                      </div>

                      {(exp.from || exp.to || exp.location) && (
                        <div className="flex flex-col items-end text-right">
                          {(exp.from || exp.to) && (
                            <span className="text-[11px] text-gray-700 whitespace-nowrap">
                              {exp.from || ""}
                              {exp.from && exp.to ? " – " : ""}
                              {exp.to || ""}
                            </span>
                          )}
                          {exp.location && cleanText(exp.location) && (
                            <SafeText text={exp.location} className="text-[11px] text-gray-700" />
                          )}
                        </div>
                      )}
                    </div>

                    {exp.tasks && Array.isArray(exp.tasks) && exp.tasks.length > 0 && (
                      <ul className="mt-1 text-[13px] list-none pl-0">
                        {exp.tasks.map((task, taskIndex) => {
                          if (!task || !cleanText(task)) return null;
                          return (
                            <li key={taskIndex} className="mb-1 flex items-start">
                              <span className="mr-2 text-gray-900">●</span>
                              <SafeText text={task} />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* PROJECTS */}
            {cvData.projects && cvData.projects.length > 0 && (
              <Section title="PROJECTS">
                {cvData.projects.map((p, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-[13px]">{p.title || "Project"}</p>
                        {p.subtitle && <p className="italic text-[12px] text-gray-800">{p.subtitle}</p>}
                      </div>

                      {(p.from || p.to || p.location) && (
                        <div className="flex flex-col items-end text-right">
                          {(p.from || p.to) && (
                            <span className="text-[11px] text-gray-700 whitespace-nowrap">
                              {p.from || ""}
                              {p.from && p.to ? " – " : ""}
                              {p.to || ""}
                            </span>
                          )}
                          {p.location && <span className="text-[11px] text-gray-700">{p.location}</span>}
                        </div>
                      )}
                    </div>

                    {p.details && <BulletText text={p.details} />}
                  </div>
                ))}
              </Section>
            )}

            {/* CUSTOM SECTIONS */}
            {cvData.custom_sections && cvData.custom_sections.length > 0 && (
              <>
                {cvData.custom_sections.map((sec, i) => (
                  <Section key={i} title={sec.section_name || "CUSTOM SECTION"}>
                    <div className="mb-4">
                      {Array.isArray(sec.items) && sec.items.length > 0
                        ? sec.items
                            .filter((it) => it != null)
                            .map((it, k) => (
                              <div key={k} className="mb-2">
                                <div className="flex justify-between gap-4">
                                  <div className="min-w-0">
                                    {it?.title && <p className="font-bold text-[13px]">{it.title}</p>}
                                    {it?.subtitle && (
                                      <p className="italic text-[12px] text-gray-800">{it.subtitle}</p>
                                    )}
                                  </div>

                                  {(it?.from || it?.to || it?.location) && (
                                    <div className="flex flex-col items-end text-right">
                                      {(it?.from || it?.to) && (
                                        <span className="text-[11px] text-gray-700 whitespace-nowrap font-medium">
                                          {it?.from || ""}
                                          {it?.from && it?.to ? " – " : ""}
                                          {it?.to || ""}
                                        </span>
                                      )}
                                      {it?.location && it.location.trim() !== "" && (
                                        <span className="text-[11px] text-gray-700">{it.location}</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {it?.key_achievements &&
                                  Array.isArray(it.key_achievements) &&
                                  it.key_achievements.length > 0 && (
                                    <ul className="mt-1 text-[13px] list-none pl-0">
                                      {it.key_achievements
                                        .filter((achievement) => achievement != null && cleanText(achievement))
                                        .map((achievement, achievementIndex) => (
                                          <li key={achievementIndex} className="mb-1 flex items-start">
                                            <span className="mr-2 text-gray-900">●</span>
                                            <SafeText text={achievement} />
                                          </li>
                                        ))}
                                    </ul>
                                  )}
                              </div>
                            ))
                        : null}
                    </div>
                  </Section>
                ))}
              </>
            )}

            {/* SKILLS */}
            {processedSkills.length > 0 && (
              <Section title="SKILLS">
                {processedSkills.map((skillGroup, idx) => {
                  if (!skillGroup || !skillGroup.items || skillGroup.items.length === 0) return null;
                  const validItems = skillGroup.items.filter((item) => item && item.trim());
                  return (
                    <div key={idx} className="mb-2">
                      <p className="text-[12px]">
                        <span className="font-semibold">{skillGroup.category || "Skills"}: </span>
                        {validItems.map((item, itemIdx) => (
                          <React.Fragment key={itemIdx}>
                            {itemIdx > 0 && " • "}
                            <SafeText text={item} />
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  );
                })}
              </Section>
            )}
          </div>
        </div>

        {!isPrint && (
         <div className="flex gap-6 mt-8 justify-center">
  <button
          onClick={handleSendData}
    disabled={loading} // disables button while loading
    className={`w-full sm:w-auto px-6 py-2 bg-primary text-zinc-900 font-semibold rounded-md shadow-md duration-300 ${
      loading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary-dark"
    }`}
  >
    {loading ? "Loading..." : "CV Analysis →"}
  </button>
</div>
        )}
      </div>

      {!isPrint && <Footer />}
    </main>
  );
}
