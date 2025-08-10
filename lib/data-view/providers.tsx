"use client";
import { createContext, useContext, type ReactNode } from 'react';
import { IdMaps } from '../registration/types';
import { FilterableColumn, PKName, Table } from './types';
import { z } from 'zod/v4';


interface IdMapsProviderProps {
    children: ReactNode;
    idMaps: IdMaps;
}

const IdMapsContext = createContext<IdMaps | null>(null);

export function IdMapsProvider({ children, idMaps }: IdMapsProviderProps) {
    return (
        <IdMapsContext.Provider value={idMaps}>
            {children}
        </IdMapsContext.Provider>
    );
}

export function useIdMaps() {
    const context = useContext(IdMapsContext);
    if (!context) {
        throw new Error('useIdMaps must be used within an IdMapsProvider');
    }
    return context;
}

export default IdMapsContext;

//--------------------------------------------------------------------------------------------------------


export interface DataEntityContextValue<T extends Table, RowType> {
    table: T;
    columns: FilterableColumn<RowType>[];
    tableName: string;
    primaryKey: PKName<T>;
    formSchema: z.ZodObject;
}

// @ts-ignore no idea how to figure out this one either
const DataEntityContext = createContext<DataEntityContextValue<any> | null>(null);


interface DataEntityProviderProps<T extends Table, RowType> extends DataEntityContextValue<T, RowType> {
    children: ReactNode;
}
export function DataEntityProvider<T extends Table, RowType>({
    children,
    ...value
}: DataEntityProviderProps<T, RowType>) {
    return (
        <DataEntityContext.Provider value={value}>
            {children}
        </DataEntityContext.Provider>
    );
}

export function useDataEntityContext<T extends Table, RowType>() {
    const context = useContext(DataEntityContext) as DataEntityContextValue<T, RowType> | null;
    if (!context) {
        throw new Error("useDataEntityContext must be used within a DataEntityProvider");
    }
    return context;
}
