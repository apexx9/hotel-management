"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import Wrapper from "./wrapper";
import Button from "../button";
import AuthFooter from "./auth-footer";

type InvitationState = "loading" | "valid" | "expired" | "invalid";

const Invitation = () => {
  const params = useParams();
  const router = useRouter();

  const token = params?.token as string;

  const [state, setState] = useState<InvitationState>("loading");

  const [invitation, setInvitation] = useState<{
    hotelName: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const validateInvitation = async () => {
      try {
        const res = await (
          await import("@/actions/auth")
        ).authApi.getInvitation(token);
        if (!isMounted) return;
        setInvitation({
          hotelName:
            res.data.invitation?.hotelName ||
            res.data.invitation?.hotelName ||
            "Hotel",
          email: res.data.invitation?.email,
          role: res.data.invitation?.role,
        });
        setState("valid");
      } catch {
        if (isMounted) {
          setState("invalid");
        }
      }
    };

    validateInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!token) {
    return (
      <InvitationError
        icon={<XCircle size={32} />}
        title="Invalid invitation"
        message="This invitation link is invalid or no longer available."
      />
    );
  }

  if (state === "loading") {
    return (
      <Wrapper>
        <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
          <div className="mx-auto flex w-full max-w-[520px] flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#1900FF]" />

              <p className="mt-5 text-sm font-medium text-[#6B6B6B]">
                Checking your invitation...
              </p>
            </div>
          </div>

          <AuthFooter />
        </div>
      </Wrapper>
    );
  }

  if (state === "expired") {
    return (
      <InvitationError
        icon={<Clock3 size={32} />}
        title="Invitation expired"
        message="This invitation is no longer active. Please contact your hotel administrator for a new invitation."
      />
    );
  }

  if (state === "invalid") {
    return (
      <InvitationError
        icon={<XCircle size={32} />}
        title="Invalid invitation"
        message="This invitation link is invalid or no longer available."
      />
    );
  }

  return (
    <Wrapper>
      <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center">
          <div className="flex flex-col items-center">
            <CheckCircle2
              size={44}
              strokeWidth={1.8}
              className="text-[#1900FF]"
            />

            <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-[#0C0332]">
              You&apos;ve been invited
            </h1>

            <p className="mt-3 max-w-md text-center text-sm leading-6 text-[#6B6B6B]">
              You have been invited to join the hotel management workspace.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-[#E8E8E8] bg-white p-5">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-medium text-[#969696]">Hotel</p>

                <p className="mt-1 text-sm font-bold text-[#0C0332]">
                  {invitation?.hotelName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[#969696]">Account</p>

                <p className="mt-1 text-sm font-bold text-[#0C0332]">
                  {invitation?.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-[#969696]">
                  Assigned role
                </p>

                <p className="mt-1 text-sm font-bold text-[#0C0332]">
                  {invitation?.role}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <Button
              type="button"
              variant="primary"
              text="Continue account setup"
              onClick={() => router.push(`/invite/${token}/setup`)}
            />
          </div>

          <p className="mt-5 text-center text-xs font-medium leading-5 text-[#969696]">
            Your role and hotel access have already been assigned by your
            administrator.
          </p>

          <div className="mt-7 flex justify-center">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#6B6B6B] hover:text-[#0C0332]"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
};

const InvitationError = ({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) => {
  return (
    <Wrapper>
      <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10 md:px-14 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center justify-center">
          <div className="text-[#1900FF]">{icon}</div>

          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-[#0C0332]">
            {title}
          </h1>

          <p className="mt-3 max-w-sm text-center text-sm leading-6 text-[#6B6B6B]">
            {message}
          </p>

          <div className="mt-8 w-full">
            <Link href="/login" className="block">
              <Button type="button" variant="primary" text="Go to login" />
            </Link>
          </div>
        </div>

        <AuthFooter />
      </div>
    </Wrapper>
  );
};

export default Invitation;
