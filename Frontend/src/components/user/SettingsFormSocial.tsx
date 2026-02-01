"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type SocialLink = {
  id?: number;
  platform: string;
  url: string;
};

// ✅ الحقول التي يمكن تعديلها من الإنبتس
type EditableField = "platform" | "url";

export default function SettingsFormSocial() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [message, setMessage] = useState("");

  // تحميل اللينكات
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch(`${API_BASE_URL}/api/social-links/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLinks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching social links:", err);
      }
    };
    fetchLinks();
  }, []);

  // ✅ تحديث قيمة داخل مصفوفة اللينكات (بدون touching للـ id)
  const updateField = (idx: number, field: EditableField, value: string) => {
    setLinks((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // حفظ (إنشاء + تعديل)
  const save = async () => {
    try {
      setMessage("");
      const token = localStorage.getItem("access");
      if (!token) return setMessage("⚠️ Not logged in");

      // بلاش نبعت ريكوردز فاضية
      const cleaned = links.filter(
        (l) => l.platform.trim() !== "" && l.url.trim() !== ""
      );

      for (const link of cleaned) {
        if (link.id) {
          await fetch(`${API_BASE_URL}/api/social-links/${link.id}/`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              platform: link.platform.trim(),
              url: link.url.trim(),
            }),
          });
        } else {
          const res = await fetch(`${API_BASE_URL}/api/social-links/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              platform: link.platform.trim(),
              url: link.url.trim(),
            }),
          });
          if (res.ok) {
            const created = await res.json();
            // حدّث الـ id للعنصر اللي اتضاف عشان الحذف/التعديل يشتغل بعدين
            setLinks((prev) => {
              const copy = [...prev];
              const idx = copy.findIndex(
                (l) => l === link // نفس الريفرنس قبل الإرسال
              );
              if (idx !== -1) copy[idx] = { ...copy[idx], id: created.id };
              return copy;
            });
          }
        }
      }

      setMessage("✅ Links saved successfully!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    }
  };

  // حذف لينك
  const remove = async (id?: number) => {
    try {
      const token = localStorage.getItem("access");
      if (id) {
        await fetch(`${API_BASE_URL}/api/social-links/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Social Links</h2>

      {links.map((link, idx) => (
        <div key={link.id ?? idx} className="flex gap-4 items-center">
          <input
            type="text"
            value={link.platform}
            onChange={(e) => updateField(idx, "platform", e.target.value)}
            placeholder="Platform (Facebook, Github, YouTube ...)"
            className="w-1/3 bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            value={link.url}
            onChange={(e) => updateField(idx, "url", e.target.value)}
            placeholder="URL"
            className="flex-1 bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2"
          />
          <button
            onClick={() => remove(link.id)}
            className="text-red-500 hover:text-red-600"
            title="Remove"
          >
            ❌
          </button>
        </div>
      ))}

      <button
        onClick={() => setLinks((prev) => [...prev, { platform: "", url: "" }])}
        className="bg-gray-700 px-4 py-1 rounded"
      >
        + Add Link
      </button>

      <button
        onClick={save}
        className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold mt-4"
      >
        Save Changes
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}
