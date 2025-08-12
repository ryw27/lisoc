import { requireRole } from "@/lib/auth";

export default async function TestPage() {
    const session = await requireRole(["ADMIN"]);
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold text-center">Hello {session.user.name}</h1>
            <p className="text-lg text-center">Welcome to the admin dashboard</p>
            <p className="text-lg text-center">You are logged in as {session.user.email}</p>
        </div>
    )
}