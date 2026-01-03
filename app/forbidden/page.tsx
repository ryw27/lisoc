import Logo from "@/components/logo";

export default function ForbiddenPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Logo />
            <div className="mt-4 text-center">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Access Denied</h1>
                <p className="text-gray-600">You are not authorized to view this page</p>
            </div>
        </div>
    );
}
