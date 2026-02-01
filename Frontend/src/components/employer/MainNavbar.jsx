"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function DashboardNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { name: "Overview", href: "/employer/dashboard" },
    { name: "Post a Job", href: "/employer/jobs/post" },
    { name: "My Jobs", href: "/employer/jobs" },
    { name: "Saved Candidate", href: "/employer/saved" },
  ];

  const isActiveLink = (href) => {
    if (href === "/employer/dashboard") {
      return pathname === href;
    }

    if (href === "/employer/jobs/post") {
      return pathname === href;
    }

    if (href === "/employer/jobs") {
      return (
        pathname === "/employer/jobs" ||
        (pathname.startsWith("/employer/jobs/") &&
          !pathname.startsWith("/employer/jobs/post"))
      );
    }

    if (href === "/employer/saved") {
      return pathname === href || pathname.startsWith("/employer/saved/");
    }

    return false;
  };

  return (
    <nav className="w-full bg-black text-white px-8 py-4 flex items-center justify-between border-b border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 min-w-[250px]">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold tracking-wide">Careery</span>
        </Link>
      </div>

      {/* Menu */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-10 text-lg">
          {menu.map((item, i) => {
            const active = isActiveLink(item.href);

            return (
              <Link
                key={i}
                href={item.href}
                className={`transition
                  ${
                    active
                      ? "text-blue-400 border-b-2 border-blue-500 pb-1"
                      : "text-gray-300 hover:text-blue-400"
                  }
                `}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.push("/employer/settings")}
          className="focus:outline-none"
        >
          <img
            src="/user/navbar/user.png"
            alt="user"
            width={32}
            height={32}
            className="rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
          />
        </button>
      </div>
    </nav>
  );
}
