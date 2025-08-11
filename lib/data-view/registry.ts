import { classConfig } from "./entity-helpers/class-helpers";
import { classroomConfig } from "./entity-helpers/classroom-helpers";


export type Registry = typeof registry;
// String -> entity config
export const registry = {
    classes: classConfig,
    classrooms: classroomConfig
} as const;


export function getEntityConfig(entity: keyof Registry) {
  const item = registry[entity];
  if (!item) throw new Error(`Unknown entity: ${entity}`);
  return item;
}


