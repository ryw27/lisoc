import { logout } from "@/app/lib/actions";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
    return (
        <button onClick={logout} className="flex items-center justify-center">
            <LogOut className="w-4 h-4 text-gray-500" />
        </button>
    )
}