"use client";

import OnboardingNavbar from "@/components/OnboardingNavbar";
import Button from "@/components/Button";
import CountrySelect from "@/components/CountrySelect";
import { useState, useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Step3Contact() {
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [mapLocation, setMapLocation] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/company-profiles/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCountry(data.country || "");
          setPhone(data.phone || "");
          setMapLocation(data.map_location || "");
          setEmail(data.contact_email || "");
        }
      } catch (err) {
        console.error("Failed to fetch contact info:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("country", country);
      formData.append("phone", phone);
      formData.append("map_location", mapLocation);
      formData.append("contact_email", email);

      const res = await fetch(`${API_BASE_URL}/api/company-profiles/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        window.location.href = "/employer/onboarding/step5";
      } else {
        const errorText = await res.text();
        console.error("Backend Error:", errorText);
        alert("Failed to save contact info: " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };

  const inputClass =
    "w-full px-4 py-2 rounded-md bg-black border border-gray-700 text-white " +
    "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <OnboardingNavbar activeStep="Contact" progress="75%" />

      <main className="bg-black w-full max-w-4xl px-10 mt-8">
        <form className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-300 text-sm">Map Location</label>
            <input
              type="text"
              placeholder="Enter map location"
              value={mapLocation}
              onChange={(e) => setMapLocation(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-300 text-sm">Phone</label>
            <div className="flex gap-2">
              <CountrySelect value={country} onChange={setCountry} />
              <input
                type="text"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${inputClass} flex-1`}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-300 text-sm">Email</label>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="secondary"
              onClick={() => (window.location.href = "/employer/onboarding/step4")}
              className="!border-blue-500/40 hover:!border-blue-500"
            >
              ← Previous
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white"
            >
              Save & Next →
            </Button>
          </div>
        </form>
      </main>

      <footer className="w-full mt-16 py-4 text-center text-gray-500 text-sm border-t border-gray-700">
        © 2025 CareerBridge - Job Portal. All rights reserved
      </footer>
    </div>
  );
}
