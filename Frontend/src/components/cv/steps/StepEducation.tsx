// src/components/cv/steps/StepEducation.tsx
"use client";
import React, { useState } from "react";
import RichInput from "../RichInput";
import RichTextDisplay from "../RichTextDisplay";

type Edu = {
  degree: string;
  school: string;
  from?: string;
  to?: string;
  location?: string;
  desc?: string;
};

export default function StepEducation({ formData, setFormData, handleSaveAndNext, setStep }: any) {
  const [edu, setEdu] = useState<Edu>({
    degree: "",
    school: "",
    from: "",
    to: "",
    location: "",
    desc: "",
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const onChange = (e: any) => setEdu({ ...edu, [e.target.name]: e.target.value });

  const save = () => {
    if (!edu.degree && !edu.school) return;
    const list = [...(formData.educations || [])];
    if (editIndex !== null) {
      list[editIndex] = edu;
    } else {
      list.push(edu);
    }
    setFormData({ ...formData, educations: list });
    setEdu({ degree: "", school: "", from: "", to: "", location: "" });
    setEditIndex(null);
  };

  const edit = (idx: number) => {
    setEditIndex(idx);
    setEdu({ ...(formData.educations?.[idx] || {}) });
  };

  const remove = (idx: number) => {
    const list = (formData.educations || []).filter((_: any, i: number) => i !== idx);
    setFormData({ ...formData, educations: list });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 3: Education</h2>

      <div className="grid grid-cols-2 gap-3">
        <RichInput name="degree" placeholder="Degree" value={edu.degree} onChange={onChange} className="col-span-2" />
        <RichInput name="school" placeholder="School" value={edu.school} onChange={onChange} className="col-span-2" />
        <RichInput name="from" placeholder="From (e.g. 2019)" value={edu.from || ""} onChange={onChange} />
        <RichInput name="to" placeholder="To (e.g. 2023)" value={edu.to || ""} onChange={onChange} />
        <RichInput name="location" placeholder="Location" value={edu.location || ""} onChange={onChange} className="col-span-2" />
        <RichInput name="desc" placeholder="Relevant Coursework" value={edu.desc || ""} onChange={onChange} className="col-span-2" />
      </div>

      <div className="flex gap-4 mt-3">
        <button onClick={save} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white">
          {editIndex !== null ? "Update" : "Add"}
        </button>
        {editIndex !== null && (
          <button
            onClick={() => {
              setEditIndex(null);
              setEdu({
                degree: "",
                school: "",
                from: "",
                to: "",
                location: "",
              });
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Cancel
          </button>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {(formData.educations || []).map((e: Edu, i: number) => (
          <li key={i} className="flex items-start justify-between bg-[#0f0f0f] border border-gray-700 rounded p-3">
            <div>
              <RichTextDisplay content={e.degree} className="font-semibold" />
              <RichTextDisplay content={e.school} className="text-sm" />
              <div className="text-xs text-gray-400">
                <RichTextDisplay content={e.from} as="span" />
                {e.from && e.to ? " – " : ""}
                <RichTextDisplay content={e.to} as="span" />
                {e.location ? (
                  <>
                    {" · "}
                    <RichTextDisplay content={e.location} as="span" />
                  </>
                ) : (
                  ""
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(i)} className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-white">
                Edit
              </button>
              <button onClick={() => remove(i)} className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-white">
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-4 mt-6">
        <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
          ← Back
        </button>

        {/* Save data + move to next */}
        <button
          onClick={() => {
            save();
            handleSaveAndNext(4);
          }}
          className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-zinc-900 cursor-pointer hover:bg-white/70 duration-300   font-semibold rounded-md shadow-md transition"
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
}
