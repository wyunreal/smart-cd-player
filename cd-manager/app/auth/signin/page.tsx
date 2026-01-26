"use client";
import * as React from "react";
import { SignInPage } from "@toolpad/core/SignInPage";
import { providerMap } from "../../../auth";
import signIn from "./actions";
import useThemeCookie from "@/app/hooks/use-theme-cookie";

export default function SignIn() {
  useThemeCookie();
  return <SignInPage providers={providerMap} signIn={signIn} />;
}
