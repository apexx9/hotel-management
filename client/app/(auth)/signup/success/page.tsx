import Link from "next/link";
import { Check } from "lucide-react";

import Wrapper from "@/components/auth/wrapper";
import Button from "@/components/button";
import AuthFooter from "@/components/auth/auth-footer";

export default function SignupSuccessPage() {
  return (
    <Wrapper>
      <div className="flex h-full flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center">
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <p className="text-4xl font-bold tracking-tight text-[#1900FF]">
              Hotel
            </p>
            <p className="mt-1 text-xs font-semibold text-[#6B6B6B]">
              Hotel Management System
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1900FF]/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1900FF]">
              <Check size={22} strokeWidth={3} className="text-white" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0C0332]">
              Account created successfully
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B6B6B]">
              Your hotel account has been created. Please verify your email to
              activate your account.
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1900FF]/20 mx-auto" />
          </div>

          <div className="mt-8 w-full max-w-sm">
            <Link href="/login" className="block">
              <Button type="button" variant="primary" text="Go to login" />
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
}
