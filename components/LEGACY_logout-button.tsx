"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
    const router = useRouter();
    const handleLogout = () => {
        signOut({
            callbackUrl: "/",
        });
        router.push("/");
    };
    return (
        <button
            onClick={handleLogout}
            className="flex items-center justify-center rounded-md border-2 border-gray-300 p-2"
        >
            <LogOut className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Sign out</span>
        </button>
    );
}
