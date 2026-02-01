"use client";

import { useEffect, useMemo, useState } from "react";
import OnboardingNavbar from "@/components/OnboardingNavbar";
import Button from "@/components/Button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type LinkRow = {
  id?: number;
  platform: string;
  url: string;
};

const normalize = (s: string) => (s || "").trim().toLowerCase();

const FIXED_PLATFORMS = ["Facebook", "Twitter", "Instagram", "LinkedIn"] as const;
type FixedPlatform = (typeof FIXED_PLATFORMS)[number];

function AvatarLetter({ text }: { text: string }) {
  const letter = (text || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-semibold">
      {letter}
    </div>
  );
}

export default function Step4SocialMedia() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const fixedSet = useMemo(
    () => new Set(FIXED_PLATFORMS.map((p) => normalize(p))),
    []
  );

  useEffect(() => {
    const fetchLinks = async () => {
      const token = localStorage.getItem("access");
      if (!token) return;

      try {
        const resProfile = await fetch(`${API_BASE_URL}/api/company-profiles/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = resProfile.ok ? await resProfile.json() : {};

        const resLinks = await fetch(`${API_BASE_URL}/api/social-links/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const socialData: any[] = resLinks.ok ? await resLinks.json() : [];

        const fixedRows: LinkRow[] = [
          { platform: "Facebook", url: profileData.facebook_url || "" },
          { platform: "Twitter", url: profileData.twitter_url || "" },
          { platform: "Instagram", url: profileData.instagram_url || "" },
          { platform: "LinkedIn", url: profileData.linkedin_url || "" },
        ];

        const dynamicRows: LinkRow[] = socialData
          .filter((l) => !fixedSet.has(normalize(l.platform)))
          .map((l) => ({
            id: l.id,
            platform: l.platform || "New Platform",
            url: l.url || "",
          }));

        const socialMap = new Map<string, any>();
        for (const l of socialData) socialMap.set(normalize(l.platform), l);

        const mergedFixed = fixedRows.map((row) => {
          if (row.url) return row;
          const fromSocial = socialMap.get(normalize(row.platform));
          return fromSocial?.url ? { ...row, url: fromSocial.url } : row;
        });

        setLinks([...mergedFixed, ...dynamicRows]);
      } catch (err) {
        console.error("Error fetching social links:", err);
      }
    };

    fetchLinks();
  }, [fixedSet]);

  const handleUrlChange = (index: number, value: string) => {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, url: value } : l)));
  };

  const handlePlatformChange = (index: number, value: string) => {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, platform: value } : l)));
  };

  const handleRemove = async (index: number) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const row = links[index];
    const isFixed = fixedSet.has(normalize(row.platform));

    if (isFixed) {
      setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, url: "" } : l)));
      return;
    }

    if (row.id) {
      try {
        await fetch(`${API_BASE_URL}/api/social-links/${row.id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to delete link:", err);
      }
    }

    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    setLinks((prev) => [...prev, { platform: "New Platform", url: "" }]);
  };

  const handleSave = async () => {
    const token = localStorage.getItem("access");
    if (!token) return alert("⚠️ Please login first");

    try {
      const getFixedUrl = (p: FixedPlatform) =>
        links.find((l) => normalize(l.platform) === normalize(p))?.url || "";

      const formData = new FormData();
      formData.append("facebook_url", getFixedUrl("Facebook"));
      formData.append("twitter_url", getFixedUrl("Twitter"));
      formData.append("instagram_url", getFixedUrl("Instagram"));
      formData.append("linkedin_url", getFixedUrl("LinkedIn"));

      const resProfile = await fetch(`${API_BASE_URL}/api/company-profiles/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!resProfile.ok) {
        const t = await resProfile.text();
        console.log("PROFILE SAVE FAILED:", resProfile.status, t);
        alert("Failed to save company profile social URLs");
        return;
      }

      const dynamic = links
        .filter((l) => !fixedSet.has(normalize(l.platform)))
        .filter((l) => (l.platform || "").trim() || (l.url || "").trim());

      for (const link of dynamic) {
        if (!link.url?.trim()) {
          if (link.id) {
            await fetch(`${API_BASE_URL}/api/social-links/${link.id}/`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          continue;
        }

        if (link.id) {
          const r = await fetch(`${API_BASE_URL}/api/social-links/${link.id}/`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ platform: link.platform, url: link.url }),
          });
          if (!r.ok) console.log("SOCIAL PATCH FAILED:", r.status, await r.text());
        } else {
          const r = await fetch(`${API_BASE_URL}/api/social-links/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ platform: link.platform, url: link.url }),
          });

          if (r.ok) {
            const created = await r.json();
            setLinks((prev) => prev.map((x) => (x === link ? { ...x, id: created.id } : x)));
          } else {
            console.log("SOCIAL POST FAILED:", r.status, await r.text());
          }
        }
      }

      window.location.href = "/employer/onboarding/step3";
    } catch (err) {
      console.error("Error saving social links:", err);
      alert("Failed to save social links");
    }
  };

  const inputClass =
    "px-3 py-2 rounded-md bg-black border border-gray-700 text-white " +
    "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <OnboardingNavbar activeStep="Social Media Profile" progress="50%" />

      <main className="bg-black w-full max-w-5xl px-10 mt-10">
        <form className="space-y-6">
          {links.map((link, idx) => (
            <div
              key={`${link.id ?? "new"}-${idx}`}
              className="flex items-center gap-3 border border-gray-700 rounded-md px-3 py-2"
            >
              <AvatarLetter text={link.platform} />

              <input
                type="text"
                value={link.platform}
                onChange={(e) => handlePlatformChange(idx, e.target.value)}
                placeholder="Platform name (e.g. GitHub, TikTok)"
                className={`${inputClass} w-44`}
              />

              <input
                type="url"
                value={link.url}
                onChange={(e) => handleUrlChange(idx, e.target.value)}
                placeholder="Profile link/url"
                className={`${inputClass} flex-1`}
              />

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-blue-500 hover:text-blue-400 text-lg font-bold"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-2 border border-dashed border-gray-600 text-gray-400 hover:text-blue-500 hover:border-blue-500 rounded-md transition"
          >
            + Add New Social Link
          </button>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = "/employer/onboarding/step2";
              }}
              className="!border-blue-500/40 hover:!border-blue-500"
            >
              ← Previous
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white"
            >
              Save & Next →
            </Button>
          </div>
        </form>
      </main>

      <footer className="w-full mt-16 py-4 text-center text-gray-500 text-sm border-t border-gray-700">
        © 2025 CareerBridge - Job Portal. All rights reserved
      </footer>
    </div>
  );
}
