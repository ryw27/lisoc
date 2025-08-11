import React from "react";
import { getEntityConfig, Registry } from "@/lib/data-view/registry";
import { FilterableColumn } from "@/lib/data-view/types";
import { DataEntityProvider } from "@/lib/data-view/providers";

export default function ConfigLayout<RowType>({ 
    entity, 
    children, 
    columns 
}: { 
    entity: keyof Registry, 
    children: React.ReactNode, 
    columns: FilterableColumn<RowType>[]
}) {
    const config = getEntityConfig(entity);
    return (
        <DataEntityProvider
            table={config.table}
            columns={columns}
            tableName={config.tableName}
            primaryKey={config.primaryKey}
            formSchema={config.formSchema}
        >
            {children}
        </DataEntityProvider>
    )
}