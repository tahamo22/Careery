import Image from "next/image";
import Link from "next/link";

export default function JobCard({ job }: { job: any }) {
  return (
    <Link
      href={`/user/jobs/${job.id}`}
      className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4 border hover:shadow-md transition cursor-pointer"
    >
      {/* Job Title + Tags */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{job.title}</h3>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
              {job.type}
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
              {job.source}
            </span>
          </div>
        </div>
      </div>

      {/* Company + Location */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <Image src={job.logo} alt="logo" width={22} height={22} />
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{job.company}</span>
          <span className="text-gray-500 text-xs flex items-center gap-1">
            📍 {job.location}
          </span>
        </div>
      </div>
    </Link>
  );
}
