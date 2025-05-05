import Image from "next/image";
import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/">
            <Image src="/lisoc.png" alt="LISOC Logo" width={100} height={100} priority/>
        </Link>
    )
}