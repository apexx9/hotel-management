import React from "react";
import Button from "../button";
import { ArrowLeft, MailOpen } from "lucide-react";
import useClickOutside from "@/hooks/useClickOutside";

interface ResetConfirmationProps {
  confirmationMode?: string;
  success?: boolean;
}
const ResetConfirmation: React.FC<ResetConfirmationProps> = ({
  confirmationMode,
  success,
}) => {
  //   const closeRef = useClickOutside(); // I'll need to setup global state to manage the state instead of injecting state management as props in the components.
  //In that case if the state is changed by a single component all components using the service will be aware
  return (
    <div className="h-full w-full fixed inset-0 bg-black/50 z-1000 flex justify-center items-center">
      <div className="border broder-[#D3D5FF] bg-[#F6F6F6] rounded-[20px] border-[#D3D5FF] shadow-[0px_0px_29px_0px_#00000014] w-full md:max-w-100 lg:max-w-150 min-w-100 flex flex-col pt-14.5 pb-22.5 px-10 md:px-20 lg:px-30.25 gap-6">
        <div className="flex flex-col gap-2.5 items-center">
          <MailOpen size={41} className="font-bold text-[#0017E5]" />
          <p className="font-bold text-black text-[41px]">Check your email</p>
          <p className="font-bold text-[21px] text-[#0A0332]">
            We&apos;ve sent reset link and an OTP to oli********@untitledui.com
          </p>
        </div>
        <Button text="Done" type="primary" />
        <div className="flex items-center gap-1.25 w-full">
          <div className="grow border-t border-[#ADADAD]" />
          <button className="flex items-center font-medium text-[12px] text-[#4C4747] text-center mt-4">
            <ArrowLeft /> Back to Login
          </button>
          <div className="grow border-t border-[#ADADAD]" />
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmation;
