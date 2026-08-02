import Image from "next/image";
import React from "react";
import BedImage from "../public/assets/streamline-plump_hotel-bed-5-solid.png";

const Logo = () => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Image src={BedImage} alt="Company Logo" className="" />
      <p className="font-bold text-[99px] text-[#1900FF] tracking-tight">
        otel
      </p>
    </div>
  );
};

export default Logo;
