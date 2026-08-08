import Image from "next/image";
import React from "react";
import BedImage from "../public/assets/streamline-plump_hotel-bed-5-solid.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: {
    image: "h-10",
    text: "text-[42px]",
    gap: "gap-1",
  },
  md: {
    image: "h-14",
    text: "text-[58px]",
    gap: "gap-1.5",
  },
  lg: {
    image: "h-18 md:h-20",
    text: "text-[72px] md:text-[80px]",
    gap: "gap-2",
  },
};

const Logo = ({ size = "md" }: LogoProps) => {
  const styles = sizes[size];

  return (
    <div
      className={`flex items-end justify-center ${styles.gap}`}
      aria-label="Hotel Management System"
    >
      <Image
        src={BedImage}
        alt=""
        width={100}
        height={100}
        className={`${styles.image} w-auto`}
        priority
      />

      <span
        className={`font-bold leading-none tracking-tight text-[#1900FF] ${styles.text}`}
      >
        otel
      </span>
    </div>
  );
};

export default Logo;
