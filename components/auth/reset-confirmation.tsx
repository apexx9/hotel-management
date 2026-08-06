import React, { useState } from "react";
import Button from "../button";
import { ArrowLeft, MailOpen, X } from "lucide-react";
import useClickOutside from "@/hooks/useClickOutside";
import { useModalStore, useResetMode } from "@/store/store";

const ResetConfirmation = ({}) => {
  //Modal Toggle State
  const isOpen = useModalStore((state) => state.isOpen);
  const toggleOpen = useModalStore((state) => state.toggleOpen);

  //Reset Mode State
  const resetMode = useResetMode((state) => state.mode);
  const closeRef = useClickOutside<HTMLDivElement>(toggleOpen);

  const handleClose = () => {
    toggleOpen();
  };

  // State for the 6 OTP digits
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));

  const handleOtpChange = (index: number, value: string) => {
    // Allow only single digit
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input (optional)
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };
  if (!isOpen) return null;
  // Return the appropriate view
  return resetMode === "email" ? (
    // ----- Email sent view -----
    <div className="h-full w-full fixed inset-0 bg-black/50 z-1000 flex justify-center items-center">
      <div
        ref={closeRef}
        className="relative border border-[#D3D5FF] bg-[#F6F6F6] rounded-[20px] shadow-[0px_0px_29px_0px_#00000014] w-full md:max-w-100 lg:max-w-150 min-w-100 flex flex-col pt-14.5 pb-22.5 px-10 md:px-20 lg:px-30.25 gap-6"
      >
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={15} className="text-black" />
        </button>

        <div className="flex flex-col gap-2.5 items-center mb-8">
          <MailOpen size={41} className="font-bold text-[#0017E5]" />
          <p className="font-bold text-black text-[41px]">Check your email</p>
          <p className="text-center font-bold text-[21px] text-[#0A0332]">
            We&apos;ve sent reset link and an OTP to oli********@untitledui.com
          </p>
        </div>
        <Button text="Done" type="primary" onClick={handleClose} />
        <div className="flex items-center gap-5 w-full my-6.25">
          <div className="grow border-t border-[#ADADAD]" />
          <button className="flex items-center font-medium text-[12px] text-[#4C4747] text-center gap-2.5">
            <ArrowLeft /> Back to Login
          </button>
          <div className="grow border-t border-[#ADADAD]" />
        </div>
      </div>
    </div>
  ) : (
    // ----- OTP input view -----
    <div className="h-full w-full fixed inset-0 bg-black/50 z-1000 flex justify-center items-center">
      <div
        ref={closeRef}
        className="relative border border-[#D3D5FF] bg-[#F6F6F6] rounded-[20px] shadow-[0px_0px_29px_0px_#00000014] w-full md:max-w-100 lg:max-w-150 min-w-100 flex flex-col pt-14.5 pb-22.5 px-10 md:px-20 lg:px-30.25 gap-6"
      >
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={15} className="text-black" />
        </button>

        <div className="flex flex-col gap-2.5 items-center mb-8">
          <MailOpen size={41} className="font-bold text-[#0017E5]" />
          <p className="font-bold text-black text-[41px]">
            Enter the six-digit number
          </p>
          <p className="text-center font-bold text-[21px] text-[#0A0332]">
            We&apos;ve sent reset OTP to 055******89
          </p>
        </div>

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-3 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-[#ADADAD] rounded-lg focus:border-[#0017E5] focus:outline-none"
            />
          ))}
        </div>

        <Button text="Verify" type="primary" />

        <div className="flex items-center gap-5 w-full my-6.25">
          <div className="grow border-t border-[#ADADAD]" />
          <button className="flex items-center font-medium text-[12px] text-[#4C4747] text-center gap-2.5">
            <ArrowLeft /> Back to Login
          </button>
          <div className="grow border-t border-[#ADADAD]" />
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmation;
