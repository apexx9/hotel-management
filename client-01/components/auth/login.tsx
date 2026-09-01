"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Wrapper from "./wrapper";
import Input from "../input";
import Button from "../button";
import AuthFooter from "./auth-footer";

import AuthService from "../../services/auth.service";
import { loginSchema, LoginSchema } from "../../schema/auth.schema";

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const response = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return response.response?.data?.message || response.message;
  }

  return undefined;
};

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });


  const onSubmit = async (payload: LoginSchema) => {
    setIsLoading(true);
    try {
      await AuthService().login(payload);
      router.push('/dashboard');
      router.refresh(); // Optional: refresh server components
      toast.success("Login successful");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) || "Unable to sign in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex min-h-full flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
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
              Sign in with your email or phone number.
            </p>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1900FF]/20" />
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <Input
              type="text"
              label="Email or phone number"
              placeholder="Enter your email or phone number"
              autoComplete="username"
              {...register("identifier")}
              error={errors.identifier?.message}
            />

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

          <div className="mt-6 rounded-2xl border border-[#E8E8E8] bg-[#F7F7FF] px-4 py-3 text-center">
            <p className="text-sm font-medium text-[#4C4747]">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-[#1900FF] transition-colors hover:text-[#1200c9]"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default Login;
