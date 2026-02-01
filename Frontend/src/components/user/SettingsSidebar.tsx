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
    router.push("/"); // رجّع المستخدم للهوم
  };

  return (
    <div className="bg-[#111] p-6 rounded-xl border border-gray-800 w-full">
      {/* ====== Tabs ====== */}
      <div className="flex justify-between items-center border-b border-gray-800 mb-6">
        {/* الأزرار (Personal - Profile - Social - Account) */}
        <div className="flex gap-6">
          {["personal", "profile", "social", "account"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-2 capitalize ${
                activeTab === tab
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-gray-400 hover:text-green-300"
              }`}
            >
              {tab === "personal" && "Personal"}
              {tab === "profile" && "Profile"}
              {tab === "social" && "Social Links"}
              {tab === "account" && "Account Setting"}
            </button>
          ))}
        </div>

        {/* الزرار الجديد (Logout) */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 font-semibold"
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
