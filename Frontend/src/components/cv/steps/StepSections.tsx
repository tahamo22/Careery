// src/components/cv/steps/StepSections.tsx
"use client";
import React, { useState } from "react";

type Item = {
  title: string;
  subtitle?: string;
  key_achievements?: string[];
  from?: string;
  to?: string;
  location?: string;
};

type Section = { section_name: string; items: Item[] };

export default function StepSections({ formData, setFormData, handleSaveAndNext, setStep }: any) {
  const [sectionName, setSectionName] = useState("");
  const [item, setItem] = useState<Item>({
    title: "",
    subtitle: "",
    key_achievements: [],
    from: "",
    to: "",
    location: "",
  });
  const [achievement, setAchievement] = useState("");
  const [currentItems, setCurrentItems] = useState<Item[]>([]);
  const [editSecIndex, setEditSecIndex] = useState<number | null>(null);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);

  const sections: Section[] = Array.isArray(formData.custom_sections) ? formData.custom_sections : [];

  const addAchievement = () => {
    if (!achievement.trim()) return;
    setItem({
      ...item,
      key_achievements: [...(item.key_achievements || []), achievement.trim()],
    });
    setAchievement("");
  };

  const removeAchievement = (idx: number) => {
    setItem({
      ...item,
      key_achievements: (item.key_achievements || []).filter((_, i) => i !== idx),
    });
  };

  const addOrUpdateItem = () => {
    if (!item.title || !item) return;
    const list = [...currentItems].filter((it) => it != null);
    if (editItemIndex !== null && list[editItemIndex]) {
      list[editItemIndex] = item;
    } else {
      list.push(item);
    }
    setCurrentItems(list);
    setItem({
      title: "",
      subtitle: "",
      key_achievements: [],
      from: "",
      to: "",
      location: "",
    });
    setAchievement("");
    setEditItemIndex(null);
  };

  const removeItem = (idx: number) => setCurrentItems(currentItems.filter((_, i) => i !== idx));

  const editItem = (idx: number) => {
    setEditItemIndex(idx);
    setItem({
      ...(currentItems[idx] || {
        title: "",
        subtitle: "",
        key_achievements: [],
        from: "",
        to: "",
        location: "",
      }),
    });
    setAchievement("");
  };

  const saveSection = () => {
    if (!sectionName) return;
    // Filter out any null items before saving
    const validItems = currentItems.filter((it) => it != null && it.title);
    const newSection: Section = { section_name: sectionName, items: validItems };
    const copy = [...sections];

    if (editSecIndex !== null) copy[editSecIndex] = newSection;
    else copy.push(newSection);

    setFormData({ ...formData, custom_sections: copy });

    // reset
    setSectionName("");
    setCurrentItems([]);
    setItem({
      title: "",
      subtitle: "",
      key_achievements: [],
      from: "",
      to: "",
      location: "",
    });
    setAchievement("");
    setEditItemIndex(null);
    setEditSecIndex(null);
  };

  const editSection = (idx: number) => {
    setEditSecIndex(idx);
    setSectionName(sections[idx].section_name);
    // Filter out any null items when editing
    setCurrentItems((sections[idx].items || []).filter((it) => it != null));
  };

  const removeSection = (idx: number) => {
    setFormData({
      ...formData,
      custom_sections: sections.filter((_, i) => i !== idx),
    });
    if (editSecIndex === idx) {
      setSectionName("");
      setCurrentItems([]);
      setEditSecIndex(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 6: Custom Sections (Certificates, Awards, Projects...)</h2>

      <input
        placeholder="Section Name (e.g., Certificates)"
        value={sectionName}
        onChange={(e) => setSectionName(e.target.value)}
        className="w-full p-2 mb-3 bg-[#111] border border-gray-600 rounded"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          name="title"
          placeholder="Item Title"
          value={item.title}
          onChange={(e) => setItem({ ...item, title: e.target.value })}
          className="p-2 bg-[#111] border border-gray-600 rounded col-span-2"
        />

        <input
          name="from"
          placeholder="From"
          value={item.from || ""}
          onChange={(e) => setItem({ ...item, from: e.target.value })}
          className="p-2 bg-[#111] border border-gray-600 rounded"
        />
        <input
          name="to"
          placeholder="To"
          value={item.to || ""}
          onChange={(e) => setItem({ ...item, to: e.target.value })}
          className="p-2 bg-[#111] border border-gray-600 rounded"
        />
        <input
          name="location"
          placeholder="Location"
          value={item.location || ""}
          onChange={(e) => setItem({ ...item, location: e.target.value })}
          className="p-2 bg-[#111] border border-gray-600 rounded col-span-2"
        />
      </div>

      {/* Key Achievements */}
      <div className="flex gap-3 my-3 items-end">
        <div className="flex-1">
          <input
            name="achievement"
            placeholder="Key Achievement"
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAchievement();
              }
            }}
            className="w-full p-2 bg-[#111] border border-gray-600 rounded"
          />
        </div>
        <button onClick={addAchievement} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white">
          + Achievement
        </button>
      </div>

      {Array.isArray(item.key_achievements) && item.key_achievements.length > 0 && (
        <ul className="list-none mb-3 space-y-1">
          {item.key_achievements.map((ach, i) => (
            <li key={i} className="flex items-center gap-2 bg-[#0f0f0f] border border-gray-700 rounded p-2">
              <span className="text-gray-400">●</span>
              <div className="flex-1 text-sm">{ach}</div>
              <button onClick={() => removeAchievement(i)} className="text-xs px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded text-white">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* أزرار إضافة / تعديل الآيتم */}
      <div className="flex gap-3 mt-3">
        <button onClick={addOrUpdateItem} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-sm">
          {editItemIndex !== null ? "Update Item" : "Add Item"}
        </button>

        {editItemIndex !== null && (
          <button
            onClick={() => {
              setEditItemIndex(null);
              setItem({
                title: "",
                subtitle: "",
                key_achievements: [],
                from: "",
                to: "",
                location: "",
              });
              setAchievement("");
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
          >
            Cancel
          </button>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {currentItems.map((it, i) => (
          <li key={i} className="flex items-start justify-between bg-[#0f0f0f] border border-gray-700 rounded p-3">
            <div>
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs text-gray-400">
                {it.from || ""}
                {it.from && it.to ? " – " : ""}
                {it.to || ""}
                {it.location ? ` · ${it.location}` : ""}
              </div>
              {it.subtitle && <div className="italic">{it.subtitle}</div>}
              {Array.isArray(it.key_achievements) && it.key_achievements.length > 0 && (
                <ul className="list-none mt-1 space-y-1">
                  {it.key_achievements.map((ach, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400">●</span>
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => editItem(i)} className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded">
                Edit
              </button>
              <button onClick={() => removeItem(i)} className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded">
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* زر حفظ السيكشن */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={saveSection}
          className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-zinc-900 cursor-pointer hover:bg-white/70 duration-300   font-semibold rounded-md shadow-md transition"
        >
          {editSecIndex !== null ? "Update Section" : "Save Section"}
        </button>

        {editSecIndex !== null && (
          <button
            onClick={() => {
              setEditSecIndex(null);
              setSectionName("");
              setCurrentItems([]);
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
          >
            Cancel
          </button>
        )}
      </div>

      <h3 className="mt-6 font-bold">Saved Sections</h3>
      <ul className="mt-2 space-y-2">
        {sections.map((sec: Section, i: number) => (
          <li key={i} className="flex items-start justify-between bg-[#0f0f0f] border border-gray-700 rounded p-3">
            <div>
              <div className="font-semibold">{sec.section_name}</div>
              <div className="text-xs text-gray-400">{sec.items?.length || 0} item(s)</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => editSection(i)} className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded">
                Edit
              </button>
              <button onClick={() => removeSection(i)} className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded">
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Back + Finish */}
      <div className="flex gap-4 mt-6">
        <button onClick={() => setStep(5)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md">
          ← Back
        </button>
        <button
          onClick={() => handleSaveAndNext(7)}
          className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-zinc-900 cursor-pointer hover:bg-white/70 duration-300   font-semibold rounded-md shadow-md transition"
        >
          Finish & Final CV →
        </button>
      </div>
    </div>
  );
}
