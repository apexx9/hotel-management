"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MailOpen, Send } from "lucide-react";
import { toast } from "sonner";

import Wrapper from "./wrapper";
import Button from "../button";
import Input from "../input";
import AuthFooter from "./auth-footer";

const VerifyAccount = () => {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [noEmail, setNoEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const fromQuery =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("email")
        : null;
    const stored =
      typeof window !== "undefined"
        ? sessionStorage.getItem("pendingEmail")
        : null;
    const initial = fromQuery || stored || "";

    if (initial) {
      setEmail(initial);
      setCodeSent(true);
    } else {
      setNoEmail(true);
    }
  }, []);

  const sendCode = async (address: string) => {
    if (isSendingCode) return;
    setIsSendingCode(true);
    try {
      const res = await (
        await import("@/actions/auth")
      ).authApi.requestVerify(address);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pendingEmail", address);
      }
      setEmail(address);
      setCodeSent(true);
      setNoEmail(false);
      toast.success(
        res.data?.message || "A new verification code has been sent.",
      );
    } catch (err) {
      console.error(err);
      toast.error("Unable to send the verification code.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleRequestCode = () => {
    const address = emailInput.trim().toLowerCase();
    if (!address) {
      toast.error("Enter your account email.");
      return;
    }
    sendCode(address);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const next = [...otp];

    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });

    setOtp(next);

    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length !== 6) {
      toast.error("Enter the six-digit verification code.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await (await import("@/actions/auth")).authApi.verify(code);
      if (res.data?.ok) {
        toast.success("Account verified successfully.");
        router.push("/login");
      } else {
        toast.error(res.data?.message || "Unable to verify your account.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to verify your account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (!email) {
      toast.error("Enter your email to request a new code.");
      setNoEmail(true);
      return;
    }
    sendCode(email);
  };

  return (
    <Wrapper>
      <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <p className="text-4xl font-bold tracking-tight text-[#1900FF]">
              Hotel
            </p>

            <p className="mt-1 text-xs font-semibold text-[#6B6B6B]">
              Hotel Management System
            </p>
          </div>

          <div className="mb-8 flex flex-col items-center">
            <MailOpen
              size={42}
              strokeWidth={1.8}
              className="mb-5 text-[#1900FF]"
            />

            <h1 className="text-center text-3xl font-bold tracking-tight text-[#0C0332]">
              Verify your account
            </h1>

            <p className="mt-3 max-w-sm text-center text-sm leading-6 text-[#6B6B6B]">
              {noEmail ? (
                <>
                  Enter the email address on your account and we&apos;ll send
                  you a six-digit verification code.
                </>
              ) : (
                <>
                  We&apos;ve sent a six-digit verification code to{" "}
                  {email ? (
                    <span className="font-semibold text-[#0C0332]">
                      {email}
                    </span>
                  ) : (
                    "your email address"
                  )}
                  .
                </>
              )}
            </p>
          </div>

          {noEmail ? (
            <div className="space-y-5">
              <Input
                type="email"
                label="Account email"
                placeholder="Enter your email address"
                autoComplete="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleRequestCode();
                  }
                }}
              />
              <Button
                type="button"
                variant="primary"
                text="Send verification code"
                isLoading={isSendingCode}
                onClick={handleRequestCode}
              />
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2.5 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="h-14 w-11 rounded-xl border border-gray-200 bg-white text-center text-xl font-bold text-[#0C0332] outline-none transition focus:border-[#1900FF] focus:ring-1 focus:ring-[#1900FF] sm:w-12"
                  />
                ))}
              </div>

              <div className="mt-8">
                <Button
                  type="button"
                  variant="primary"
                  text="Verify account"
                  isLoading={isLoading}
                  onClick={handleVerify}
                />
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B6B6B] hover:text-[#1900FF]"
                  onClick={handleResend}
                >
                  {isSendingCode ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send size={14} />
                      Didn&apos;t receive the code? Resend
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          <div className="mt-7 flex justify-center">
            <Link
              href="/login"
              className="group flex items-center gap-2 text-sm font-semibold text-[#6B6B6B] hover:text-[#0C0332]"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              Back to Login
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default VerifyAccount;