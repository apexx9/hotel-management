import React from "react";
import Link from "next/link";
import { date, version } from "@/utils/utils";

const AuthFooter = () => {
  return (
    <div className="shrink-0 flex flex-col gap-2.5 items-center pt-4 mt-auto">
      <nav className="flex gap-5">
        <Link
          href={"/policies"}
          className="font-medium text-[11px] text-[#B4B5B6] hover:underline"
        >
          Policies
        </Link>
        <Link
          href={"/support"}
          className="font-medium text-[11px] text-[#B4B5B6] hover:underline"
        >
          Support
        </Link>
        <Link
          href={"/help"}
          className="font-medium text-[11px] text-[#B4B5B6] hover:underline"
        >
          Help Center
        </Link>
      </nav>
      <p className="font-medium text-[11px] text-[#B4B5B6]">
        Copyright © 2024-{date} AltBit Softwares. All rights reserved.
      </p>
      <p className="font-medium text-[11px] text-[#B4B5B6]">
        Hotel Management System {version}
      </p>
    </div>
  );
};

export default AuthFooter;
