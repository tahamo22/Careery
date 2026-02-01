import Image from "next/image";

export default function DashboardCard({ title, value, icon, bg }) {
  return (
    <div className={`flex items-center justify-between p-6 rounded-xl shadow ${bg}`}>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-gray-600 text-sm">{title}</p>
      </div>
      <div className="bg-white p-2 rounded-md shadow">
        <Image src={icon} alt={title} width={28} height={28} />
      </div>
    </div>
  );
}
