import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import Wrapper from "@/components/auth/wrapper";
import Button from "@/components/button";
import AuthFooter from "@/components/auth/auth-footer";

export default function AuthErrorPage() {
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

          <div className="text-[#F59E0B]">
            <AlertTriangle size={48} strokeWidth={1.8} />
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0C0332]">
              Authentication error
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B6B6B]">
              There was a problem with your authentication session. Please try
              signing in again.
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
