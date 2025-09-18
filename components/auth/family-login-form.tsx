'use client'
import React from "react"
import { cn } from "@/lib/utils"
//import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
//  CardDescription,
  CardHeader,
//  CardTitle,
} from "@/components/ui/card"
//import { Input } from "@/components/ui/input"
//import { Label } from "@/components/ui/label"

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormInput, FormSubmit, FormError } from './form-components';
import { z } from 'zod/v4';
import { emailSchema, loginSchema, usernameSchema } from '@/lib/auth/validation';
import { signIn } from "next-auth/react"
import { useRouter } from 'next/navigation';


import { ErrorCode } from '@/lib/auth/validation';



export function FamilyLoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
   const labels = {
     loginTitle: "Login to your account",
     loginDescription: "Enter your email below to login to your account",
     email: "Email/用户名",
     emailPlaceholder: "me@example.com",
     password: "Password/密码",
     forgotPassword: "Forgot your password/忘记密码?",
     login: "Login/登录",
     loginWithGoogle: "Login with Google",
     dontHaveAccount: "Don't have an account/没有账号?",
     signUp: "Sign up/点击这里"
   }

   const [busy, setBusy] = useState(false);
   const [error, setError] = useState<string | null>();


  //const [email, setEmail] = useState("");
  //const [password, setPassword] = useState("");

   const loginForm = useForm({
      mode: "onChange",
      resolver: zodResolver(loginSchema),
   })


   const errorMessages: { [key: string ]: string} = {
      [ErrorCode.IncorrectEmailPassword]: "Incorrect Email or password",
      [ErrorCode.InternalServerError]: "Something unexpected went wrong. Please contact regadmin",
      [ErrorCode.UserMissingPassword]: "Please fill in your password"
   }

   const router = useRouter();


   const onSubmit = async (data: z.infer<typeof loginSchema>) => {
        // Set busy and reset the error message
        setBusy(true);
        setError(null);
        const provider = "family-credentials";

        const isEmail = emailSchema.safeParse({ email: data.emailUsername }).success;
        const isUsername = usernameSchema.safeParse({ username: data.emailUsername }).success;

        if (!isEmail && !isUsername) {
            throw new Error("Invalid email or username")
        }
        
        const redirectURL = "/dashboard"
        
        const credSubmitObj = 
        {
            email: data.emailUsername,
            password: data.password,
            redirect: false as const
        }  
        const res = await signIn(provider, credSubmitObj);
        if (!res) {
            setError(errorMessages[ErrorCode.InternalServerError]);
            setBusy(false);
        } else if (!res.code) {
            router.push(redirectURL);
        } else if (res.code === ErrorCode.IncorrectEmailPassword) {
            setError(errorMessages[ErrorCode.IncorrectEmailPassword]);
            setBusy(false);
        } /*else if (res.code === ErrorCode.UserMissingPassword) {
            setPasswordForm("setPassword");
            setEmail(data.emailUsername);
            setBusy(false);
        }*/
        else {
            setError(errorMessages[res.code] || "Something went wrong.");
            setBusy(false);
        }
    };

   return (
    <div className={cn("flex gap-8 bg-gradient-to-r from-blue-50 via-white to-blue-100 p-8 rounded-xl shadow-lg", className)} {...props}>
      {/* First column: 5 icon rows */}
      <div className="flex flex-col justify-center items-start gap-8 w-136 min-w-42">
        <div className="flex items-center gap-2 h-16">
          <img src="/home.png" alt="Home Icon" className="w-10 h-10" />
          <div className="flex flex-col">
            <a href="https://home.lisoc.org" className="text-blue-700 underline hover:text-blue-900">Home</a>
            <a href="https://home.lisoc.org" className="text-blue-700 underline hover:text-blue-900">学校首页</a>
          </div>
        </div>
        <div className="flex items-center gap-2 h-16">
          <img src="/login.gif" alt="Login" className="w-10 h-10" />
          <div className="flex flex-col">
            <a href="#" className="text-blue-700 underline hover:text-blue-900">Login</a>
            <a href="#" className="text-blue-700 underline hover:text-blue-900">点击登录</a>
          </div>
        </div>
        <div className="flex items-center gap-2 h-16">
          <img src="/help2.gif" alt="Help" className="w-10 h-10" />
          <div className="flex flex-col">
            <a href="#" className="text-blue-700 underline hover:text-blue-900">Help</a>
            <a href="#" className="text-blue-700 underline hover:text-blue-900">求助电话</a>
            <a href="#" className="text-blue-700 underline hover:text-blue-900">516-860-2583</a>
          </div>
        </div>
        <div className="flex items-center gap-2 h-16">
          <img src="/EmailWrite.gif" alt="Email" className="w-10 h-10" />
          <div className="flex flex-col">
            <a href="#" className="text-blue-700 underline hover:text-blue-900">Contact</a>
            <a href="#" className="text-blue-700 underline hover:text-blue-900">求助与建议</a>
          </div>
        </div>
        <div className="flex items-center gap-2 h-16">
          <img src="/loginad.gif" alt="Admin Login" className="w-10 h-10" />
          <div className="flex flex-col">
            <a href="./login/admin" className="text-blue-700 underline hover:text-blue-900">Admin Login</a>
            <a href="./login/admin" className="text-blue-700 underline hover:text-blue-900">教师/管理员登录</a>
          </div>
        </div>
      </div>
      {/* Second column: login form */}
      <div className="flex-1 min-w-[750px] max-w-[900px]">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-blue-800 text-center">Long Island School of Chinese Online Registration</h1>
          <h1 className="text-lg font-bold text-blue-800 text-center">长岛华夏中文学校网上注册系统</h1>
        </div>
        <div className="relative">
          <div className="absolute -top-5 left-8 flex items-center z-10">
            <div className="flex items-center bg-white px-2 rounded shadow">
              <img src="/acctlogin.gif" alt="Card Border Icon" className="w-10 h-10" />
              <span className="ml-2 text-blue-700 font-bold text-xl">Account Login/用户登录</span>
            </div>
          </div>
          <Card className="bg-white/90 border-4 border-blue-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <label className="flex items-center ml-4 text-sm text-blue-700 font-medium">
                <input type="checkbox" className="form-checkbox mr-2" />
                English Version
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(onSubmit)} >
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <FormInput
                    type="text"
                    label={labels.email}  
                    //disabled={busy}
                    //placeholder={labels.emailPlaceholder}
                    register={loginForm.register("emailUsername")}
                     />
                  {loginForm.formState.errors.emailUsername?.message && (
                                    <FormError error={loginForm.formState.errors.emailUsername.message} />
                  )}

                  {/*errors.email && <span className="text-xs text-red-600">{errors.email}</span>*/}
                </div>
                <div className="grid gap-3">
                  <FormInput
                    type="password"
                    label={labels.password}
                    /*onChange={e => setPassword(e.target.value)}*/
                    register = {loginForm.register("password")}
                    //placeholder="********"
                    //disabled={busy}
                    />
                  <div className="flex items-center">
                    <a
                      href="/forgot-password"
                      className="ml-auto inline-block text-sm text-blue-500 underline-offset-4 hover:underline"
                    >
                      {labels.forgotPassword}
                    </a>
                  </div>

                  {loginForm.formState.errors.password?.message && (
                        <FormError error={loginForm.formState.errors.password.message} />
                  )}

                </div>
                <FormSubmit
                     disabled={
                                busy ||
                               !loginForm.formState.isValid ||
                                loginForm.formState.isSubmitting
                               }
                  >
                    {busy ? "Loading..." : "Continue"}
                  </FormSubmit>
                  {error && <FormError error={error} />}
              </div>
              <div className="mt-4 text-center text-sm">
                {labels.dontHaveAccount}{" "}
                <a href="/register" className="underline underline-offset-4 text-blue-700">
                  {labels.signUp}
                </a>
              </div>
            </form>
            <div className="mt-8 text-xs text-gray-500 text-center">
              Disclaimer: This is a beta version of the new website. Please use the desktop version for best experience. Please report any issues to <a href="mailto:tech.lisoc@gmail.com" className="text-blue-700 underline">tech.lisoc@gmail.com</a>.
Additionally, due to the migration to the new system, any old passwords will not work. Please use the forgot password feature to reset your password.
            </div>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
