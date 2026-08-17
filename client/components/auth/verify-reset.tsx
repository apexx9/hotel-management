"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import Wrapper from "./wrapper";
import Button from "../button";
import AuthFooter from "./auth-footer";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const VerifyReset = () => {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = otp.join("");
  const isComplete = otpValue.length === OTP_LENGTH;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const nextOtp = new Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, idx) => (nextOtp[idx] = digit));
    setOtp(nextOtp);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    if (!isComplete) {
      toast.error("Enter the complete verification code.");
      return;
    }
    setIsLoading(true);
    try {
      const token = otp.join("");
      const res = await (
        await import("@/actions/auth")
      ).authApi.validateToken(token);
      if (res.data?.ok && res.data?.type === "password_reset") {
        toast.success("Code verified");
        router.push(`/reset-password?token=${token}`);
      } else {
        toast.error(
          res.data?.message ||
            "The verification code is invalid or has expired.",
        );
      }
    } catch {
      toast.error("The verification code is invalid or has expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOtp(new Array(OTP_LENGTH).fill(""));
      setResendTimer(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
      toast.success("A new verification code has been sent.");
    } catch {
      toast.error("Unable to resend the code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex h-full flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
          {/* Mobile brand */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <p className="text-4xl font-bold tracking-tight text-[#1900FF]">
              Hotel
            </p>
            <p className="mt-1 text-xs font-semibold text-[#6B6B6B]">
              Hotel Management System
            </p>
          </div>

          <header className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1900FF]/10">
              <ShieldCheck size={25} className="text-[#1900FF]" />
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0C0332] md:text-4xl">
              Verify your reset code
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6B6B6B]">
              Enter the 6-digit verification code we sent to your email or phone
              number so you can reset your password.
            </p>
          </header>

          <div className="mb-7 rounded-xl border border-[#E8E8E8] bg-white px-4 py-3">
            <p className="text-xs font-medium text-[#969696]">
              Verification code sent to
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0C0332]">
              ******@hotel.com
            </p>
          </div>

          <div>
            <label className="text-sm font-bold text-[#0C0332]">
              Verification code
            </label>
            <div className="mt-2 flex gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  // Fixed ref callback
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  aria-label={`Verification digit ${index + 1}`}
                  className="h-14 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white text-center text-xl font-bold text-[#0C0332] outline-none transition-colors focus:border-[#1900FF] focus:ring-1 focus:ring-[#1900FF]"
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs font-medium text-[#969696]">
              Didn&apos;t receive the code?
            </p>
            <button
              type="button"
              disabled={resendTimer > 0 || isResending}
              onClick={handleResend}
              className="text-xs font-bold text-[#1900FF] transition-colors disabled:cursor-not-allowed disabled:text-[#B8B8B8]"
            >
              {isResending
                ? "Sending..."
                : resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : "Resend code"}
            </button>
          </div>

          <div className="mt-8">
            <Button
              type="button"
              variant="primary"
              text="Verify code"
              isLoading={isLoading}
              disabled={!isComplete}
              onClick={handleVerify}
            />
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/forgot-password"
              className="group flex items-center gap-2 text-sm font-semibold text-[#6B6B6B] transition-colors hover:text-[#0C0332]"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              Back
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default VerifyReset;
