import JobRow from "./JobRow";

export default function JobTable() {
  const jobs = [
    { title: "UI/UX Designer", status: "Active", applications: 798 },
    { title: "Senior UX Designer", status: "Active", applications: 185 },
    { title: "Technical Support Specialist", status: "Active", applications: 556 },
    { title: "Junior Graphic Designer", status: "Active", applications: 583 },
    { title: "Front End Developer", status: "Expired", applications: 740 },
  ];

  return (
    <div className="bg-[#1c1c1c] rounded-xl shadow mt-6 overflow-hidden">
      {/* Title + View all */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold text-gray-200">Recently Posted Jobs</h3>
        <button className="text-green-500 text-sm hover:underline">View all</button>
      </div>

      {/* Table */}
      <table className="w-full text-left">
        <thead className="bg-[#222] text-gray-400 text-sm">
          <tr>
            <th className="p-3">JOBS</th>
            <th className="p-3">STATUS</th>
            <th className="p-3">APPLICATIONS</th>
            <th className="p-3">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="text-gray-200 text-sm">
          {jobs.map((job, i) => (
            <JobRow key={i} job={job} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
