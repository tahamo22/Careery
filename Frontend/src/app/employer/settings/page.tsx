"use client";

import Sidebar from "@/components/employer/Sidebar";
import MainNavbar from "@/components/employer/MainNavbar";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

type SocialLinkRow = { id?: number; platform: string; url: string };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const normalize = (s: string) => (s || "").trim().toLowerCase();

const normalizeUrl = (value: string) => {
  const v = (value || "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
};

function AvatarLetter({ text }: { text: string }) {
  const letter = (text || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center font-semibold">
      {letter}
    </div>
  );
}

export default function EmployerSettings() {
  const [activeTab, setActiveTab] = useState("company");
  const [profile, setProfile] = useState<any>({});
  const [publicProfile, setPublicProfile] = useState<any>({});
  const [socialLinks, setSocialLinks] = useState<SocialLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const tabs = ["company", "founding", "social", "verification", ];
  const [verification, setVerification] = useState<any>({});
  const fixedPlatforms = useMemo(
    () => [
      { key: "facebook_url", platform: "Facebook" },
      { key: "twitter_url", platform: "Twitter" },
      { key: "instagram_url", platform: "Instagram" },
      { key: "linkedin_url", platform: "LinkedIn" },
    ],
    []
  );

  const fixedSet = useMemo(
    () => new Set(fixedPlatforms.map((p) => normalize(p.platform))),
    [fixedPlatforms]
  );

  // ✅ Fetch company profile + social links
  useEffect(() => {
    const fetchAll = async () => {
  const token = localStorage.getItem("access");
  if (!token) {
    window.location.href = "/auth/company/login";
    return;
  }

  try {
    // ================= 1) Company Profile =================
    const resProfile = await fetch(
      `${API_BASE_URL}/api/company-profiles/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

   if (!resProfile.ok) {
  const text = await resProfile.text();
  console.error("Company profile fetch error:", text);
} else {
  const profData = await resProfile.json();

  // لو بيرجع object
  if (profData && profData.id) {
    setProfile(profData);
  }
  // لو بيرجع array
  else if (Array.isArray(profData) && profData.length > 0) {
    setProfile(profData[0]);
  }
}


    // ================= 2) Company Verification =================
    const resVerification = await fetch(
      `${API_BASE_URL}/api/company-verification/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (resVerification.ok) {
      const verificationData = await resVerification.json();
      setVerification(verificationData);
    }

    // ================= 3) Public Company Profile =================
    const resPublic = await fetch(
      `${API_BASE_URL}/api/company-public-profile/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (resPublic.ok) {
      const publicData = await resPublic.json();
      const pub = Array.isArray(publicData) ? publicData[0] : publicData;
      if (pub) {
        setPublicProfile(pub);
      }
    }

    // ================= 4) Social Links =================
    const resLinks = await fetch(
      `${API_BASE_URL}/api/social-links/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const linksData = resLinks.ok ? await resLinks.json() : [];

    const dynamic = (Array.isArray(linksData) ? linksData : [])
      .filter((l: any) => !fixedSet.has(normalize(l.platform)))
      .map((l: any) => ({
        id: l.id,
        platform: l.platform,
        url: l.url,
      }));

    setSocialLinks(dynamic);

  } catch (error) {
    console.error("Error loading settings:", error);
  } finally {
    setLoading(false);
  }
};

    fetchAll();
  }, [fixedSet]);

  // ✅ Save company profile + social links
  const handleSave = async () => {
  const token = localStorage.getItem("access");
  if (!token) {
    alert("Please log in first.");
    return;
  }

  try {
    /* ===============================
       1) UPDATE COMPANY PROFILE
    =============================== */
    if (!profile?.id) {
      alert("Company profile not loaded yet");
      return;
    }

    const formData = new FormData();
    formData.append("company_name", profile.company_name || "");
    formData.append("company_description", profile.company_description || "");

    if (profile.company_logo instanceof File) {
      formData.append("company_logo", profile.company_logo);
    }

    const companyRes = await fetch(
      `${API_BASE_URL}/api/company-profiles/${profile.id}/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!companyRes.ok) {
      const text = await companyRes.text();
      console.error("Company profile error:", text);
      alert("Failed to save company profile");
      return;
    }

    /* ===============================
       2) SAVE PUBLIC PROFILE
    =============================== */
    const publicForm = new FormData();
    Object.entries(publicProfile || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        publicForm.append(key, String(value));
      }
    });

    await fetch(`${API_BASE_URL}/api/company-public-profile/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: publicForm,
    });

    /* ===============================
       3) SAVE VERIFICATION
    =============================== */
    const verificationForm = new FormData();
    verificationForm.append(
      "business_email",
      verification.business_email || ""
    );
    verificationForm.append(
      "commercial_register_number",
      verification.commercial_register_number || ""
    );
    verificationForm.append("tax_id", verification.tax_id || "");

    if (verification.verification_document instanceof File) {
      verificationForm.append(
        "verification_document",
        verification.verification_document
      );
    }

    await fetch(`${API_BASE_URL}/api/company-verification/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: verificationForm,
    });

    alert("Settings saved successfully ✅");
  } catch (error) {
    console.error("handleSave error:", error);
    alert("Server error while saving");
  }
};



  // ✅ Logout
  const handleLogout = async () => {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    const token = localStorage.getItem("access");
    if (!token) return router.push("/auth/company/login"
);

    try {
      await fetch(`${API_BASE_URL}/api/logout/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("access");
      router.push("/");
    }
  };

  // ✅ Delete Account
  const handleCloseAccount = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to permanently delete your company account?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("access");
    if (!token) return alert("Please log in first.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/close-account/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert(" Account deleted successfully.");
        localStorage.removeItem("access");
        router.push("/auth/company/login");
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${JSON.stringify(err)}`);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Server connection failed.");
    }
  };

  const handleNext = async () => {
    await handleSave();
    const current = tabs.indexOf(activeTab);
    if (current < tabs.length - 1) setActiveTab(tabs[current + 1]);
  };

  const handlePrevious = () => {
    const current = tabs.indexOf(activeTab);
    if (current > 0) setActiveTab(tabs[current - 1]);
  };

  

  // ✅ Social link controls
  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, { platform: "GitHub", url: "" }]);
  };

  const removeSocialLink = async (index: number) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const row = socialLinks[index];
    if (row?.id) {
      await fetch(`${API_BASE_URL}/api/social-links/${row.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading)
    return <div className="p-10 text-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <MainNavbar />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          {/* Title + Log-out */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium transition"
            >
              Log-out
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-700 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 capitalize ${
                  activeTab === tab
                    ? "text-blue-500 border-b-2 border-blue-500"
                    : "text-gray-400"
                }`}
              >
                {tab === "company"
                  ? "Company Info"
                  : tab === "founding"
                  ? "Founding Info"
                  : tab === "social"
                  ? "Social Media"
                  : "Account"}
              </button>
            ))}
          </div>

          {/* ================= COMPANY INFO ================= */}
          {activeTab === "company" && (
            <div className="space-y-6">
              <div className="bg-[#111] p-6 rounded-lg">
                <label className="block mb-2 font-medium">Company Name</label>
                <input
                  type="text"
                  value={profile.company_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, company_name: e.target.value })
                  }
                  className="w-full p-2 rounded bg-black border border-gray-600"
                />
              </div>

              <div className="bg-[#111] p-6 rounded-lg">
                <label className="block mb-2">Company Description</label>
                <textarea
                  value={profile.company_description || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      company_description: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded bg-black border border-gray-600 h-24"
                />
              </div>

              
              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled
                  className="bg-gray-600 px-6 py-2 rounded opacity-50 cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
                >
                  Save & Next →
                </button>
              </div>
            </div>
          )}

          {/* ================= FOUNDING INFO ================= */}
         {activeTab === "founding" && (
  <div className="space-y-6">
    <div className="grid grid-cols-3 gap-4">
      <input
        placeholder="Organization Type"
        value={publicProfile.organization_type || ""}
        onChange={(e) =>
          setPublicProfile({
            ...publicProfile,
            organization_type: e.target.value,
          })
        }
        className="p-2 bg-black border border-gray-600 rounded"
      />

      <input
        placeholder="Industry Type"
        value={publicProfile.industry_type || ""}
        onChange={(e) =>
          setPublicProfile({
            ...publicProfile,
            industry_type: e.target.value,
          })
        }
        className="p-2 bg-black border border-gray-600 rounded"
      />

      <input
        placeholder="Team Size"
        value={publicProfile.team_size || ""}
        onChange={(e) =>
          setPublicProfile({
            ...publicProfile,
            team_size: e.target.value,
          })
        }
        className="p-2 bg-black border border-gray-600 rounded"
      />
    </div>

    <input
      placeholder="Year of Establishment"
      type="number"
      value={publicProfile.year_of_establishment || ""}
      onChange={(e) =>
        setPublicProfile({
          ...publicProfile,
          year_of_establishment: e.target.value,
        })
      }
      className="p-2 bg-black border border-gray-600 rounded w-full"
    />

    <input
      placeholder="Company Website"
      value={publicProfile.company_website || ""}
      onChange={(e) =>
        setPublicProfile({
          ...publicProfile,
          company_website: e.target.value,
        })
      }
      className="p-2 bg-black border border-gray-600 rounded w-full"
    />

    <textarea
      placeholder="Company Vision"
      value={publicProfile.vision || ""}
      onChange={(e) =>
        setPublicProfile({
          ...publicProfile,
          vision: e.target.value,
        })
      }
      className="p-2 bg-black border border-gray-600 rounded w-full h-24"
    />

    <div className="flex justify-between">
      <button
        onClick={handlePrevious}
        className="bg-gray-600 px-6 py-2 rounded"
      >
        Previous
      </button>

      <button
        onClick={handleNext}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
      >
        Save & Next →
      </button>
    </div>
  </div>
)}

          {/* ================= SOCIAL MEDIA (SAME SHAPE AS STEP4) ================= */}
          {activeTab === "social" && (
            <div className="space-y-6">
              {fixedPlatforms.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center gap-3 border border-gray-600 rounded-md px-3 py-2"
                >
                  <AvatarLetter text={row.platform} />

                  <input
                    type="text"
                    value={row.platform}
                    disabled
                    className="w-44 px-3 py-2 rounded-md bg-black border border-gray-700 text-gray-400 cursor-not-allowed"
                  />

                  <input
                    type="url"
                    value={publicProfile[row.key] || ""}
                    onChange={(e) =>
                      setPublicProfile({
                       ...publicProfile,
                       [row.key]: e.target.value,
                      })
                    }
                    placeholder="Profile link/url"
                    className="flex-1 px-3 py-2 rounded-md bg-black border border-gray-600 text-white"
                  />


                  <button
                    type="button"
                    onClick={() =>
                     setPublicProfile({
                      ...publicProfile,
                      [row.key]: "",
                     })
                    }
                  >
               ✕
               </button>

                </div>
              ))}

              {socialLinks.map((l, idx) => (
                <div
                  key={`${l.id ?? "new"}-${idx}`}
                  className="flex items-center gap-3 border border-gray-600 rounded-md px-3 py-2"
                >
                  <AvatarLetter text={l.platform} />

                  <input
                    type="text"
                    value={l.platform}
                    onChange={(e) =>
                      setSocialLinks((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, platform: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Platform (e.g. GitHub)"
                    className="w-44 px-3 py-2 rounded-md bg-black border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                  />

                  <input
                    type="url"
                    value={l.url}
                    onChange={(e) =>
                      setSocialLinks((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, url: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Profile link/url"
                    className="flex-1 px-3 py-2 rounded-md bg-black border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => removeSocialLink(idx)}
                    className="text-blue-500 hover:text-blue-400 text-lg font-bold"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSocialLink}
                className="w-full py-2 border border-dashed border-gray-500 text-gray-400 hover:text-blue-500 hover:border-blue-500 rounded-md"
              >
                + Add New Social Link
              </button>

              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-600 px-6 py-2 rounded"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
                >
                  Save & Next →
                </button>
              </div>
            </div>
          )}
           {/* ================= VERIFICATION ================= */}
{activeTab === "verification" && (
  <div className="space-y-6">

    <input
      type="email"
      placeholder="Business Email *"
      value={verification.business_email || ""}
      onChange={(e) =>
        setVerification({
          ...verification,
          business_email: e.target.value,
        })
      }
      className="p-2 bg-black border border-gray-600 rounded w-full"
    />

    <input
      placeholder="Commercial Register Number *"
      value={verification.commercial_register_number || ""}
      onChange={(e) =>
        setVerification({
          ...verification,
          commercial_register_number: e.target.value,
        })
      }
      className="p-2 bg-black border border-gray-600 rounded w-full"
    />

    <input
      placeholder="Tax ID *"
      value={verification.tax_id || ""}
      onChange={(e) =>
        setVerification({
          ...verification,
          tax_id: e.target.value,
        })
      }
      className="p-2 bg-black border border-gray-600 rounded w-full"
    />

    <div>
      <label className="block mb-2 text-gray-400">
        Upload Verification Document (Optional)
      </label>
      <input
        type="file"
        onChange={(e) =>
          setVerification({
            ...verification,
            verification_document: e.target.files?.[0],
          })
        }
        className="p-2 bg-black border border-gray-600 rounded w-full"
      />
    </div>

    <button
      onClick={handleSave}
      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
    >
      Save Verification
    </button>
  </div>
)}

          {/* ================= ACCOUNT ================= */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <input
                placeholder="Map Location"
                value={publicProfile.map_location || ""}
                onChange={(e) =>
                 setPublicProfile({
                  ...publicProfile,
                  map_location: e.target.value,
                 })
                }
                className="p-2 bg-black border border-gray-600 rounded w-full"
              />

              <input
                placeholder="Phone Number"
                value={publicProfile.phone || ""}
                onChange={(e) =>
                 setPublicProfile({
                  ...publicProfile,
                  phone: e.target.value,
                 })
                }
                className="p-2 bg-black border border-gray-600 rounded w-full"
              />

              <input
                placeholder="Contact Email"
                value={publicProfile.contact_email || ""}
                onChange={(e) =>
                 setPublicProfile({
                  ...publicProfile,
                  contact_email: e.target.value,
                 })
                }
                className="p-2 bg-black border border-gray-600 rounded w-full"
              />


              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
              >
                Save Changes
              </button>

              <div className="mt-6 bg-[#1c1c1c] p-6 rounded-lg">
                <h3 className="font-semibold mb-2 text-red-500">
                  Delete Your Company
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  If you delete your account, you won’t be able to access any
                  matched jobs or candidates.
                </p>
                <button
                  onClick={handleCloseAccount}
                  className="bg-red-600 px-6 py-2 rounded hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
