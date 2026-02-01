import React, { useEffect, useRef } from "react";

/* Safe ContentEditable Input defined in its own file to maintain focus and reusability */
interface RichInputProps {
  name: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (e: any) => void;
  error?: string;
  className?: string; // To allow external styling adjustments
}

export default function RichInput({ name, placeholder, required = false, value, onChange, error, className = "" }: RichInputProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync only when value externally changes and differs from current text
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className={`mb-3 ${className}`}>
      <p className="text-xs text-slate-400 mb-1 ml-1">
        {placeholder} {required && <span className="text-red-400">*</span>}
      </p>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={`w-full p-2 bg-[#111] border border-gray-600 rounded max-h-[10dvh] overflow-y-auto focus:outline-none focus:border-primary focus:border-2 transition-colors  ${
          error ? "border-red-500" : "border-gray-600"
        }`}
        onInput={(e) => {
          const val = e.currentTarget.innerHTML;
          onChange({ target: { name, value: val } });
        }}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
