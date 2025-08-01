import Logo from "@/components/logo"
import Link from "next/link"
export default function Home() {
	return (
		<div className="relative min-h-screen flex flex-col items-center justify-center">
			<div className="flex flex-col items-center justify-center w-full h-full absolute inset-0">
				<div className="flex justify-center w-full mr-3">
					<Logo />
				</div>
				<div className="flex gap-2 mt-8">
					<Link href="/login" className="rounded-md bg-gray-200 font-bold p-2">
						Family login
					</Link>
					<Link href="/login/admin" className="rounded-md bg-gray-200 font-bold p-2">
						Admin login
					</Link>
					<Link href="/login/teacher" className="rounded-md bg-gray-200 font-bold p-2">
						Teacher login
					</Link>
				</div>
			</div>
		</div>
	);
}
