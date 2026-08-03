import React from "react";
import Wrapper from "./wrapper";
import Input from "../input";
import Button from "../button";
import AuthFooter from "./auth-footer";

const Register = () => {
  return (
    <Wrapper>
      <div className="flex flex-col h-full px-20 md:px-25 lg:px-38.75 py-6 md:py-8 lg:py-12 bg-[#F6F6F6]">
        <div className="flex-1 overflow-y-hidden min-h-0 flex flex-col gap-4">
          <div className="flex flex-col gap-2 shrink-0">
            <p className="w-full lg:w-[80%] font-bold text-xl md:text-2xl lg:text-[35px] text-[#1900FF] tracking-tight leading-tight">
              Welcome to Hotel, Please Sign‑Up to continue
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5 mt-4 lg:mt-10">
            <Input
              type="drop"
              label="Role"
              placeholder="Select your Role"
              options={[
                { value: "1", label: "Manager" },
                { value: "2", label: "Receptionist" },
                { value: "3", label: "Accountant" },
                { value: "4", label: "Owner" },
              ]}
              wrapperClassName="col-span-2"
              required
            />
            <Input
              type="text"
              label="First Name"
              placeholder="Enter your First Name"
              wrapperClassName="col-span-1"
              required
            />
            <Input
              type="text"
              label="Middle Name"
              placeholder="Enter your Middle Name"
              wrapperClassName="col-span-1"
            />
            <Input
              type="text"
              label="Last Name"
              placeholder="Enter your Last Name"
              wrapperClassName="col-span-2"
              required
            />
            <Input
              type="email"
              label="Email"
              placeholder="Enter Email"
              wrapperClassName="col-span-2"
              required
            />
            <Input
              type="pass"
              label="Password"
              placeholder="Enter password"
              wrapperClassName="col-span-2"
              required
            />
            <Input
              type="pass"
              label="Confirm password"
              placeholder="Confirm password"
              wrapperClassName="col-span-2"
              required
            />
          </div>

          <div className="flex flex-col items-center gap-5 shrink-0 pb-4 lg:pb-10">
            <Button type="primary" text="Sign Up" className="w-full" />
            <button className="font-medium text-[10px] text-[#9D9D9D] text-center -mt-1.5">
              Already has an account,{" "}
              <a className="text-[#1E1C1C] hover:underline" href="/login">
                sign in
              </a>
            </button>
          </div>
        </div>
        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default Register;
