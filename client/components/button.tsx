import React, { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  text: string;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  text,
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "rounded-xl font-bold text-sm flex items-center justify-center w-full py-3 px-6 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1900FF]/40";
  const primaryClasses =
    "bg-[#1900FF] text-white hover:bg-[#1500E0] active:scale-[0.98]";
  const secondaryClasses =
    "border border-[#1900FF] text-[#0C0332] hover:bg-[#F6F6F6] active:scale-[0.98]";

  return (
    <button
      className={`${baseClasses} ${
        variant === "primary" ? primaryClasses : secondaryClasses
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : text}
    </button>
  );
};

export default Button;
