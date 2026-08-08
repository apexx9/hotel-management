"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import Wrapper from "./wrapper";
import Input from "../input";
import Button from "../button";
import AuthFooter from "./auth-footer";

const loginSchema = z
  .object({
    loginMode: z.enum(["email", "phone"], {
      message: "Select a login method",
    }),
    email: z.string(),
    phone: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.loginMode === "email") {
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
    if (data.loginMode === "phone") {
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

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginMode: "email",
      email: "",
      phone: "",
      password: "",
    },
  });

  const loginMode = watch("loginMode");

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log("Login data:", data);
      toast.success("Login successful");
    } catch {
      toast.error("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex h-full flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center">
          {/* Mobile brand */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <p className="text-4xl font-bold tracking-tight text-[#1900FF]">
              Hotel
            </p>
            <p className="mt-1 text-xs font-semibold text-[#6B6B6B]">
              Hotel Management System
            </p>
          </div>

          {/* Header with accent */}
          <header className="mb-10">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0C0332] md:text-4xl">
              Welcome back
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6B6B6B]">
              Sign in to continue to your hotel workspace.
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
              label="Login method"
              placeholder="Select login method"
              options={[
                { value: "email", label: "Email" },
                { value: "phone", label: "Phone number" },
              ]}
              value={loginMode}
              onValueChange={(value) => {
                setValue("loginMode", value as "email" | "phone", {
                  shouldValidate: true,
                });
              }}
              error={errors.loginMode?.message}
            />

            {loginMode === "email" ? (
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

            <Input
              type="pass"
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register("password")}
              error={errors.password?.message}
            />

            <div className="-mt-1 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#6B6B6B] transition-colors hover:text-[#1900FF]"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                text="Sign in"
                isLoading={isLoading}
              />
            </div>
          </form>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default Login;
