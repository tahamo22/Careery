"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Search,
  Settings,
  Briefcase,
  Camera,
  Globe2,
  LogOut,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();

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

  const links = [
    { label: "Overview", href: "/user/dashboard", icon: <LayoutDashboard /> },
    { label: "Create CV", href: "/user/create-cv", icon: <FileText /> },
    { label: "CV Analysis", href: "/user/CvAnalysis", icon: <Search /> },
    { label: "Find Jobs", href: "/user/jobs", icon: <Briefcase /> },
    // ✅ رابط الفريلانسر الجديد
    { label: "Freelance Jobs", href: "/user/freelaance", icon: <Globe2 /> },
    // ✅ رابط تدريب المقابلات
    { label: "Interview Training", href: "/user/interview-training", icon: <Camera /> },
    { label: "Settings", href: "/user/settings", icon: <Settings /> },
  ];

  return (
    <aside className="w-64 bg-[#0c0c0c] border border-gray-800 rounded-xl p-6 flex flex-col gap-4 shadow-lg">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition
              ${
                isActive
                  ? "text-sky-400 bg-gray-800 border border-sky-500/30"
                  : "text-gray-300 hover:text-sky-400 hover:bg-gray-800"
              }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}

      <button
        onClick={logout}
        className="mt-6 flex items-center gap-3 text-red-400 hover:text-red-300 transition font-semibold"
      >
        <LogOut className="h-5 w-5" />
        Log-out
      </button>
    </aside>
  );
}
