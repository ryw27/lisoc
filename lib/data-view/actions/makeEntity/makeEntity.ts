import { TableName, Table, PKName, enrichFields, uniqueCheckFields, Extras, FilterableColumn, EntityConfig } from '../../types';
import { makeOperations } from './makeOperations';
import { ZodSchema } from 'zod';
import { InferSelectModel } from 'drizzle-orm';

// Some possible TODOS:
// 1. Safe Parse for better handling
// 2. Caching and more efficency 

interface makeEntityProps<N extends TableName, T extends Table<N>, FormSchema extends ZodSchema> {
    table: T;
    tableName: N;
    primaryKey: PKName<N, T>;
    formSchema: FormSchema;
    mainPath: string;
	enrichFields: enrichFields<FormSchema>[], 
	uniqueConstraints?: uniqueCheckFields<N, T, FormSchema>[],
    insertExtras?: Extras<N, T>,
    updateExtras?: Extras<N, T>,
    columns: FilterableColumn<InferSelectModel<T>>[];
}

export function makeEntity<N extends TableName, T extends Table<N>, FormSchema extends ZodSchema = ZodSchema>(
    {
        table,
        tableName,
        primaryKey,
        formSchema,
        mainPath,
        enrichFields,
        uniqueConstraints,
        insertExtras,
        updateExtras,
        columns
    }: makeEntityProps<N, T, FormSchema>
): EntityConfig<N, T> {
    const { allRows, idRow, pageRows, insertRow, updateRow, deleteRows } = 
        makeOperations(tableName, table, primaryKey, formSchema, mainPath, enrichFields, uniqueConstraints, insertExtras, updateExtras);

    const config: EntityConfig<N, T> = {
        table,
        tableName,
        primaryKey,
        formSchema,
        mainPath,
        columns,
        ops: {
            allRows,
            idRow,
            pageRows,
            insertRow,
            updateRow,
            deleteRows,
        }
    }
    return config;
}