import Image from "next/image";
import React from "react";
import BedImage from "../public/assets/streamline-plump_hotel-bed-5-solid.png";

const Logo = () => {
  return (
    <div className="flex items-end justify-center gap-2">
      <Image
        src={BedImage}
        alt="Company Logo"
        className="h-24.75 w-auto" // matches text line‑height
      />
      <p className="font-bold text-[99px] leading-none text-[#1900FF] tracking-tight">
        otel
      </p>
    </div>
  );
};

export default Logo;
