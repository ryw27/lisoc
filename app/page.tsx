import Logo from "@/components/logo"
import Link from "next/link"
export default function Home() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-white">
			<div className="flex flex-col items-center w-full max-w-md mx-auto px-4">
				<div className="mt-16 mb-8 flex flex-col items-center w-full">
					<Logo />
				</div>
				<div className="flex flex-col items-center w-full mb-8">
					<div className="flex flex-row items-center justify-center gap-3 w-full mb-4">
						<Link
							href="/login"
							className="rounded-md bg-gray-200 font-bold px-4 py-2 transition-colors hover:bg-gray-300 min-w-48 text-center"
						>
							Family login
						</Link>
						<Link
							href="/login/admin"
							className="rounded-md bg-gray-200 font-bold px-4 py-2 transition-colors hover:bg-gray-300 min-w-48 text-center"
						>
							Admin login
						</Link>
						<Link
							href="/login/teacher"
							className="rounded-md bg-gray-200 font-bold px-4 py-2 transition-colors hover:bg-gray-300 min-w-48 text-center"
						>
							Teacher login
						</Link>
					</div>
					<div className="flex justify-center w-full">
						<Link
							href="/register"
							className="rounded-md bg-gray-200 font-bold px-4 py-2 transition-colors hover:bg-gray-300 min-w-48 text-center"
							style={{ marginTop: 0 }}
						>
							Register
						</Link>
					</div>
				</div>
				<p className="text-sm text-gray-500 mt-4">
					<strong>Disclaimer:</strong> This is a beta version of the new website. Please use the desktop version for best experience. Please report any issues to{" "}
					<a href="mailto:tech.lisoc@gmail.com" className="text-blue-500 underline">
						tech.lisoc@gmail.com
					</a>.
					<br />
					Additionally, due to the migration to the new system, any old passwords will not work. Please use the forgot password feature to reset your password.
				</p>
			</div>
		</div>
	);
}
