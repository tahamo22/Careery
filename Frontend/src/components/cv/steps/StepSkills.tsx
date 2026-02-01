// src/components/cv/steps/StepSkills.tsx
"use client";
import React, { useState } from "react";
import RichTextToolbar from "../RichTextToolbar";
import RichInput from "../RichInput";

export default function StepSkills({ formData, setFormData, handleSaveAndNext, setStep }: any) {
  // Ensure skills is an array of objects
  const skillGroups = Array.isArray(formData.skills) ? formData.skills : [];

  const addGroup = () => {
    setFormData({
      ...formData,
      skills: [...skillGroups, { category: "", items: "" }],
    });
  };

  const removeGroup = (idx: number) => {
    setFormData({
      ...formData,
      skills: skillGroups.filter((_: any, i: number) => i !== idx),
    });
  };

  const updateGroup = (idx: number, field: "category" | "items", value: string) => {
    const copy = [...skillGroups];
    copy[idx] = { ...copy[idx], [field]: value };
    setFormData({ ...formData, skills: copy });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-white">Step 4: Technical Skills</h2>

      <div className="space-y-4">
        {skillGroups.map((group: any, i: number) => (
          <div key={i} className="flex flex-col md:flex-row gap-3 p-3 bg-[#0f0f0f] border border-gray-700 rounded-lg group">
            {/* Category Input (e.g., Programming Languages) */}
            <div className="md:w-1/3">
              <RichInput
                name={`category-${i}`}
                value={group.category}
                onChange={(e) => updateGroup(i, "category", e.target.value)}
                placeholder="Category (e.g. Styling)"
                className="font-bold text-white w-full  max-w-lg  max-h-[10dvh] overflow-y-auto focus:outline-none focus:border-primary focus:border-2 transition-colors"
              />
            </div>

            {/* Items Input (e.g., Tailwind, CSS) */}
            <div className="flex-1 flex gap-2">
              <RichInput
                name={`items-${i}`}
                value={group.items}
                onChange={(e) => updateGroup(i, "items", e.target.value)}
                placeholder="Skills (e.g. Tailwind, Bootstrap)"
                className="font-bold text-white  w-full  max-w-lg  max-h-[10dvh] overflow-y-auto focus:outline-none focus:border-primary focus:border-2 transition-colors"
              />

              <button
                onClick={() => removeGroup(i)}
                className="h-10 px-3 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={addGroup}
        className="mt-4 w-full py-2 border-2 border-dashed border-gray-700 text-gray-400 hover:border-primary hover:text-primary rounded-lg transition-all"
      >
        + Add Skill Category
      </button>

      <div className="flex gap-4 mt-8">
        <button onClick={() => setStep(3)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md">
          ← Back
        </button>

        <button
          onClick={() => handleSaveAndNext(5)}
          className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-zinc-900 font-semibold rounded-md shadow-md transition hover:bg-white/70"
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
}
