import React from "react";
interface ButtonProps {
  type: "primary" | "secondary";
  text: string;
  className?: string;
}
const button: React.FC<ButtonProps> = ({ type, text, className }) => {
  {
    type === "primary" ? (
      <button
        className={`${className} bg-[#1900FF] text-white rounded-[13px] font-bold text-[14px] flex items-center justify-center`}
      >
        {text}
      </button>
    ) : (
      <button
        className={`${className} bg-white rounded-[13px] border border-[#1900FF] text-[#463E3E] font-bold text-[14px] flex items-center justify-center`}
      >
        {text}
      </button>
    );
  }
};

export default button;
