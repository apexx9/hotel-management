"use client";
import React, { useState } from "react";
import AuthFooter from "./auth-footer";
import Input from "../input";
import Button from "../button";
import { ArrowLeft } from "lucide-react";
import ResetConfirmation from "./reset-confirmation";
import { useModalStore, useResetMode } from "@/store/store";

const PasswordReset = () => {
  const resetMode = useResetMode((state) => state.mode);
  const setMode = useResetMode((state) => state.setMode);

  const isOpen = useModalStore((state) => state.isOpen);
  const toggleOpen = useModalStore((state) => state.toggleOpen);

  return (
    <div className="flex flex-col items-center justify-center h-screen px-20 md:px-25 lg:px-38.75 py-6 md:py-8 lg:py-12 bg-[#F6F6F6]">
      {/* Header */}
      <div className="flex flex-col items-center gap-2.5 mb-8">
        <p className="w-full text-center font-bold text-xl md:text-2xl lg:text-[35px] text-[#1900FF] tracking-tight leading-tight">
          Forgot Password?
        </p>
        <p className="font-medium text-xs text-center md:text-sm text-[#969696] tracking-tight">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#F6F6F6] border border-[#D3D5FF] shadow-[0px_0px_29px_0px_#00000014] rounded-[22px] w-full md:max-w-150 lg:max-w-200 min-w-100 flex flex-col pt-14.5 pb-22.5 px-10 md:px-20 lg:px-30.25">
        {/* Card Content */}
        <div className="flex flex-col gap-4.5">
          <p className="font-bold text-black text-[20px] text-left">
            Reset password
          </p>
          <p className="font-medium text-[14px] text-[#969696]">
            Enter your email you used in creating your account
          </p>
        </div>

        {/* Input Section */}
        <div className="flex flex-col mt-8 gap-7.5">
          <Input
            type="drop"
            label="Select Reset Method"
            placeholder="Select email or phone number"
            options={[
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone Number" },
            ]}
            value={resetMode}
            onChange={(val) => setMode(val as "email" | "phone")}
          />
          <Input
            type={resetMode === "email" ? "email" : "tel"}
            label={resetMode === "email" ? "Email" : "Phone Number"}
            placeholder={
              resetMode === "email"
                ? "Enter your Email"
                : "Enter your Phone Number"
            }
          />
          <div className="mt-8 flex flex-col items-center gap-6 relative">
            <Button
              type="primary"
              text="Reset Password"
              className="w-full"
              onClick={toggleOpen}
            />
            {isOpen == true ? <ResetConfirmation /> : null}
            <button className="flex items-center font-medium text-[12px] text-[#4C4747] text-center mt-4">
              <ArrowLeft /> Back to Login
            </button>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
};

export default PasswordReset;
