import { logout } from "@/app/lib/actions";
import { Button } from "./ui/button";

export default function LogoutButton() {
    return (
        <Button onClick={logout}>Logout</Button>
    )
}