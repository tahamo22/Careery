"use client";
import SettingsFormPersonal from "./SettingsFormPersonal";
import SettingsFormProfile from "./SettingsFormProfile";
import SettingsFormSocial from "./SettingsFormSocial";
import SettingsFormAccount from "./SettingsFormAccount";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SettingsTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const router = useRouter();

  const logout = async () => {
    try {
      const token = localStorage.getItem("access");
      await fetch(`${API_BASE_URL}/api/logout/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user_type");
    localStorage.removeItem("user_email");
    router.push("/");
  };

  return (
    <div className="w-full">
      {/* ====== Tabs Header ====== */}
      <div className="flex justify-between items-center border-b border-slate-800 mb-6 pb-2">
        {/* الTabs نفسها */}
        <div className="flex gap-6">
          {["personal", "profile", "social", "account"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-2 capitalize text-sm md:text-base transition-colors ${
                activeTab === tab
                  ? "text-sky-400 border-b-2 border-sky-500 font-semibold"
                  : "text-slate-300 border-b-2 border-transparent hover:text-sky-300"
              }`}
            >
              {tab === "personal" && "Personal"}
              {tab === "profile" && "Profile"}
              {tab === "social" && "Social Links"}
              {tab === "account" && "Account Setting"}
            </button>
          ))}
        </div>

        {/* زرار اللوج آوت */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 font-semibold text-sm md:text-base"
        >
           Log-out
        </button>
      </div>

      {/* ====== Active Form ====== */}
      {activeTab === "personal" && <SettingsFormPersonal />}
      {activeTab === "profile" && <SettingsFormProfile />}
      {activeTab === "social" && <SettingsFormSocial />}
      {activeTab === "account" && <SettingsFormAccount />}
    </div>
  );
}
