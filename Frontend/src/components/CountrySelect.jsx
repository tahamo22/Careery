"use client";

import { useState } from "react";

// قائمة الدول (ممكن تكبرها أكتر بعدين)
const countries = [
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
];

export default function CountrySelect({ value, onChange }) {
  const [selected, setSelected] = useState(value || "");

  const handleChange = (e) => {
    setSelected(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  return (
    <select
      value={selected}
      onChange={handleChange}
      className="px-3 py-2 bg-black border border-gray-600 text-white rounded-md 
      focus:outline-none focus:border-green-500"
    >
      <option value="">Select Country</option>
      {countries.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.name} ({c.code})
        </option>
      ))}
    </select>
  );
}
