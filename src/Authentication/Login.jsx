import React from "react";
import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="flex flex-grow items-center justify-center h-screen">
      <SignIn signInUrl="/register" forceRedirectUrl={"/main"} />
    </div>
  );
};

export default Login;
