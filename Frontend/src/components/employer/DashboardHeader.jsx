export default function DashboardHeader({ username }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">Hello, {username}</h2>
      <p className="text-gray-400 text-sm">
        Here is your daily activities and applications
      </p>
    </div>
  );
}
