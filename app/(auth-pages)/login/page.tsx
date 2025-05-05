import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/app/lib/actions';
import Link from 'next/link';
import Logo from '@/components/logo';
import { FcGoogle } from "react-icons/fc";
export default async function LoginPage({
    searchParams,
}: {
    searchParams: {
        error?: string;
    }
}) {

    const params = await searchParams;
    const showError = params?.error !== undefined;

    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-background">
            <Logo/>
            <h1 className="text-2xl font-bold mb-10 mt-10 text-left">Log in to your account</h1>
            <Button variant="outline" className="rounded-sm bg-white! text-lg font-medium text-black border-gray-300 w-1/5 py-5">
                <FcGoogle className="w-5 h-5 mr-2" />
                Continue with Google
                <p className="text-[8px]">Not implemented yet</p>
            </Button>
            <div className="flex w-1/5 items-center gap-4 my-8">
                <div className="bg-gray-200 w-1/2 h-px"></div>
                <span className="text-sm text-gray-500 flex items-center">OR</span>
                <div className="bg-gray-200 w-1/2 h-px"></div>
            </div>
            <form action={login} className="flex flex-col bg-white p-2 w-1/5">
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Email</label>
                    <Input 
                    type="email" 
                    name="email" 
                    placeholder="Enter your email address..." 
                    className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"/>
                </div>
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Password</label>
                    <Input 
                    type="password" 
                    name="password" 
                    placeholder="Enter your password..." 
                    className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"/>
                </div>
                <Link href="/forgot-password" className="text-sm font-bold text-blue-400 mb-4">Forgot password?</Link>
                <Button type="submit" className="rounded-sm bg-blue-400 cursor-pointer text-lg font-bold py-5">Continue</Button>
                {showError && <p className="text-red-400 text-center mt-5">{params?.error}</p>}
            </form>
            <p className="text-gray-500 text-center mt-5">Don't have an account? <Link href="/signup" className="text-blue-400">Sign up</Link></p>
        </main>
    )
}