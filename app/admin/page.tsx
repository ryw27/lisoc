import { requireRole } from "../lib/actions";
import { redirect } from "next/navigation";
import SideNav from "../../components/sidenav";

export default async function Admin() {
    const admin = await requireRole(["ADMIN"])
    if (!admin) {
        redirect("/login");
    }
    const navItems = [
        {
            label: "Dashboard",
            href: "/admin",
            icon: "HomeIcon"
        },
        {
            label: "Teachers",
            href: "/admin/teachers",
            icon: "UserIcon"
        },
        {
            label: "Parents",
            href: "/admin/parents",
            icon: "UserIcon"
        },
        {
            label: "Students",
            href: "/admin/students",
            icon: "UserIcon"
        },
        {
            label: "Classes",
            href: "/admin/classes",
            icon: "UserIcon"
        },
        {
            label: "Transactions",
            href: "/admin/transactions",
            icon: "MoneyIcon"
        },
        {
            label: "Settings",
            href: "/admin/settings",
            icon: "CogIcon"
        }, 
    ]

    return (
        <div>
            <SideNav items={navItems} />
            <div className="flex-1">
                <h1>Admin</h1>
            </div>
        </div>
    )
}