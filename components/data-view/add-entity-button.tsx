"use client";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

export default function AddEntityButton({ tablename }: { tablename: string }) {
    return (
        <Link
            href={`${ADMIN_DATAVIEW_LINK}/${tablename}/add`}
            className="flex items-center gap-2 mr-4 text-sm text-white bg-blue-600 font-medium px-3 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Add new ${tablename}`}
        >
            <PlusIcon className="w-4 h-4" /> Add
        </Link> 
    )
}