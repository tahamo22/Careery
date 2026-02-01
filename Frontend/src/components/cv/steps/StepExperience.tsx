// src/components/cv/steps/StepExperience.tsx
"use client";
import React, { useState } from "react";
import RichInput from "../RichInput";
import RichTextDisplay from "../RichTextDisplay";

type Exp = {
  role: string;
  company: string;
  location?: string;
  from?: string;
  to?: string;
  tasks: string[];
};

export default function StepExperience({ formData, setFormData, handleSaveAndNext, setStep }: any) {
  const [exp, setExp] = useState<Exp>({
    role: "",
    company: "",
    location: "",
    from: "",
    to: "",
    tasks: [],
  });
  const [task, setTask] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const list: Exp[] = Array.isArray(formData.experiences) ? formData.experiences : [];

  const change = (e: any) => setExp({ ...exp, [e.target.name]: e.target.value });

  const addTask = () => {
    if (!task) return;
    setExp({ ...exp, tasks: [...(exp.tasks || []), task] });
    setTask("");
  };

  const removeTask = (idx: number) => {
    setExp({
      ...exp,
      tasks: (exp.tasks || []).filter((_, i) => i !== idx),
    });
  };

  const save = () => {
    if (!exp.role && !exp.company) return;
    const copy = [...list];
    if (editIndex !== null) copy[editIndex] = exp;
    else copy.push(exp);
    setFormData({ ...formData, experiences: copy });
    setExp({
      role: "",
      company: "",
      location: "",
      from: "",
      to: "",
      tasks: [],
    });
    setTask("");
    setEditIndex(null);
  };

  const edit = (idx: number) => {
    setEditIndex(idx);
    setExp({
      ...(list[idx] || {
        role: "",
        company: "",
        location: "",
        from: "",
        to: "",
        tasks: [],
      }),
    });
    setTask("");
  };

  const remove = (idx: number) => {
    setFormData({
      ...formData,
      experiences: list.filter((_, i) => i !== idx),
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 5: Experience</h2>

      <RichInput name="role" placeholder="Role" value={exp.role} onChange={change} />
      <RichInput name="company" placeholder="Company" value={exp.company} onChange={change} />

      <div className="grid grid-cols-2 gap-3">
        <RichInput name="from" placeholder="From (e.g. 2021-01)" value={exp.from || ""} onChange={change} />
        <RichInput name="to" placeholder="To (e.g. 2023-06)" value={exp.to || ""} onChange={change} />
        <RichInput name="location" placeholder="Location" value={exp.location || ""} onChange={change} className="col-span-2" />
      </div>

      <div className="flex gap-3 my-3 items-end">
        <div className="flex-1">
          <RichInput name="task" placeholder="Task / Achievement" value={task} onChange={(e) => setTask(e.target.value)} />
        </div>
        <button onClick={addTask} className="px-4 bg-blue-600 hover:bg-blue-500 rounded text-white">
          + Task
        </button>
      </div>

      {Array.isArray(exp.tasks) && exp.tasks.length > 0 && (
        <ul className="list-disc ml-6 mb-3">
          {exp.tasks.map((t, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <RichTextDisplay content={t} />
              </div>
              <button onClick={() => removeTask(i)} className="text-xs px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded text-white">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <button onClick={save} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white">
          {editIndex !== null ? "Update" : "Add"}
        </button>
        {editIndex !== null && (
          <button
            onClick={() => {
              setEditIndex(null);
              setExp({
                role: "",
                company: "",
                location: "",
                from: "",
                to: "",
                tasks: [],
              });
              setTask("");
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Cancel
          </button>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {list.map((e: Exp, i: number) => (
          <li key={i} className="flex items-start justify-between bg-[#0f0f0f] border border-gray-700 rounded p-3">
            <div>
              <RichTextDisplay content={e.role} className="font-semibold" />
              <RichTextDisplay content={e.company} className="italic" />
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
              {Array.isArray(e.tasks) && e.tasks.length > 0 && (
                <ul className="list-disc ml-6">
                  {e.tasks.map((t: string, j: number) => (
                    <li key={j}>
                      <RichTextDisplay content={t} />
                    </li>
                  ))}
                </ul>
              )}
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
        <button onClick={() => setStep(4)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
          ← Back
        </button>
        <button
          onClick={() => {
            save();
            handleSaveAndNext(6);
          }}
          className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-zinc-900 cursor-pointer hover:bg-white/70 duration-300   font-semibold rounded-md shadow-md transition"
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
}
