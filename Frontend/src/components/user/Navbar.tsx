"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const linkClasses = (path: string) =>
    isActive(path)
      ? "text-blue-400 underline underline-offset-4"
      : "text-slate-200 hover:text-blue-400 transition";

  return (
    <nav className="w-full bg-black text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between border-b border-gray-800 relative z-40">
      {/* ===== Left: Logo + Title ===== */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-500" />
          <span className="text-lg sm:text-xl font-bold tracking-wide">
            Careery
          </span>
        </Link>
      </div>

      {/* ===== Center: Navigation Links (Desktop / Tablet) ===== */}
      <div className="hidden md:flex flex-1 justify-center">
        <div className="flex items-center gap-6 lg:gap-10 text-sm lg:text-base">
          {/* ✅ Overview FIRST */}
          <Link href="/user/dashboard" className={linkClasses("/user/dashboard")}>
            Overview
          </Link>

          <Link href="/user/create-cv" className={linkClasses("/user/create-cv")}>
            Create CV
          </Link>

          <Link
            href="/user/create-cv/FinalCV"
            className={linkClasses("/user/create-cv/FinalCV")}
          >
            Final CV
          </Link>

          <Link href="/user/CvAnalysis" className={linkClasses("/user/CvAnalysis")}>
            CV Analysis
          </Link>

          <Link href="/user/jobs" className={linkClasses("/user/jobs")}>
            Find Jobs
          </Link>

          {/* Freelance Jobs */}
          <Link href="/user/freelaance" className={linkClasses("/user/freelaance")}>
            Freelance Jobs
          </Link>

          <Link
            href="/user/interview-training"
            className={linkClasses("/user/interview-training")}
          >
            Interview Training
          </Link>
        </div>
      </div>

      {/* ===== Right: User Icon + Mobile Menu Toggle ===== */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/user/settings">
          <img
            src="/user/navbar/user.png"
            alt="user"
            width={32}
            height={32}
            className="rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
          />
        </Link>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-1.5 border border-gray-700 hover:border-blue-500 hover:bg-gray-900 transition"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5 text-slate-200" />
          ) : (
            <Menu className="h-5 w-5 text-slate-200" />
          )}
        </button>
      </div>

      {/* ===== Mobile Dropdown Menu ===== */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black border-t border-gray-800">
          <div className="px-4 py-3 space-y-2 text-sm">
            {/* ✅ Overview FIRST (Mobile) */}
            <Link
              href="/user/dashboard"
              className={`block py-2 ${linkClasses("/user/dashboard")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Overview
            </Link>

            <Link
              href="/user/create-cv"
              className={`block py-2 ${linkClasses("/user/create-cv")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Create CV
            </Link>

            <Link
              href="/user/create-cv/FinalCV"
              className={`block py-2 ${linkClasses("/user/create-cv/FinalCV")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Final CV
            </Link>

            <Link
              href="/user/CvAnalysis"
              className={`block py-2 ${linkClasses("/user/CvAnalysis")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              CV Analysis
            </Link>

            <Link
              href="/user/jobs"
              className={`block py-2 ${linkClasses("/user/jobs")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Find Jobs
            </Link>

            <Link
              href="/user/freelaance"
              className={`block py-2 ${linkClasses("/user/freelaance")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Freelance Jobs
            </Link>

            <Link
              href="/user/interview-training"
              className={`block py-2 ${linkClasses("/user/interview-training")}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Interview Training
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
