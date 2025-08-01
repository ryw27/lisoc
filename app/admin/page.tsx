import { requireRole } from "@/lib/auth";

export default async function TestPage() {
    const session = await requireRole(["ADMIN"]);
    console.log(session);
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold text-center">Hello user</h1>
        </div>
    )
}