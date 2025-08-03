import React from "react";
import { SignUp } from "@clerk/clerk-react";

const Register = () => {
  return (
    <div className="flex flex-grow items-center justify-center h-screen">
      <SignUp signInUrl="/login" forceRedirectUrl={"/main"} />
    </div>
  );
};

export default Register;
