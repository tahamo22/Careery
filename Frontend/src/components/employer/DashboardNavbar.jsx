"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function DashboardNavbar() {
  const router = useRouter();
  const pathname = usePathname(); // ✅ لمعرفة الصفحة الحالية

  const menu = [
    { name: "Overview", href: "/employer/dashboard" },
    { name: "Post a Job", href: "/employer/jobs/post" },
    { name: "My Jobs", href: "/employer/jobs" },
    { name: "Saved Candidate", href: "/employer/saved" },
  ];

  return (
    <header className="w-full bg-[#111] shadow flex justify-between items-center px-10 py-4 border-b border-gray-800">
      {/* ✅ Logo + Title */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-500" />
          <h1 className="text-xl font-bold text-white tracking-wide">
            Careery
          </h1>
        </Link>
      </div>

      {/* ✅ Navbar Menu */}
      <nav className="flex items-center gap-8 text-sm font-medium">
        {menu.map((item, i) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={i}
              href={item.href}
              className={`transition
                ${
                  isActive
                    ? "text-blue-400"
                    : "text-gray-300 hover:text-blue-400"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* ✅ User icon → Go to Settings */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/employer/settings")}
          className="focus:outline-none"
        >
          <img
            src="/employer/user.png"
            alt="user"
            width={36}
            height={36}
            className="rounded-full border border-gray-700 hover:border-blue-500 cursor-pointer transition"
          />
        </button>
      </div>
    </header>
  );
}
