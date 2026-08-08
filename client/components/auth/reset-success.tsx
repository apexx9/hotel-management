"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import Wrapper from "./wrapper";
import Button from "../button";
import AuthFooter from "./auth-footer";

const ResetSuccess = () => {
  return (
    <Wrapper>
      <div className="flex h-full flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center">
          {/* Mobile brand */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <p className="text-4xl font-bold tracking-tight text-[#1900FF]">
              Hotel
            </p>
            <p className="mt-1 text-xs font-semibold text-[#6B6B6B]">
              Hotel Management System
            </p>
          </div>

          {/* Success icon – slightly refined */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1900FF]/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1900FF]">
              <Check size={22} strokeWidth={3} className="text-white" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0C0332]">
              Password reset successful
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B6B6B]">
              Your password has been updated successfully. You can now sign in
              using your new password.
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1900FF]/20 mx-auto" />
          </div>

          <div className="mt-8 w-full max-w-sm">
            <Link href="/login" className="block">
              <Button type="button" variant="primary" text="Back to Login" />
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default ResetSuccess;
