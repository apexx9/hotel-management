import React from "react";
import Link from "next/link";
import { date, version } from "@/utils/utils";

const AuthFooter = () => {
  return (
    <footer className="shrink-0 px-4 pb-6 pt-10">
      <nav
        aria-label="Support links"
        className="flex flex-wrap justify-center gap-x-6 gap-y-2"
      >
        <Link
          href="/policies"
          className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
        >
          Policies
        </Link>
        <Link
          href="/support"
          className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
        >
          Support
        </Link>
        <Link
          href="/help"
          className="text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
        >
          Help Center
        </Link>
      </nav>

      <div className="mt-3 space-y-1 text-center">
        <p className="text-[10px] font-medium text-neutral-400">
          © 2024–{date} AltBit Softwares. All rights reserved.
        </p>
        <p className="text-[10px] font-medium text-neutral-400">
          Hotel Management System · v{version}
        </p>
      </div>
    </footer>
  );
};

export default AuthFooter;
