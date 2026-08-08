"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Circle } from "lucide-react";
import { toast } from "sonner";

import Wrapper from "./wrapper";
import Input from "../input";
import Button from "../button";
import AuthFooter from "./auth-footer";

const setupAccountSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().trim().min(9, "Enter a valid phone number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/\d/, "Password must contain a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

type SetupAccountFormValues = z.infer<typeof setupAccountSchema>;

const SetupAccount = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupAccountFormValues>({
    resolver: zodResolver(setupAccountSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const requirements = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains an uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Contains a lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Contains a number", valid: /\d/.test(password) },
  ];

  const onSubmit = async (data: SetupAccountFormValues) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log("Account setup:", data);
      toast.success("Account created successfully");
      router.push("/login");
    } catch {
      toast.error("Unable to create your account. Please try again.");
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

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0C0332] md:text-4xl">
              Set up your account
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6B6B6B]">
              Complete your account setup to access your hotel workspace.
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1900FF]/20" />
          </header>

          {/* Invitation information */}
          <div className="mb-7 rounded-xl border border-[#E8E8E8] bg-white px-4 py-3">
            <p className="text-xs font-medium text-[#969696]">
              You&apos;ve been invited to join
            </p>
            <p className="mt-1 text-sm font-bold text-[#0C0332]">
              Hotel Management System
            </p>
            <p className="mt-1 text-xs font-medium text-[#969696]">
              Your access permissions have already been assigned by your
              administrator.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <Input
              type="text"
              label="Full name"
              placeholder="Enter your full name"
              autoComplete="name"
              {...register("fullName")}
              error={errors.fullName?.message}
            />
            <Input
              type="email"
              label="Email address"
              placeholder="Enter your email"
              autoComplete="email"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input
              type="tel"
              label="Phone number"
              placeholder="Enter your phone number"
              autoComplete="tel"
              {...register("phone")}
              error={errors.phone?.message}
            />
            <Input
              type="pass"
              label="Password"
              placeholder="Create a password"
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
            />

            {/* Requirements with Check / Circle icons */}
            <div className="-mt-2 rounded-xl border border-[#E8E8E8] bg-white p-4">
              <p className="mb-3 text-xs font-bold text-[#0C0332]">
                Password requirements
              </p>
              <div className="grid gap-2">
                {requirements.map((requirement) => (
                  <div
                    key={requirement.label}
                    className="flex items-center gap-2"
                  >
                    {requirement.valid ? (
                      <Check
                        size={14}
                        strokeWidth={2.5}
                        className="text-[#1900FF]"
                      />
                    ) : (
                      <Circle
                        size={10}
                        strokeWidth={2}
                        className="ml-0.5 mr-0.5 text-[#B8B8B8]"
                      />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        requirement.valid ? "text-[#0C0332]" : "text-[#969696]"
                      }`}
                    >
                      {requirement.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Input
              type="pass"
              label="Confirm password"
              placeholder="Enter your password again"
              autoComplete="new-password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                text="Create account"
                isLoading={isLoading}
              />
            </div>
          </form>

          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="group flex items-center gap-2 text-sm font-semibold text-[#6B6B6B] transition-colors hover:text-[#0C0332]"
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

export default SetupAccount;
