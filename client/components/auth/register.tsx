"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import Wrapper from "./wrapper";
import Input from "../input";
import Button from "../button";
import AuthFooter from "./auth-footer";

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast.success("Registration successful");
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
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
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0C0332] md:text-4xl">
              Welcome to Hotel
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6B6B6B]">
              Please sign up to continue.
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1900FF]/20" />
          </header>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
            noValidate
          >
            <Input
              type="drop"
              name="role"
              label="Role"
              placeholder="Select your Role"
              options={[
                { value: "1", label: "Manager" },
                { value: "2", label: "Receptionist" },
                { value: "3", label: "Accountant" },
                { value: "4", label: "Owner" },
              ]}
              required
            />
            <div className="grid grid-cols-2 gap-5">
              <Input
                name="firstName"
                type="text"
                label="First Name"
                placeholder="Enter your First Name"
                required
              />
              <Input
                name="middleName"
                type="text"
                label="Middle Name"
                placeholder="Enter your Middle Name"
              />
            </div>
            <Input
              name="lastName"
              type="text"
              label="Last Name"
              placeholder="Enter your Last Name"
              required
            />
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="Enter Email"
              required
            />
            <Input
              name="password"
              type="pass"
              label="Password"
              placeholder="Enter password"
              required
            />
            <Input
              name="confirmPassword"
              type="pass"
              label="Confirm password"
              placeholder="Confirm password"
              required
            />

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                text="Sign Up"
                isLoading={isLoading}
              />
            </div>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-[#9D9D9D]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#1900FF] font-bold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default Register;
