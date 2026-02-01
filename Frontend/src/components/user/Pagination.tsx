export default function Pagination() {
  return (
    <div className="flex justify-center items-center gap-3 mt-8">
      <button className="px-3 py-1 rounded bg-gray-200">←</button>
      <button className="px-3 py-1 rounded bg-green-600 text-white">01</button>
      <button className="px-3 py-1 rounded bg-gray-200">02</button>
      <button className="px-3 py-1 rounded bg-gray-200">03</button>
      <button className="px-3 py-1 rounded bg-gray-200">→</button>
    </div>
  );
}
