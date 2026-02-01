"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const menu = [
    { name: "Overview", icon: "/employer/overview.png", href: "/employer/dashboard" },
    { name: "Post a Job", icon: "/employer/post-job.png", href: "/employer/jobs/post" },
    { name: "My Jobs", icon: "/employer/my-jobs.png", href: "/employer/jobs" },
    { name: "Saved Candidate", icon: "/employer/saved.png", href: "/employer/saved" },
    { name: "Settings", icon: "/employer/settings.png", href: "/employer/settings" },
  ];

  const isActiveLink = (href: string) => {
    // Overview تطابق تام
    if (href === "/employer/dashboard") return pathname === href;

    // Post a Job تطابق تام
    if (href === "/employer/jobs/post") return pathname === href;

    // My Jobs يمسك كل jobs ماعدا /jobs/post
    if (href === "/employer/jobs") {
      return (
        pathname === "/employer/jobs" ||
        (pathname.startsWith("/employer/jobs/") &&
          !pathname.startsWith("/employer/jobs/post"))
      );
    }

    // باقي الروابط: تطابق تام + subroutes
    return pathname === href || pathname.startsWith(href + "/");
  };

  // ✅ Logout function
  const handleLogout = async () => {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    const token = localStorage.getItem("access");
    setLoading(true);

    try {
      await fetch(`${API_BASE_URL}/api/logout/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("access");
      router.push("/");
      setLoading(false);
    }
  };

  return (
    <aside className="w-64 bg-[#111] text-white h-screen flex flex-col p-6">
      <h2 className="text-sm text-gray-400 mb-6">EMPLOYERS DASHBOARD</h2>

      <nav className="flex-1 space-y-3">
        {menu.map((item, i) => {
          const isActive = isActiveLink(item.href);

          return (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-3 p-2 rounded transition
                ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400"
                    : "hover:bg-blue-600/20 hover:text-blue-400"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}

        {/* ✅ Logout */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-3 p-2 rounded hover:bg-blue-600/20 hover:text-blue-400 transition w-full text-left"
        >
          {loading ? "Logging out..." : "Log-out"}
        </button>
      </nav>
    </aside>
  );
}
