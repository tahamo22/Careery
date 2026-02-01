"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="bg-[#020617] text-white py-10 mt-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Column 1 */}
        <div>
          <h3 className="text-xl font-semibold text-sky-300">
            Careery
          </h3>
          <p className="mt-2 text-slate-300 text-sm">
            Smart hiring assistant powered by AI to help job seekers and companies
            connect faster and smarter.
          </p>
          <p className="mt-3 text-sm">
            Call now:{" "}
            <span className="text-sky-400 font-semibold">
              (+20) 109-949-4799
            </span>
          </p>
        </div>

        {/* Column 2 */}
        <div>
          <h4 className="text-lg font-semibold text-sky-300">Quick Links</h4>
          <ul className="mt-2 space-y-2 text-slate-300 text-sm">
            <li>About</li>
            <li>Contact</li>
            <li>Pricing</li>
            <li>Blog</li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h4 className="text-lg font-semibold text-sky-300">Candidate</h4>
          <ul className="mt-2 space-y-2 text-slate-300 text-sm">
            <li>Browse Jobs</li>
            <li>Browse Employers</li>
            <li>Dashboard</li>
            <li>Saved Jobs</li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h4 className="text-lg font-semibold text-sky-300">Support</h4>
          <ul className="mt-2 space-y-2 text-slate-300 text-sm">
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
            <li>FAQs</li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-10 text-slate-500 border-t border-slate-800 pt-4 text-sm">
        © 2025 Careery. All Rights Reserved.
      </div>
    </footer>
  );
}
