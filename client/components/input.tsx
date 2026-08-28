"use client";

import React, { forwardRef, useId, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import useClickOutside from "@/hooks/useClickOutside";

export interface InputOption {
  value: string;
  label: string;
}

export type InputType =
  | "text"
  | "drop"
  | "pass"
  | "email"
  | "number"
  | "tel"
  | "date";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  type: InputType;
  label?: string;
  placeholder?: string;
  options?: InputOption[];
  wrapperClassName?: string;
  error?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      label,
      placeholder,
      options = [],
      wrapperClassName = "",
      error,
      className = "",
      required = false,
      value,
      onValueChange,
      id: providedId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    const [showPassword, setShowPassword] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState("");

    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useClickOutside<HTMLUListElement>(
      () => setIsOpen(false),
      triggerRef,
    );

    const currentValue = value !== undefined ? value : internalValue;
    const selectedOption = options.find(
      (option) => option.value === currentValue,
    );
    const hasError = Boolean(error);

    const labelElement = label ? (
      <label htmlFor={id} className="text-xs font-semibold text-[#0C0332]">
        {label}
        {required && (
          <span className="ml-1 text-[#D92D20]" aria-hidden="true">
            *
          </span>
        )}
      </label>
    ) : null;

    const errorElement = error ? (
      <p id={`${id}-error`} className="text-[10px] font-medium text-[#D92D20]">
        {error}
      </p>
    ) : null;

    const inputClasses = `
      w-full h-9 rounded-lg border bg-[#FBFBFC] px-3 py-2 text-xs font-medium text-[#0C0332]
      placeholder:text-[#8A8787] outline-none transition-all duration-200
      ${
        hasError
          ? "border-[#D92D20] focus:border-[#D92D20] focus:ring-1 focus:ring-[#D92D20]/10"
          : "border-[#E8E8E8] hover:border-[#D4D4D4] focus:border-[#1900FF] focus:bg-white focus:ring-1 focus:ring-[#1900FF]/10"
      }
    `;

    if (type === "drop") {
      return (
        <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
          {labelElement}

          <div className="relative">
            <button
              ref={triggerRef}
              id={id}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-invalid={hasError}
              aria-describedby={error ? `${id}-error` : undefined}
              onClick={() => setIsOpen((open) => !open)}
              className={`
                flex h-9 w-full items-center justify-between rounded-lg border bg-[#FBFBFC] px-3 py-2
                text-left text-xs font-medium outline-none transition-all duration-200
                ${
                  hasError
                    ? "border-[#D92D20] focus:ring-1 focus:ring-[#D92D20]/10"
                    : "border-[#E8E8E8] hover:border-[#D4D4D4] focus:border-[#1900FF] focus:bg-white focus:ring-1 focus:ring-[#1900FF]/10"
                }
              `}
            >
              <span
                className={
                  selectedOption ? "text-[#0C0332]" : "text-[#8A8787]"
                }
              >
                {selectedOption?.label ?? placeholder}
              </span>
              <ChevronDown
                size={14}
                className={`shrink-0 text-[#8A8787] transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {isOpen && (
              <ul
                ref={dropdownRef}
                id={`${id}-dropdown`}
                role="listbox"
                aria-labelledby={id}
                className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-[#E8E8E8] bg-white p-1.5 shadow-lg"
              >
                {options.length > 0 ? (
                  options.map((option) => {
                    const selected = option.value === currentValue;
                    return (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setInternalValue(option.value);
                          onValueChange?.(option.value);
                          setIsOpen(false);
                        }}
                        className={`
                          cursor-pointer rounded-md px-3 py-2 text-xs font-medium transition-colors
                          ${
                            selected
                              ? "bg-[#F1F0FF] text-[#1900FF]"
                              : "text-[#0C0332] hover:bg-[#F1F0F0]"
                          }
                        `}
                      >
                        {option.label}
                      </li>
                    );
                  })
                ) : (
                  <li className="px-3 py-2 text-xs text-[#8A8787]">
                    No options available
                  </li>
                )}
              </ul>
            )}
          </div>

          {errorElement}
        </div>
      );
    }

    if (type === "pass") {
      return (
        <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
          {labelElement}

          <div className="relative">
            <input
              {...props}
              id={id}
              ref={ref}
              type={showPassword ? "text" : "password"}
              value={value}
              aria-invalid={hasError}
              aria-describedby={error ? `${id}-error` : undefined}
              className={`${inputClasses} pr-12 ${className}`}
              placeholder={placeholder}
            />

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8A8787] transition-colors hover:text-[#0C0332] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1900FF]/20"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {errorElement}
        </div>
      );
    }

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {labelElement}

        <input
          {...props}
          id={id}
          ref={ref}
          type={type}
          value={value}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
          className={`${inputClasses} ${className}`}
        />

        {errorElement}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
