import React from "react";
import Wrapper from "@/components/auth/wrapper";
import Input from "../input";
import Button from "../button";
import AuthFooter from "./auth-footer";

const Login = () => {
  return (
    <Wrapper>
      {/* Full‑height flex column inside the right panel */}
      <div className="flex flex-col h-full px-20 md:px-25 lg:px-38.75 py-8 md:py-10 lg:py-12 bg-[#F6F6F6]">
        {/* Scrollable form area (everything above the footer) */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2 shrink-0">
            <p className="w-[80%] font-bold text-2xl md:text-3xl lg:text-[41px] text-[#1900FF] tracking-tight leading-tight">
              Welcome back to Hotel, Please Sign‑in to continue
            </p>
            <p className="font-medium text-xs md:text-sm text-[#969696] tracking-tight">
              Select your role and credentials to access the dashboard
            </p>
          </div>

          {/* Form inputs */}
          <div className="flex flex-col gap-5 shrink-0">
            <Input
              type="drop"
              label="Login Mode"
              placeholder="Login Process"
              options={[
                { value: "1", label: "Email" },
                { value: "2", label: "Phone Number" },
              ]}
            />
            <Input
              type="drop"
              label="Role"
              placeholder="Select your Role"
              options={[
                { value: "1", label: "" },
                { value: "2", label: "" },
              ]}
            />
            <Input type="email" label="Email" placeholder="Enter Email" />
            <Input type="pass" label="Password" placeholder="Enter password" />
          </div>

          {/* Buttons & demo access */}
          <div className="flex flex-col items-center gap-5 shrink-0">
            <Button type="primary" text="Sign In" className="w-full" />
            <button className="font-medium text-[10px] text-[#9D9D9D] text-center hover:underline -mt-1.5">
              Forgotten Password?
            </button>
            <div className="flex items-center gap-1.25 w-full">
              <div className="grow border-t border-[#ADADAD]" />
              <p className="font-bold text-sm text-[#ADADAD] tracking-tight whitespace-nowrap">
                Quick Demo Access
              </p>
              <div className="grow border-t border-[#ADADAD]" />
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button type="secondary" text="Manager" className="w-full" />
              <Button type="secondary" text="Receptionist" className="w-full" />
              <Button type="secondary" text="Accountant" className="w-full" />
              <Button type="secondary" text="Owner" className="w-full" />
            </div>
          </div>
        </div>

        {/* Footer – always visible at bottom */}
        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default Login;
