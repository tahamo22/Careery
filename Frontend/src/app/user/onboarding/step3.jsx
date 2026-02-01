"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Link2, Trash2 } from "lucide-react";

export default function Step3({ next, back }) {
  const [links, setLinks] = useState([{ id: null, platform: "", url: "" }]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // تحميل الروابط القديمة
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await fetch(`${API_BASE_URL}/api/social-links/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setLinks(data);
          }
        }
      } catch (err) {
        console.error("Error fetching social links:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  const updateField = (index, field, value) => {
    setLinks((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addLink = () => {
    setLinks((prev) => [...prev, { id: null, platform: "", url: "" }]);
  };

  const removeLink = (id, index) => {
    if (!id) {
      setLinks((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this link?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("access");
    fetch(`${API_BASE_URL}/api/social-links/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setLinks((prev) => prev.filter((_, i) => i !== index));
      })
      .catch((err) => console.error("Delete error:", err));
  };

  const save = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) return setMessage("Not logged in.");

      const valid = links.filter(
        (l) => l.platform.trim() !== "" && l.url.trim() !== ""
      );

      for (const link of valid) {
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
            const newLink = await res.json();
            setLinks((prev) =>
              prev.map((l) => (l === link ? { ...l, id: newLink.id } : l))
            );
          }
        }
      }

      setMessage("Social links saved successfully!");
      next();
    } catch (err) {
      console.error(err);
      setMessage("Error: " + err.message);
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <section className="bg-[#0b0b0b] border border-gray-800 rounded-2xl shadow-lg p-10">
      <h2 className="flex items-center gap-2 text-2xl font-bold mb-8 text-white">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/15 border border-blue-500/40">
          <Link2 className="h-5 w-5 text-blue-400" />
        </span>
        <span>Social Links</span>
      </h2>

      {links.map((link, i) => (
        <div key={link.id ?? i} className="grid grid-cols-2 gap-6 mb-4">
          <input
            type="text"
            placeholder="Platform (LinkedIn, GitHub, Behance...)"
            value={link.platform}
            onChange={(e) => updateField(i, "platform", e.target.value)}
            className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 focus:border-sky-500 transition"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Profile URL"
              value={link.url}
              onChange={(e) => updateField(i, "url", e.target.value)}
              className="flex-1 bg-[#111] border border-gray-700 rounded px-3 py-2 focus:border-sky-500 transition"
            />
            <button
              onClick={() => removeLink(link.id, i)}
              className="inline-flex items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 px-2 hover:bg-red-500/20 transition"
              title="Remove link"
              type="button"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addLink}
        type="button"
        className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg mb-6 font-semibold text-white"
      >
        + Add New Link
      </button>

      <div className="flex justify-between mt-10">
        <button
          onClick={back}
          className="bg-gray-700 px-8 py-3 rounded-lg text-white"
          type="button"
        >
          ← Back
        </button>
        <button
          onClick={save}
          className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-lg font-semibold text-white transition"
          type="button"
        >
          Save & Continue →
        </button>
      </div>

      {message && (
        <p className="text-sm mt-4 text-center text-gray-300">{message}</p>
      )}
    </section>
  );
}
