import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type entityFormsHeaderProps = {
    type: "add" | "edit" | "view";
    gobacklink: string;
    editlink?: string;
};
export default function EntityFormsHeader({
    // type,
    gobacklink,
    // editlink,
}: entityFormsHeaderProps) {
    return (
        <div className="container mx-auto flex max-w-5xl justify-between">
            <Link
                className="flex items-center gap-1 text-xs font-bold text-blue-600 underline"
                href={gobacklink}
            >
                <ArrowLeft className="h-4 w-4" /> Go Back
            </Link>
            {/* {type === "view" && (
                <Link
                    className="flex items-center gap-1 text-blue-600 underline text-xs font-bold"
                    href={editlink as string}
                >
                    Edit <Edit className="w-4 h-4" /> 
                </Link>
            )} */}
        </div>
    );
}
