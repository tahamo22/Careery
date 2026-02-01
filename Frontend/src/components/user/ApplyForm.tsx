"use client";
import { useState } from "react";

export default function ApplyForm({
  jobTitle,
  onClose,
}: {
  jobTitle: string;
  onClose: () => void;
}) {
  const [resume, setResume] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const handleApply = () => {
    // مؤقتاً console — بعدين تربطها بـ API
    console.log("Resume:", resume);
    console.log("Cover Letter:", coverLetter);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#111] text-white rounded-xl shadow-xl w-full max-w-lg p-6">
        {/* Title */}
        <h2 className="text-xl font-bold mb-4">
          Apply Job: <span className="text-green-400">{jobTitle}</span>
        </h2>

        {/* Upload Resume */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Upload Resume</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
            className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Cover Letter */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Cover Letter</label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Write your cover letter here..."
            className="w-full bg-[#1c1c1c] border border-gray-700 rounded-lg px-3 py-2 text-sm min-h-[120px]"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold"
          >
            Apply Now →
          </button>
        </div>
      </div>
    </div>
  );
}
