export default function Card({ children, className }) {
  return (
    <div
      className={`bg-white shadow-lg rounded-xl ${className || ""}`}
    >
      {children}
    </div>
  );
}
