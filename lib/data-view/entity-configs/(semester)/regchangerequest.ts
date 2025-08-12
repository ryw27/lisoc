import { regchangerequest } from "@/lib/db/schema";
import { z } from "zod/v4";
import { type EntityConfig } from "@/lib/data-view/types";
import { InferSelectModel } from "drizzle-orm";


// 1. Types
export type RegChangeRequestTable = typeof regchangerequest
export type RegChangeRequestObject = InferSelectModel<RegChangeRequestTable>


// 2. Form Schema. Reg Change Request should never be created or updated individually. It is only used for display.
// If it must, go to postgres itself.
export const regChangeRequestFormSchema = z.object({})


// 3. The Reg Change Request Config
export const regChangeRequestConfig: EntityConfig<RegChangeRequestTable> = {
    table: regchangerequest,
    tableName: "regchangerequest",
    primaryKey: "requestid",
    formSchema: regChangeRequestFormSchema,
}