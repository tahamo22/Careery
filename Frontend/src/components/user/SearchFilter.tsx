"use client";
import { useState } from "react";

export default function SearchFilter({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <div className="bg-[#111] shadow-md rounded-xl p-4 flex items-center gap-4 max-w-4xl mx-auto mt-8">
      <input
        type="text"
        placeholder="Job title, company, or location"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 rounded-lg px-4 py-2 
                   bg-[#1c1c1c] text-white placeholder-gray-400 
                   border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <button
        onClick={() => onSearch(query)}
        className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
      >
        Find Job
      </button>
    </div>
  );
}
