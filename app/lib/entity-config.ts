import { ColKey, ColVal, PKName, PKVal, Table, TableName } from "./entity-types";
import { z, ZodSchema } from "zod";
import { FilterableColumn } from "./column-actions";
import { makeOperations, type Extras, type enrichFields, type uniqueCheckFields} from "./data-actions"
import { parsedParams } from "./handle-params";
import { PgTransaction } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as schema from "./db/schema";

// The only unique things you need for each entity are form schema, header names, revalidate path, and enrich/unique/extras 
// EntityConfig is a generic type that takes a table name and returns an object with the following properties:
// tableName: The name of the table
// primaryKey: The name of the primary key column
// formSchema: The Zod schema for the form
// revalidatePath: The path to revalidate
// ops: An object encompassing all CRUD operations for the table
export interface EntityConfig<N extends TableName, T extends Table<N>> {
    table: T; // The table object, i.e. classes, adminrole, etc.
    tableName: N; // The name of the table, i.e. classes, adminrole, etc.
    primaryKey: PKName<N>; // The name of the primary key column, i.e. classid, roleid, etc.
    formSchema: ZodSchema; // The Zod schema for the form, used for editing, adding, and updating
    revalidatePath: string; // The path to revalidate, used for revalidating the page after a mutation
    columns: FilterableColumn<InferSelectModel<T>>[]; // The column definitions for the table, used for the table headers and filtering
    ops: {
        allRows: () => Promise<InferSelectModel<T>[]>; // Get all rows from the table
        idRow: (id: PKVal<N>) => Promise<InferSelectModel<T>>; // Get a row from the table by its primary key
        pageRows: (opts: parsedParams) => Promise<{ rows: InferSelectModel<T>[]; totalCount: number }>; // Get rows from the table with pagination
        insertRow: (formData: FormData, insertExtras: Extras<N, T>) => Promise<InferInsertModel<T>>; // Insert a new row into the table
        updateRow: (id: PKVal<N>, formData: FormData, updateExtras: Extras<N, T>) => Promise<InferInsertModel<T>>; // Update a row in the table
        deleteRows: (id: PKVal<N>[]) => Promise<InferSelectModel<T>[]>; // Delete a row from the table
    }
}


interface makeEntityProps<N extends TableName, T extends Table<N>, FormSchema extends ZodSchema> {
    table: T;
    tableName: N;
    primaryKey: PKName<N>;
    formSchema: FormSchema;
    revalidatePath: string;
	enrichFields: enrichFields<FormSchema>[], 
	uniqueConstraints?: uniqueCheckFields<N, T>[],
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
        revalidatePath,
        enrichFields,
        uniqueConstraints,
        insertExtras,
        updateExtras,
        columns
    }: makeEntityProps<N, T, FormSchema>
): EntityConfig<N, T> {
    const { allRows, idRow, pageRows, insertRow, updateRow, deleteRows } = 
        makeOperations(tableName, table, formSchema, revalidatePath, enrichFields, uniqueConstraints, insertExtras, updateExtras);

    const config: EntityConfig<N, T> = {
        table,
        tableName,
        primaryKey,
        formSchema,
        revalidatePath,
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