import React from "react";

interface ButtonProps {
  type: "primary" | "secondary";
  text: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ type, text, className = "" }) => {
  const baseClasses =
    "rounded-[13px] font-bold text-[14px] flex items-center justify-center w-full py-3 px-6 transition-colors duration-200";
  const primaryClasses = "bg-[#1900FF] text-white hover:bg-[#1600DF]";
  const secondaryClasses =
    "border border-[#1900FF] text-[#463E3E] hover:bg-gray-50";

  return (
    <button
      className={`${baseClasses} ${
        type === "primary" ? primaryClasses : secondaryClasses
      } ${className}`}
    >
      {text}
    </button>
  );
};

export default Button;
