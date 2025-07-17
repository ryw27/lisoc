import type { InferSelectModel } from "drizzle-orm";
import { seasons } from "../db/schema";

const SEMESTERONLY_SUITBALETERM_FOREIGNKEY = 2;

export function inSpring(springSeason: InferSelectModel<typeof seasons>): boolean {
    return new Date(Date.now()) >= new Date(springSeason.earlyregdate);
} 
