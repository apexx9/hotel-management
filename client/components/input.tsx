"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<typeof ShadcnInput> {
  error?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string;
  onValueChange?: (value: any) => void;
}

export default function Input({
  error,
  className,
  type,
  label,
  id,
  ...props
}: InputProps) {
  const isPassword = type === "pass";
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type ?? "text";
  const inputId =
    id ??
    (label
      ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : undefined);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-[#0C0332]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <ShadcnInput
          id={inputId}
          type={inputType}
          className={cn(
            "h-12 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-[#0C0332] shadow-sm transition-all",
            "placeholder:text-slate-400 hover:border-slate-300",
            "focus-visible:border-[#1900FF] focus-visible:ring-4 focus-visible:ring-[#1900FF]/15",
            error
              ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/15"
              : undefined,
            isPassword ? "pr-12" : undefined,
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-[#8A8A99] transition-colors hover:text-[#1900FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1900FF]/30 rounded-md"
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" />
            ) : (
              <Eye className="h-4.5 w-4.5" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}