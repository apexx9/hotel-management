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
    alt: "Hotel interior",
    aspectRatio: "1 / 1",
  },
  {
    id: 2,
    src: "/assets/POS/rectangle-202.jpg",
    alt: "Hotel room",
    aspectRatio: "1 / 1",
  },
  {
    id: 3,
    src: "/assets/POS/rectangle-203.jpg",
    alt: "Hotel property",
    aspectRatio: "612 / 219",
  },
];

const Wrapper = ({ children }: WrapperProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FBFBFC] lg:flex-row">
      {/* Brand panel – fixed, no scroll, now on left */}
      <section className="hidden h-full w-1/2 flex-col items-center justify-center bg-[#FBFBFC] px-10 py-12 lg:flex xl:px-16">
        <div className="flex w-full max-w-xl flex-col items-center">
          <Logo size="md" />

          <p className="mt-3 text-center text-lg font-semibold tracking-tight text-[#0C0332]">
            Intelligent Hotel Management System
          </p>

          {/* Image grid – constrained size */}
          <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative w-full overflow-hidden rounded-2xl ${
                  image.id === 3 ? "col-span-2" : ""
                }`}
                style={{ aspectRatio: image.aspectRatio }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1280px) 40vw, 400px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-md text-center text-2xl font-bold leading-snug tracking-tight text-[#0C0332] xl:text-3xl">
            Run your hotel with clarity.
          </p>

          <p className="mt-3 max-w-sm text-center text-sm leading-6 text-[#8A8787]">
            Manage guests, rooms, payments and daily operations from one place.
          </p>
        </div>
      </section>

      {/* Auth panel – scrollable, now on right */}
      <section className="flex h-full flex-1 flex-col overflow-y-auto bg-white lg:w-1/2 lg:border-l lg:border-[#E8E8E8]">
        {children}
      </section>
    </div>
  );
};

export default Wrapper;
