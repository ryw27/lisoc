import Image from "next/image";
import Link from "next/link";

interface LogoProps {
    width?: number;
    height?: number;
    transparent?: boolean;
}

export default function Logo({ width = 900, height = 500 }: LogoProps) {
    return (
        <Link href="/">
            {/*<Image src="/lisoc.png" alt="LISOC Logo" width={width} height={height} priority />*/}
            <Image
                src="/Banner_lisoc.jpg"
                alt="LISOC Logo"
                width={width}
                height={height}
                className="mix-blend-multiply"
                priority
            />
        </Link>
    );
}
