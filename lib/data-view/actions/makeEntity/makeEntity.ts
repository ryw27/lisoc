import { Table, FilterableColumn, EntityConfig, PKName, Extras } from '../../types';
import { z } from 'zod/v4';
import { DefaultSession } from 'next-auth';
import { InferSelectModel } from 'drizzle-orm';


// export function makeEntity<
//     T extends Table, 
//     FormSchema extends z.ZodObject, 
//     DeleteFormSchema extends z.ZodObject,
// >(
//     table: T,
//     columns: FilterableColumn<InferSelectModel<T>>[],
//     mainPath: string,
//     primaryKey: PKName<T>,
//     formSchema: FormSchema,
//     deleteFormSchema: DeleteFormSchema,
//     createUpdateExtras?: (user: DefaultSession["user"]) => Extras<T>,
//     createInsertExtras?: (user: DefaultSession["user"]) => Extras<T>,
// ) {
//     // const { insertRow, updateRow, deleteRows } = makeOperations(
//     //     table,
//     //     mainPath,
//     //     primaryKey,
//     //     formSchema,
//     //     deleteFormSchema,
//     //     createUpdateExtras,
//     //     createInsertExtras,
//     // );

//     const config: EntityConfig<T, FormSchema, DeleteFormSchema> = {
//         table,
//         formSchema,
//         deleteFormSchema,
//         columns,
//         // ops: {
//         //     insertRow,
//         //     updateRow,
//         //     deleteRows,
//         // },
//     };

//     return config;
// }