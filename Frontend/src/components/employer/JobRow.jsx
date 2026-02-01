"use client";
import { useState } from "react";

export default function JobRow({ job }) {
  const [status, setStatus] = useState(job.status);
  const [open, setOpen] = useState(false);

  const handlePromote = () => {
    setStatus("Promoted");
    setOpen(false);
  };

  const handleExpired = () => {
    setStatus("Expired");
    setOpen(false);
  };

  return (
    <tr className="border-b border-gray-700 relative">
      <td className="p-3">{job.title}</td>

      <td className="p-3">
        {status === "Active" && <span className="text-green-500">● Active</span>}
        {status === "Expired" && <span className="text-red-500">● Expired</span>}
        {status === "Promoted" && <span className="text-blue-400">★ Promoted</span>}
      </td>

      <td className="p-3">{job.applications} Applications</td>

      <td className="p-3 flex items-center gap-2 relative">
        <button className="px-3 py-1 bg-green-600 text-white rounded">
          View Applications
        </button>

        {/* Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="px-2 py-1 bg-gray-200 text-black rounded"
        >
          ⋮
        </button>

        {open && (
          <div className="absolute right-0 top-10 w-40 bg-[#111] text-gray-200 rounded shadow-lg p-2 space-y-2 z-50">
            <button
              onClick={handlePromote}
              className="block w-full text-left hover:text-blue-400"
            >
              ➕ Promote Job
            </button>
            <button
              onClick={() => setOpen(false)}
              className="block w-full text-left hover:text-green-400"
            >
              👁 View Detail
            </button>
            <button
              onClick={handleExpired}
              className="block w-full text-left hover:text-red-400"
            >
              ✖ Mark as expired
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
