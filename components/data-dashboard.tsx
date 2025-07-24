import DataTable from "@/components/data-table/data-table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import HorizontalNav from "./horizontal-nav";
import { FilterableColumn } from "@/app/lib/column-actions";
import { TableName, PKVal, PKName } from "@/app/lib/entity-types";
import { InferSelectModel } from "drizzle-orm";
import { Table } from "@/app/lib/entity-types";

// Strict typing for the data dashboard props
export interface DataDashboardProps<
    N extends TableName,
    T extends Table<N>,
    TData extends InferSelectModel<T> = InferSelectModel<T>
> {
    data: TData[];
    columns: FilterableColumn<TData>[];
    totalCount: number;
    tableName: N;
    primaryKey: PKName<N, T>;
    addLink: string;
    addText: string;
    deleteAction: (id: PKVal<N>[]) => Promise<InferSelectModel<T>[]>;
    navTabs?: { label: string; href: string; }[];
}

//--------------------------------
//-- Production-Grade Data Dashboard
//--------------------------------

export default function DataDashboard<
    N extends TableName,
    T extends Table<N>,
    TData extends InferSelectModel<T> = InferSelectModel<T>
>({
    data,
    columns,
    totalCount,
    tableName,
    primaryKey,
    addLink, 
    addText,
    deleteAction,
    navTabs,
}: DataDashboardProps<N, T, TData>) {
    // Validation for production safety
    if (!data || !Array.isArray(data)) {
        console.error(`[DataDashboard] Invalid data provided for table ${tableName}`);
        return (
            <div className="flex flex-col gap-4 p-4">
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-md p-4">
                    <h2 className="font-semibold">Data Error</h2>
                    <p>Unable to load data for {tableName}. Please try again later.</p>
                </div>
            </div>
        );
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
        console.error(`[DataDashboard] Invalid columns provided for table ${tableName}`);
        return (
            <div className="flex flex-col gap-4 p-4">
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-md p-4">
                    <h2 className="font-semibold">Configuration Error</h2>
                    <p>Table configuration is invalid for {tableName}. Please contact support.</p>
                </div>
            </div>
        );
    }

    // Capitalize table name for display
    const displayTableName = tableName.charAt(0).toUpperCase() + tableName.slice(1);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">View {displayTableName}</h1>
                <Link 
                    href={addLink}
                    className="flex items-center gap-2 mr-4 text-sm text-white bg-blue-600 font-medium px-3 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={`Add new ${tableName.slice(0, -1)}`}
                >
                    <PlusIcon className="w-4 h-4" /> {addText}
                </Link>
            </div>
            
            {navTabs && navTabs.length > 0 && (
                <HorizontalNav
                    tabs={navTabs}
                    activeHref={addLink.split('/').slice(0, -1).join('/')}
                />
            )}
            
            <div className="flex items-center px-4 py-2 gap-1">
                <p className="text-lg font-bold">All {displayTableName.toLowerCase()}</p>
                <span className="text-sm text-gray-500">
                    ({totalCount.toLocaleString()})
                </span>
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
    );
}
