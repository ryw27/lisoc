import DataTable from "@/components/data-table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import HorizontalNav from "./horizontal-nav";
import { FilterableColumn } from "@/app/lib/column-actions";

// Props for the data dashboard
export type DataDashboardProps<TData extends Record<string, any>> = {
    data: TData[];
    columns: FilterableColumn<TData>[];
    totalCount: number;
    tableName: string;
    addLink: string;
    addText: string;
    deleteAction: (ids: number[]) => Promise<void>;
    primaryKey: string;
    navTabs?: { label: string; href: string; }[];
}

//--------------------------------
//-- Data Dashboard
//--------------------------------

export default function DataDashboard<TData extends Record<string, any>>({
    data,
    columns,
    totalCount,
    tableName,
    addLink, 
    addText,
    deleteAction,
    primaryKey,
    navTabs,
}: DataDashboardProps<TData>) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">View {tableName}</h1>
                <Link 
                    href={addLink}
                    className="flex items-center gap-2 mr-4 text-sm text-white bg-blue-600 font-medium px-3 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                >
                    <PlusIcon className="w-4 h-4" /> {addText}
                </Link>
            </div>
            {navTabs && (
                <HorizontalNav
                    tabs={navTabs}
                    activeHref={addLink.split('/').slice(0, -1).join('/')}
                />
            )}
            <div className="flex items-center px-4 py-2 gap-1">
                <p className="text-lg font-bold">All {tableName.toLowerCase()} </p>
                <span className="text-sm text-gray-500">({totalCount})</span>
            </div>
            
            <DataTable 
                data={data}
                columns={columns}
                totalCount={totalCount}
                tableName={tableName}
                primaryKey={primaryKey}
                deleteAction={deleteAction}
            />
        </div>
    )
}
