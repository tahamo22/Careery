export default function Button({ children, variant = "primary", className = "", ...props }) {
  const baseStyle =
    "px-6 py-2 rounded-md font-semibold transition focus:outline-none";
  const variants = {
    primary: "bg-green-500 text-white hover:bg-green-600",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
    