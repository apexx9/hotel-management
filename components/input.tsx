"use client";

import { useId, useState, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import useClickOutside from "@/hooks/useClickOutside";

interface InputProps {
  type: "text" | "drop" | "pass" | "email" | "number" | "tel" | "date";
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string,
  ) => void;
  options?: { value: string; label: string }[];
  className?: string;
  required?: boolean;
  wrapperClassName?: string;
}

const Input = ({
  type,
  label,
  placeholder,
  value,
  onChange,
  options = [],
  className = "",
  required = false,
  wrapperClassName = "",
}: InputProps) => {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  // ---- Internal state for dropdown (uncontrolled fallback) ----
  const [internalValue, setInternalValue] = useState<string | undefined>(value);
  // Use external value if provided, otherwise internal state
  const currentValue = value !== undefined ? value : internalValue;

  // Dropdown toggle
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useClickOutside<HTMLUListElement>(
    () => setIsOpen(false),
    triggerRef,
  );

  const selectedOption = options.find((opt) => opt.value === currentValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const labelElement = label && (
    <label htmlFor={id} className="text-[16px] font-bold text-[#0A0332]">
      {label}
      {required && <span className="ml-0.5 text-[#9D9D9D]">*</span>}
    </label>
  );

  // Shared input styles
  const inputStyles = `
    ${className}
    w-full
    rounded-[13px]
    border
    border-transparent
    bg-[#BCB1FF3D]
    px-4
    py-2.75
    placeholder:text-[14px]
    placeholder:font-medium
    placeholder:text-[#969696]
    transition-colors
    duration-250
    outline-none
    focus:outline-none
    focus-visible:outline-none
    focus:ring-0
    focus-visible:ring-0
    focus:border-[#1900FF]
    hover:border-[#1900FF]
  `;

  // ───────── 1. Custom dropdown ─────────
  if (type === "drop") {
    return (
      <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
        {labelElement}

        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`
              ${className}
              relative
              w-full
              cursor-pointer
              rounded-[13px]
              border
              border-transparent
              bg-[#BCB1FF3D]
              px-4
              py-2.75
              pr-14
              text-left
              outline-none
              transition-colors
              duration-250
              hover:border-[#1900FF]
              focus:border-[#0073ff]
              focus:outline-none
              focus-visible:border-[#1900FF]
              focus-visible:outline-none
              focus:ring-0
              focus-visible:ring-0
            `}
          >
            <span
              className={
                selectedOption
                  ? "text-[14px] font-medium text-black"
                  : "text-[14px] font-medium text-[#969696]"
              }
            >
              {displayText}
            </span>

            <svg
              className={`pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
            >
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="#969696"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {isOpen && (
            <ul
              ref={dropdownRef}
              className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-[13px] border border-transparent bg-white shadow-[0px_0px_29px_0px_#00000014]"
            >
              {options.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => {
                    // Update internal state (uncontrolled mode)
                    setInternalValue(opt.value);
                    // Call external onChange with the value
                    onChange?.(opt.value);
                    setIsOpen(false);
                  }}
                  className="mx-3 my-2 cursor-pointer px-4 py-3 text-[14px] text-black hover:bg-[#DADADA3D] rounded-[13px]"
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ───────── 2. Password input ─────────
  if (type === "pass") {
    return (
      <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
        {labelElement}

        <div className="relative">
          <input
            id={id}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e)}
            className={`${inputStyles} pr-10`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 outline-none hover:text-gray-700 focus:outline-none focus:ring-0"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    );
  }

  // ───────── 3. All other inputs ─────────
  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {labelElement}

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e)}
        className={inputStyles}
      />
    </div>
  );
};

export default Input;
