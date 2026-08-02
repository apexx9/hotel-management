import React from "react";
import Image from "next/image";
import Logo from "../logo";

interface WrapperProps {
  children: React.ReactNode;
}
const images = [
  {
    id: 1,
    image: "./assets/POS/rectangle-201",
    alt: "",
  },
  {
    id: 2,
    image: "/assets/POS/rectangle-202",
    alt: "",
  },
  {
    id: 3,
    image: "/assets/POS/rectangle-203",
    alt: "",
  },
];

const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div className="flex">
      <div className="flex flex-col items-center gap-[] px-32">
        <div className="flex flex-col items-center gap-1.25">
          <Logo />
          <p className="text-black font-bold text-[20px] text-center">
            Intelligent Hotel Management System
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 ">
          {/* Grid Images */}
          {images.map((image) => (
            <Image
              key={image.id}
              src={image.image}
              alt={image.alt}
              className={`${image.id == 3 ? "col-span-2" : null} rounded-[14px]`}
            />
          ))}
        </div>
        <div className="">
          <p className="text-center text-[#0C0332] font-bold text-[42px] tracking-tight">
            Find your perfect stay and book with confidence
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
};

export default Wrapper;
