import { InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { regchangerequest } from "@/lib/db/schema";
import { type EntityConfig } from "@/types/dataview.types";

// 1. Types
export type RegChangeRequestTable = typeof regchangerequest;
export type RegChangeRequestObject = InferSelectModel<RegChangeRequestTable>;

// 2. Form Schema. Reg Change Request should never be created or updated individually. It is only used for display.
// If it must, go to postgres itself.
export const regChangeRequestFormSchema = z.object({});

// 3. The Reg Change Request Config
export const regChangeRequestConfig: EntityConfig<RegChangeRequestTable> = {
    table: regchangerequest,
    tableName: "regchangerequest",
    primaryKey: "requestid",
    formSchema: regChangeRequestFormSchema,
};
