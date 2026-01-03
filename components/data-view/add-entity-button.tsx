"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";

export default function AddEntityButton({ tablename }: { tablename: string }) {
    return (
        <Link
            href={`${ADMIN_DATAVIEW_LINK}/${tablename}/add`}
            className="mr-4 flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            aria-label={`Add new ${tablename}`}
        >
            <PlusIcon className="h-4 w-4" /> Add
        </Link>
    );
}
