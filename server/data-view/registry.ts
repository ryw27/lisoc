// Class Configs
import { classConfig } from "./entity-configs/(classes)/classes";
import { classroomConfig } from "./entity-configs/(classes)/classrooms";
import { adminUserConfig } from "./entity-configs/(people)/adminuser";
import { familyConfig } from "./entity-configs/(people)/family";
import { studentConfig } from "./entity-configs/(people)/student";
import { teacherConfig } from "./entity-configs/(people)/teacher";
// People Configs
import { userConfig } from "./entity-configs/(people)/users";
// Semester Configs
import { arrangementConfig } from "./entity-configs/(semester)/arrangement";
import { classRegistrationConfig } from "./entity-configs/(semester)/classregistration";
import { parentDutyConfig } from "./entity-configs/(semester)/parentduty";
import { regChangeRequestConfig } from "./entity-configs/(semester)/regchangerequest";
import { seasonConfig } from "./entity-configs/(semester)/seasons";

export type Registry = typeof registry;
// String -> entity config
export const registry = {
    classes: classConfig,
    classrooms: classroomConfig,
    users: userConfig,
    adminuser: adminUserConfig,
    teacher: teacherConfig,
    family: familyConfig,
    student: studentConfig,
    arrangement: arrangementConfig,
    classregistration: classRegistrationConfig,
    regchangerequest: regChangeRequestConfig,
    parentduty: parentDutyConfig,
    season: seasonConfig,
} as const;

export function getEntityConfig(entity: keyof Registry) {
    const item = registry[entity];
    if (!item) throw new Error(`Unknown entity: ${entity}`);
    return item;
}
