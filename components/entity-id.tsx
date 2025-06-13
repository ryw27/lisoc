import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { eq } from "drizzle-orm";
import { Table, ColumnKey, TableName } from "@/app/lib/entity-types";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import * as schema from "@/app/lib/db/schema";

// Utility function to handle param extraction and parsing
export async function extractEntityParam(
    params: Promise<Record<string, string>>, 
    paramKey: string
): Promise<number> {
    const resolvedParams = await params;
    const paramValue = resolvedParams[paramKey];
    
    if (!paramValue) {
        console.error(`Parameter '${paramKey}' not found in URL`);
        notFound();
    }
    
    const parsedValue = parseInt(paramValue);
    if (isNaN(parsedValue)) {
        console.error(`Parameter '${paramKey}' is not a valid number: ${paramValue}`);
        notFound();
    }
    
    return parsedValue;
}



export type displaySection<N extends TableName> = {
    label: string;
    key: ColumnKey<N>;
    formatter?: (
        value: Table<N>["$inferSelect"][ColumnKey<N>]
    ) => string;
    fallback?: string;
}

export type displaySectionGroup<N extends TableName> = {
    label: string;
    display: displaySection<N>[];
}

interface EntityIdProps<N extends TableName, pk extends ColumnKey<N>> {
    tableName: N;
    primaryKey: pk;
    id: number;
    displaySections: displaySectionGroup<N>[];
    notFoundMessage?: string;
}

// Helper function to format values
function formatValue<N extends TableName>(
    section: displaySection<N>, 
    tableData: Table<N>['$inferSelect']
): string {
    const value = tableData[section.key];
    
    // Handle null/undefined values
    if (value === null || value === undefined) {
        return section.fallback || 'Not provided';
    }
    
    // Use custom formatter if provided
    if (section.formatter) {
        return section.formatter(value);
    }
    
    // Default formatting based on type
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        return new Date(value).toLocaleDateString();
    }
    
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    
    return String(value);
}



export default async function EntityId<N extends TableName, pk extends ColumnKey<N>>({
    tableName,
    primaryKey,
    displaySections,
    notFoundMessage = "Entity not found",
    id
}: EntityIdProps<N, pk>) {

    const table  = schema[tableName] as Table<N>;
    const column = table[primaryKey] as AnyPgColumn;

    const [data] = await db
    .select()
    .from(table as AnyPgTable)
    .where(eq(column, id))
    .limit(1);

    // Handle not found case
    if (!data) {
        console.error(notFoundMessage);
        notFound();
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href={`/admintest/dashboard/${tableName}`}
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>

                <Link 
                    className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 cursor-pointer p-2 underline"
                    href={`/admintest/dashboard/${tableName}/${id}`}
                >
                    <Edit className="w-3 h-3"/>Edit {tableName}
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4 break-words">{String(data[primaryKey])}</h1>
                <div className="flex flex-col gap-6">
                    {displaySections.map((sectionGroup) => (
                        <div key={sectionGroup.label} className="gap-2">
                            <h2 className="text-lg font-semibold mb-2 text-blue-800">{sectionGroup.label}</h2>
                            <div className="space-y-4">
                                {sectionGroup.display.map((section, sectionIndex) => (
                                    <p key={`${String(section.key)}-${sectionIndex}`} className="break-words text-gray-700">
                                        <span className="font-bold text-black">{section.label}:</span> {formatValue(section, data)}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
