"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps {
  type: "text" | "drop" | "pass" | "email" | "number" | "tel" | "date"; // extend as needed
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  options?: { value: string; label: string }[];
  className?: string;
}

const Input = ({
  type,
  label,
  placeholder,
  value,
  onChange,
  options = [],
  className,
}: InputProps) => {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  // 1. Dropdown (select)
  if (type === "drop") {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-[16px] font-bold text-[#0A0332]">
            {label}
          </label>
        )}
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`${className} bg-[#BCB1FF3D] border rounded-[13px] placeholder:text-[14px] placeholder:font-medium placeholder:text-[#969696] px-4 py-2.75`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // 2. Password with toggle
  if (type === "pass") {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-[16px] font-bold text-[#0A0332]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={id}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`${className} bg-[#BCB1FF3D] border rounded-[13px] placeholder:text-[14px] placeholder:font-medium placeholder:text-[#969696] px-4 py-2.75 w-full pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    );
  }

  // 3. All other types: text, email, number, tel, date, etc.
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-[16px] font-bold text-[#0A0332]">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type} // uses whatever type was passed in (e.g., "email", "number", "date", "text")
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${className} bg-[#BCB1FF3D] border rounded-[13px] placeholder:text-[14px] placeholder:font-medium placeholder:text-[#969696] px-4 py-2.75`}
      />
    </div>
  );
};

export default Input;
