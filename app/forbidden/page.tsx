import Logo from "@/components/logo"
export default function ForbiddenPage() {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen">
            <Logo />
            <div className="text-center mt-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600">You are not authorized to view this page</p>
            </div>
        </div>
    )
}