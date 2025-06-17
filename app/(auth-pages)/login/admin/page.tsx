import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/app/lib/auth-actions';
import Link from 'next/link';
import Logo from '@/components/logo';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
}) {
    const params = await searchParams;
    const showError = params?.error !== undefined;

    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-background">
            <Logo/>
            <h1 className="text-2xl font-bold mb-10 mt-10 text-left">Admin Login</h1>
            <form action={login} className="flex flex-col bg-white p-2 w-1/5">
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Username</label>
                    <Input 
                        type="username" 
                        name="username" 
                        placeholder="Enter your username..." 
                        className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        required
                        aria-required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Password</label>
                    <Input 
                    type="password" 
                    name="password" 
                    placeholder="Enter your password..." 
                    className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                    required
                    aria-required
                    />
                </div>
                <Link href="/forgot-password" className="text-sm font-bold text-blue-400 mb-4">Forgot password?</Link>
                <Button type="submit" className="rounded-sm bg-blue-400 cursor-pointer text-lg font-bold py-5">Continue</Button>
                {showError && <p className="text-red-400 text-center mt-5">{params?.error}</p>}
            </form>
        </main>
    )
}
