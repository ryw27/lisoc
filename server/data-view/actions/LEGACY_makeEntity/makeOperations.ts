// import { z } from "zod/v4";
// import { Table, Extras, PKName, PKVal } from "../../types";
// import { DefaultSession } from "next-auth";

// export function makeOperations<T extends Table>(
// 	table: T,
// 	mainPath: string,
// 	primaryKey: PKName<T>,
// 	formSchema: z.ZodObject,
// 	deleteSchema: z.ZodObject,
// 	createUpdateExtras?: (user: DefaultSession["user"]) => Extras<T>,
// 	createInsertExtras?: (user: DefaultSession["user"]) => Extras<T>,
// ) {
// 	const insertRow = makeInsertAction(table, formSchema, primaryKey, mainPath, createInsertExtras);
// 	const updateRow = makeUpdateRow(table, formSchema, primaryKey, mainPath, createUpdateExtras);
// 	const deleteRows = makeDeleteRows(table, primaryKey, deleteSchema, mainPath);

// 	return { insertRow, updateRow, deleteRows };
// }
