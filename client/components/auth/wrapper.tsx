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
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50 lg:flex-row">
      {/* Brand panel – fixed, no scroll */}
      <section className="hidden h-full w-1/2 flex-col items-center justify-center bg-[#F8FAFC] px-10 py-12 lg:flex xl:px-16">
        <div className="flex w-full max-w-xl flex-col items-center">
          <Logo size="md" />

          <p className="mt-3 text-center text-lg font-semibold tracking-tight text-slate-800">
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

          <p className="mt-8 max-w-md text-center text-2xl font-bold leading-snug tracking-tight text-slate-800 xl:text-3xl">
            Run your hotel with clarity.
          </p>

          <p className="mt-3 max-w-sm text-center text-sm leading-6 text-slate-500">
            Manage guests, rooms, payments and daily operations from one place.
          </p>
        </div>
      </section>

      {/* Auth panel – scrollable */}
      <section className="flex h-full flex-1 flex-col overflow-y-auto bg-white lg:w-1/2 lg:border-l lg:border-slate-200">
        {children}
      </section>
    </div>
  );
};

export default Wrapper;
