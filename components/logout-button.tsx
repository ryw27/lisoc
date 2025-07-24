"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();
    const handleLogout = () => {
        console.log("Logging out");
        signOut({
            callbackUrl: "/",
        });
        router.push("/");
    }
    return (
        <button onClick={handleLogout} className="flex items-center justify-center border-2 border-gray-300 rounded-md p-2">
            <LogOut className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Sign out</span>
        </button>
    )
}