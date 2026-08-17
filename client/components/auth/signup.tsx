"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Circle } from "lucide-react";
import { toast } from "sonner";

import Wrapper from "./wrapper";
import Input from "../input";
import Button from "../button";
import AuthFooter from "./auth-footer";

import AuthService from "../../services/auth.service";
import {
  registerSchema,
  RegisterFormValues,
  RegisterSchema,
} from "../../schema/auth.schema";

const Signup = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),

    defaultValues: {
      hotel: {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
      owner: {
        fullName: "",
        email: "",
        phone: "",
        password: "",
      },
      confirmPassword: "",
    },
  });

  const password = watch("owner.password") || "";

  const requirements = [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
    {
      label: "Contains an uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "Contains a lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "Contains a number",
      valid: /\d/.test(password),
    },
    {
      label: "Contains a special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      const payload: RegisterSchema = {
        hotel: data.hotel,
        owner: data.owner,
      };

      await AuthService().register(payload);

      toast.success("Hotel account created. Please verify your account.");
      router.push("/verify-account");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          "Unable to create your hotel account. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col">
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
              Create your hotel account
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#6B6B6B]">
              Set up your hotel and administrator account to get started.
            </p>

            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1900FF]/20" />
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            {/* ─────────────────────────────
                HOTEL INFORMATION
            ───────────────────────────── */}

            <div className="pt-1">
              <h2 className="text-sm font-bold text-[#0C0332]">
                Hotel information
              </h2>

              <p className="mt-1 text-xs font-medium text-[#969696]">
                Tell us a little about your hotel.
              </p>
            </div>

            <Input
              type="text"
              label="Hotel name"
              placeholder="Enter your hotel name"
              autoComplete="organization"
              {...register("hotel.name")}
              error={errors.hotel?.name?.message}
            />

            <Input
              type="email"
              label="Hotel email"
              placeholder="Enter your hotel email"
              autoComplete="email"
              {...register("hotel.email")}
              error={errors.hotel?.email?.message}
            />

            <Input
              type="tel"
              label="Hotel phone number"
              placeholder="Enter your hotel phone number"
              autoComplete="tel"
              {...register("hotel.phone")}
              error={errors.hotel?.phone?.message}
            />

            <Input
              type="text"
              label="Hotel address"
              placeholder="Enter your hotel address"
              autoComplete="street-address"
              {...register("hotel.address")}
              error={errors.hotel?.address?.message}
            />

            {/* ─────────────────────────────
                OWNER INFORMATION
            ───────────────────────────── */}

            <div className="mt-3 pt-1">
              <h2 className="text-sm font-bold text-[#0C0332]">
                Administrator information
              </h2>

              <p className="mt-1 text-xs font-medium text-[#969696]">
                This account will have owner access to your hotel.
              </p>
            </div>

            <Input
              type="text"
              label="Full name"
              placeholder="Enter your full name"
              autoComplete="name"
              {...register("owner.fullName")}
              error={errors.owner?.fullName?.message}
            />

            <Input
              type="email"
              label="Email address"
              placeholder="Enter your email"
              autoComplete="email"
              {...register("owner.email")}
              error={errors.owner?.email?.message}
            />

            <Input
              type="tel"
              label="Phone number"
              placeholder="Enter your phone number"
              autoComplete="tel"
              {...register("owner.phone")}
              error={errors.owner?.phone?.message}
            />

            <Input
              type="pass"
              label="Password"
              placeholder="Create a password"
              autoComplete="new-password"
              {...register("owner.password")}
              error={errors.owner?.password?.message}
            />

            {/* Password requirements */}
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

            {/* Submit */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                text="Create hotel account"
                isLoading={isLoading}
              />
            </div>
          </form>

          {/* Existing account */}
          <div className="mt-6 text-center">
            <p className="text-xs font-medium text-[#969696]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-[#1900FF] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Back */}
          <div className="mt-6 flex justify-center">
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

export default Signup;
