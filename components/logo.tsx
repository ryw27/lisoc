import Image from "next/image";
import Link from "next/link";

interface LogoProps {
    width?: number;
    height?: number;
}

export default function Logo({ width = 100, height = 100 }: LogoProps) {
    return (
        <Link href="/">
            <Image src="/lisoc.png" alt="LISOC Logo" width={width} height={height} priority />
        </Link>
    );
}