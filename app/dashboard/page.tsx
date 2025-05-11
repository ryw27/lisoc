import SessionManager from "@/components/session-manager";
import { requireRole } from "../lib/actions";
import ParentDashboard from "./components/parent-dashboard";
import TeacherDashboard from "./components/teacher-dashboard";

export default async function Dashboard() {
    const parent = await requireRole(["PARENT"])
    const teacher = await requireRole(["TEACHER"])
    
    return (
        <SessionManager requireRole={["TEACHER", "PARENT", "STUDENT"]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome to your dashboard.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
                    {teacher && <TeacherDashboard />}
                    {parent && <ParentDashboard />}
                    {!teacher && !parent && (
                        <div className="text-center py-8">
                            <h2 className="text-lg font-medium mb-2">Welcome to your dashboard</h2>
                            <p className="text-gray-500">Your personalized content will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </SessionManager>
    );
}
