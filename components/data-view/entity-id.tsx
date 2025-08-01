import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Table, ColKey, TableName, PKName, ColVal } from "@/lib/data-view/types";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";


export type displaySection<N extends TableName, T extends Table<N>> = {
    label: string;
    key: ColKey<N,T>;
    formatter?: (value: ColVal<N, T, ColKey<N,T>>) => string;
    fallback?: string;
}

export type displaySectionGroup<N extends TableName, T extends Table<N>> = {
    label: string;
    display: displaySection<N, T>[];
}

interface EntityIdProps<N extends TableName, T extends Table<N>, pk extends PKName<N, T>> {
    table: T;
    tableName: N;
    primaryKey: pk;
    titleCol: ColKey<N,T>
    id: number;
    displaySections: displaySectionGroup<N, T>[];
    notFoundMessage?: string;
}

// Helper function to format values
function formatValue<N extends TableName, T extends Table<N>, K extends ColKey<N, T>>(
    section: displaySection<N, T>,
    tableData: T["$inferSelect"]
): string {
    const value = tableData[section.key as unknown as keyof T["$inferSelect"]];
    console.log(section.key)
    
    // Handle null/undefined values
    if (value === null || value === undefined) {
        return section.fallback || 'Not provided';
    }
    
    // Use custom formatter if provided
    if (section.formatter) {
        return section.formatter(value as ColVal<N, T, K>);
    }
    
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    
    return String(value);
}



export default async function EntityId<N extends TableName, T extends Table<N>, pk extends PKName<N, T>>({
    table,
    tableName,
    primaryKey,
    titleCol,
    displaySections,
    notFoundMessage = "Entity not found",
    id
}: EntityIdProps<N, T, pk>) {


    const primColumn = table[primaryKey] as AnyPgColumn;
    const anyTable = table as AnyPgTable;

    const [data] = await db
        .select()
        .from(anyTable)
        .where(eq(primColumn, id))
        .limit(1);
    // console.log(data);

    // Handle not found case
    if (!data) {
        console.error(notFoundMessage);
        notFound();
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href={`/admintest/dashboard/data/${tableName}`}
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>

                <Link 
                    className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 cursor-pointer p-2 underline"
                    href={`/admintest/dashboard/data/${tableName}/${id}/edit`}
                >
                    <Edit className="w-3 h-3"/>Edit {tableName}
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4 break-words">{String(data[titleCol])}</h1>
                <div className="flex flex-col gap-6">
                    {displaySections.map((sectionGroup:displaySectionGroup<N, T>) => (
                        <div key={sectionGroup.label} className="gap-2">
                            <h2 className="text-lg font-semibold mb-2 text-blue-800">{sectionGroup.label}</h2>
                            <div className="space-y-4">
                                {sectionGroup.display.map((section, sectionIndex) => (
                                    <p key={`${String(section.key)}-${sectionIndex}`} className="break-words text-gray-700">
                                        <span className="font-bold text-black">{section.label}:</span> {formatValue(section, data as T["$inferSelect"])}
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
