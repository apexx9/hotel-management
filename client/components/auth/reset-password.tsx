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

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
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

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const requirements = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains an uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Contains a lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Contains a number", valid: /\d/.test(password) },
  ];

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log("Password reset:", data);
      toast.success("Password updated successfully");
      router.push("/reset-password/success");
    } catch {
      toast.error("Unable to reset your password. Please try again.");
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
              Create a new password
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6B6B6B]">
              Choose a strong password for your hotel management account.
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1900FF]/20" />
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <Input
              type="pass"
              label="New password"
              placeholder="Enter your new password"
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
            />

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
                text="Reset password"
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

export default ResetPassword;
