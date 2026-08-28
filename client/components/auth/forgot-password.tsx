"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import Wrapper from "./wrapper";
import Input from "../input";
import Button from "../button";
import AuthFooter from "./auth-footer";

const forgotPasswordSchema = z
  .object({
    resetMode: z.enum(["email", "phone"], { message: "Select a reset method" }),
    email: z.string(),
    phone: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.resetMode === "email") {
      const result = z
        .string()
        .email("Enter a valid email address")
        .safeParse(data.email);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Enter a valid email address",
        });
      }
    }
    if (data.resetMode === "phone") {
      const phone = data.phone.trim();
      if (!phone) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Phone number is required",
        });
      } else if (phone.length < 9) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Enter a valid phone number",
        });
      }
    }
  });

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { resetMode: "email", email: "", phone: "" },
  });

  const resetMode = watch("resetMode");

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const identifier = data.resetMode === "email" ? data.email : data.phone;
      const res = await (
        await import("@/actions/auth")
      ).authApi.requestReset(identifier);
      toast.success("Verification code sent");
      router.push("/forgot-password/verify");
    } catch {
      toast.error("Unable to process your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex min-h-full flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
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
              Forgot your password?
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6B6B6B]">
              No worries. Enter the email address or phone number associated
              with your staff account and we&apos;ll send you a verification
              code.
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1900FF]/20" />
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <Input
              type="drop"
              label="Reset method"
              placeholder="Select reset method"
              options={[
                { value: "email", label: "Email" },
                { value: "phone", label: "Phone number" },
              ]}
              value={resetMode}
              onValueChange={(value) => {
                setValue("resetMode", value as "email" | "phone", {
                  shouldValidate: true,
                });
              }}
              error={errors.resetMode?.message}
            />

            {resetMode === "email" ? (
              <Input
                type="email"
                label="Email address"
                placeholder="Enter your email"
                autoComplete="email"
                {...register("email")}
                error={errors.email?.message}
              />
            ) : (
              <Input
                type="tel"
                label="Phone number"
                placeholder="Enter your phone number"
                autoComplete="tel"
                {...register("phone")}
                error={errors.phone?.message}
              />
            )}

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                text="Continue"
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

export default ForgotPassword;
