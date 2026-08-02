import React from "react";
import Link from "next/link";
import Wrapper from "@/components/auth/wrapper";
import Input from "../input";
import Button from "../button";

const Login = () => {
  return (
    <Wrapper>
      <section className="w-full px-38.75">
        <div className="flex flex-col items-center">
          <p className="font-bold text-[41px] text-[#1900FF] tracking-tight text-left">
            Welcome back to Hotel, Please Sign-in to continue
          </p>
          <p className="font-medium text-[14px] text-[#969696] text-left tracking-tight">
            Select your role and credentials to access the dashboard
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5">
            {/* Input Boxes */}
            <Input
              type="drop"
              label="Login Mode"
              placeholder="Choose your preferred Login Process"
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
          <div className="flex flex-col items-center gap-5">
            <Button type="primary" text="Sign In" />
            <button className="font-medium text-[10px] text-[#9D9D9D] text-center hover:underline -mt-1.5">
              Forgotten Password?
            </button>
            <div className="flex items-center gap-1.25">
              <div className="grow border-t border-[#ADADAD]" />
              <p className="font-bold text-[14px] text-[#ADADAD] tracking-tight whitespace-nowrap">
                Quick Demo Access
              </p>
              <div className="grow border-t border-[#ADADAD]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="secondary" text="Manager" />
              <Button type="secondary" text="Receptionist" />
              <Button type="secondary" text="Accountant" />
              <Button type="secondary" text="Owner" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 items-center">
          <nav className="flex gap-5">
            <Link
              href={"/policies"}
              title="Policies"
              className="font-medium text-[11px] text-[#B4B5B6]"
            />
            <Link
              href={"/support"}
              title="Supports"
              className="font-medium text-[11px] text-[#B4B5B6]"
            />
            <Link
              href={"/help"}
              title="Help Center"
              className="font-medium text-[11px] text-[#B4B5B6]"
            />
          </nav>
          <p className="font-medium text-[11px] text-[#B4B5B6]">
            Copyright © 2024-2025 AltBit Softwares. All rights reserved.
          </p>
          <p className="font-medium text-[11px] text-[#B4B5B6]">
            Hotel Management System 1.0
          </p>
        </div>
      </section>
    </Wrapper>
  );
};

export default Login;
