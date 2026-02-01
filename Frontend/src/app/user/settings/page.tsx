"use client";

import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import SettingsTabs from "@/components/user/SettingsTabs";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <main className="bg-black min-h-screen text-white flex flex-col">
      {/* ===== Navbar ===== */}
      <Navbar />

      {/* ===== Main Wrapper ===== */}
      <div className="flex-1 px-4 py-8 flex justify-center">
        <div className="w-full max-w-6xl bg-[#050816] border border-slate-800 rounded-2xl shadow-lg px-4 sm:px-6 lg:px-8 py-6">
          {/* هنا كل محتوى التابات */}
          <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      {/* ===== Footer ===== */}
      <Footer />
    </main>
    
  );
  
}
