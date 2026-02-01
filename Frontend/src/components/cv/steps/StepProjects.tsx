// src/components/cv/steps/StepObjective.tsx
"use client";
import React from "react";

export default function StepObjective({ formData, setFormData, handleSaveAndNext, setStep }: any) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 2: Objective</h2>

      <textarea
        name="objective"
        placeholder="Your Career Objective"
        value={formData.objective || ""}
        onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
        className="w-full p-2 mb-3 bg-[#111] border border-gray-600 rounded"
      />

      <div className="flex gap-4 mt-4">
        <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md">
          ← Back
        </button>

        <button
          onClick={() => handleSaveAndNext(3)} // من Step 2 ل Step 3
          className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-zinc-900 cursor-pointer hover:bg-white/70 duration-300   font-semibold rounded-md shadow-md transition"
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
}
