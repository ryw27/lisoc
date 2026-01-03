import { InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { parentdutyPb } from "@/lib/db/schema";
import { type EntityConfig } from "@/types/dataview.types";

// 1. Types
export type ParentDutyTable = typeof parentdutyPb;
export type ParentDutyObject = InferSelectModel<ParentDutyTable>;

// 2. Form Schema. Parent Duty should never be created or updated individually. It is only used for display.
export const parentDutyFormSchema = z.object({});

// 3. The Parent Duty Config
export const parentDutyConfig: EntityConfig<ParentDutyTable> = {
    table: parentdutyPb,
    tableName: "parentdutyPb",
    primaryKey: "pdid",
    formSchema: parentDutyFormSchema,
};
