import Login from "@/components/auth/login";
import PasswordReset from "@/components/auth/password-reset";
import Register from "@/components/auth/register";
import React from "react";

const Page = () => {
  return (
    <main className=" w-full overflow-hidden">
      <PasswordReset />
    </main>
  );
};

export default Page;
