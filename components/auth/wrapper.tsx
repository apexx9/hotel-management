import React from "react";
import Image from "next/image";
import Logo from "../logo";

interface WrapperProps {
  children: React.ReactNode;
}

const images = [
  {
    id: 1,
    src: "/assets/POS/rectangle-201.jpg",
    alt: "Hotel image 1",
    aspectRatio: "1 / 1",
  },
  {
    id: 2,
    src: "/assets/POS/rectangle-202.jpg",
    alt: "Hotel image 2",
    aspectRatio: "1 / 1",
  },
  {
    id: 3,
    src: "/assets/POS/rectangle-203.jpg",
    alt: "Hotel image 3",
    aspectRatio: "612 / 219",
  },
];

const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div className="bg-[#F7FCFF] flex flex-col lg:flex-row h-dvh w-full overflow-hidden">
      {/* Left panel – images & tagline */}
      <div className="flex flex-col items-center gap-4 lg:gap-10 px-4 md:px-16 lg:px-20 py-6 lg:py-10 w-full lg:w-1/2 h-full overflow-y-auto">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <Logo />
          <p className="text-black font-bold text-lg md:text-2xl text-center">
            Intelligent Hotel Management System
          </p>
        </div>

        {/* Image grid – shrinkable */}
        <div className="grid grid-cols-2 gap-2 md:gap-2.5 w-full max-w-xl mx-auto shrink-0">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative w-full ${img.id === 3 ? "col-span-2" : ""}`}
              style={{ aspectRatio: img.aspectRatio }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="rounded-[14px] object-cover"
              />
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className=" flex justify-center shrink-0">
          <p className="text-center w-[80%] text-[#0C0332] font-bold text-xl md:text-2xl lg:text-3xl xl:text-[42px] tracking-tight leading-tight">
            Find your perfect stay and book with confidence
          </p>
        </div>
      </div>

      {/* Right panel – form (children) */}
      <div className="flex flex-col w-full lg:w-1/2 h-full overflow-y-auto bg-[#F6F6F6] border-l border-[#D9DEFF] shadow-[0px_0px_29px_0px_#00000014]">
        {children}
      </div>
    </div>
  );
};

export default Wrapper;
