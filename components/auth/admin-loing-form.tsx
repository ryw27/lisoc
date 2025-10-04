'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
//import { Input } from "@/components/ui/input";
//import { Label } from "@/components/ui/label";
//import { Button } from "@/components/ui/button";

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormInput, FormSubmit, FormError } from './form-components';
import { z } from 'zod/v4';
import { emailSchema, adminloginSchema, usernameSchema } from '@/lib/auth/validation';
import { signIn } from "next-auth/react"
import { useRouter } from 'next/navigation';
import  Link  from 'next/link';

import { ErrorCode } from '@/lib/auth/validation';


export default function AdminLoginForm() {

   const [busy, setBusy] = useState(false);
   const [error, setError] = useState<string | null>();

   const loginForm = useForm({
      mode: "onBlur",
      resolver: zodResolver(adminloginSchema),
   })


   const errorMessages: { [key: string ]: string} = {
      [ErrorCode.IncorrectEmailPassword]: "Incorrect Email or password",
      [ErrorCode.InternalServerError]: "Something unexpected went wrong. Please contact regadmin",
      [ErrorCode.UserMissingPassword]: "Please fill in your password"
   }

   const router = useRouter();


   const onSubmit = async (data: z.infer<typeof adminloginSchema>) => {
        // Set busy and reset the error message
        setBusy(true);
        setError(null);

        const isEmail = emailSchema.safeParse({ email: data.emailUsername }).success;
        // difference between admin and teacher are
        // teachers must use email to loing
        // admin only username  no email  
        let isUsername = false;
        if (!isEmail) {
           isUsername = usernameSchema.safeParse({ username: data.emailUsername }).success;
          if (!isUsername) {
            throw new Error("Invalid email or username")
          }
        }

        // at this point isEmail or isUsername one of must be true and one of them must be false
        const provider = isUsername ? "admin-credentials" :"teacher-credentials" 

        const redirectURL = isUsername ? "/admin"  : "/teacher"
        console.log("redirectURL=", redirectURL)

        const credSubmitObj = isEmail ? 
        {
            email: data.emailUsername,
            password: data.password,
            redirect: false as const
        } : 
        {
            username: data.emailUsername,
            password: data.password,
            redirect: false as const
            // redirectTo: redirectURL
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
        } */else {
            setError(errorMessages[res.code] || "Something went wrong.");
            setBusy(false);
        }
    };


   return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-3xl mb-8 flex justify-center">
        <img src="/ah1.gif" alt="Admin Portal Banner" className="rounded-t-lg shadow w-full h-auto object-cover" style={{ marginTop: '-2rem' }}   />
      </div>
      <div className="flex w-full max-w-3xl">
        {/* Left column with 3 rows */}
        <div className="flex flex-col justify-center items-start gap-6 min-w-[180px] bg-blue-700 rounded-lg shadow p-6 border border-blue-800">
          <Link href="https://home.lisoc.org" className="text-white font-semibold text-lg underline underline-offset-4 hover:text-blue-200">学校主页</Link>
          <Link href="#" className="text-white font-semibold text-lg underline underline-offset-4 hover:text-blue-200">管理员/教师登录</Link>
          <Link href="/" className="text-white font-semibold text-lg underline underline-offset-4 hover:text-blue-200">家长学生登录</Link>
          <div className="text-white font-semibold text-lg"></div>
        </div>
        {/* Login form card */}
        <div className="relative flex-1">
          <div className="absolute -top-5 left-4 flex items-center z-10">
              <div className="flex items-center bg-white px-2 rounded shadow">
                <img src="/acctlogin.gif" alt="Login Form Border Icon" className="w-10 h-10" />
                <span className="ml-2 text-blue-700 font-bold text-xl">Account Login/用户登录</span>
              </div>
          </div>
          <Card className="p-6 border-4 border-blue-700 shadow-md bg-blue-50">
          <CardHeader>
            <CardTitle className="text-center text-blue-700 text-xl font-bold">Admin Login/管理员登录</CardTitle>
          </CardHeader>
            <CardContent>
                 <form  onSubmit={loginForm.handleSubmit(onSubmit)}
                         className="flex flex-col bg-white p-2 "
                         autoComplete="on">

                      <FormInput   type="text"
                                 label="Email or Username"
                                 register={loginForm.register("emailUsername")}
                      />
                       {loginForm.formState.errors.emailUsername?.message && (
                         <FormError error={loginForm.formState.errors.emailUsername.message} />
                        )}
                      <FormInput type="password"
                                 label="Password"
                                 register={loginForm.register("password")}
                      />
                         {loginForm.formState.errors.password?.message && (
                                    <FormError error={loginForm.formState.errors.password.message} />
                        )}
                      <FormSubmit disabled= { busy || !loginForm.formState.isValid || loginForm.formState.isSubmitting }
                                >
                                    {busy ? "Loading..." : "Continue"}
                      </FormSubmit>
                        {error && <FormError error={error} />}
                  </form>

          </CardContent>
          </Card>
        </div>
      </div>
      <footer className="w-full text-center py-4 text-xs text-gray-500 font-bold">
        &copy; 2025 Long Island School of Chinese. All rights reserved.
      </footer>
    </div>
  );
}


