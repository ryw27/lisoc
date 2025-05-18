import { FilterableColumn, filterTypes, formatDate } from "../admintest/components/columns/column-types";
import { AnyPgColumn, AnyPgTable, PgColumn } from 'drizzle-orm/pg-core';
import { InferSelectModel, getTableColumns, inArray } from "drizzle-orm";
import * as schema from "@/app/lib/db/schema";
import { db } from "./db";



// ----------------------------------------------------------------
// Filter Type Utilities
// ----------------------------------------------------------------

/**
 * Maps Drizzle column types to filter types
 * @param column A Drizzle column from the schema
 * @returns The appropriate filter type as a string
 */
export function getFilterTypeFromColumn(column: AnyPgColumn): string {
  const pgColumn = column as PgColumn;
  const dataType = pgColumn?.dataType?.toLowerCase() || '';
  
  if (dataType.includes('varchar') || dataType.includes('text') || dataType.includes('char')) {
    return 'text';
  } else if (dataType.includes('int') || dataType.includes('decimal') || dataType.includes('numeric') || dataType.includes('float')) {
    return 'number';
  } else if (dataType.includes('timestamp') || dataType.includes('date')) {
    return 'date';
  } else if (dataType.includes('boolean')) {
    return 'enum';
  }
  
  return 'text'; // Default to text for unknown types
}

/**
 * Creates a filter configuration based on the column type
 * @param type The type of the column ('text', 'enum', 'number', 'date')
 * @returns A filter configuration object
 */
function defaultFilter(type: string): filterTypes {
  switch (type) {
    case 'text':
      return { type: 'text', mode: ['='] };
    case 'enum':
      return { type: 'enum', mode: ['=', '≠'], options: [] };
    case 'number':
      return { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] };
    case 'date':
      return { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='], options: ['hours', 'days', 'months', 'years'] };
    default:
      return { type: 'text', mode: ['='] };
  }
}

// ----------------------------------------------------------------
// Column Definition Generators
// ----------------------------------------------------------------

/**
 * Checks if a column is a PgColumn
 * @param column The column to check
 * @returns True if the column is a PgColumn, false otherwise - used to filter out non-column properties like enableRLS
 */
function isPgColumn(column: AnyPgColumn): column is PgColumn {
  return !!column && typeof column === 'object' && 'dataType' in (column as any);
}


/**
 * Generates column definitions with filter metadata from a Drizzle schema table
 * @type {T} The type of the table, derived from the schema: can be classes, teacher, student, etc.
 * @param table A Drizzle schema table
 * @param overrides Optional overrides for specific columns
 * @returns An array of column definitions with filter metadata. Used for the table component.
 */
export function generateColumnDefs<T extends object>(
  table: { [K in keyof T]: AnyPgColumn },
  overrides: Partial<Record<keyof T, Partial<FilterableColumn<T>>>> = {}
): FilterableColumn<T>[] {
  try {
    return Object.entries(table)
    .filter(([, column]) => isPgColumn(column as AnyPgColumn))
    .map(([key, column]) => {
      const baseKey = key as keyof T;
      const columnType = getFilterTypeFromColumn(column as AnyPgColumn);
      const baseFilter = defaultFilter(columnType);
      
      // For boolean columns, add true/false options
      if (columnType === 'enum' && (column as PgColumn)?.dataType?.toLowerCase().includes('boolean')) {
        (baseFilter as any).options = ['true', 'false'];
      }
      
      return {
        id: key,
        accessorKey: columnType === 'date' ? undefined : key,
        accessorFn: columnType === 'date' ? (row) => formatDate(new Date(row[key as keyof T] as string)) : undefined,
        header: key,
        meta: {
          filter: baseFilter
        },
        ...overrides[baseKey],
      };
    }) as FilterableColumn<T>[];
  } catch (error) {
    console.error('Error generating column definitions:', error);
    return [];
  }
}


// ----------------------------------------------------------------
// Schema-Specific Column Definitions
// ----------------------------------------------------------------

/**
 * Generates column definitions for the classes table
 * @returns Properly filtered and formatted column definitions for classes
 */
export function getClassColumns() {
  return generateColumnDefs(schema.classes, {
    classnamecn: {
      header: "Class Name (CN)",
      meta: {
        filter: {
          type: 'text',
          mode: ['=']
        }
      }
    },
    classnameen: {
      header: "Class Name (EN)"
    },
    classid: {
      header: "Class ID"
    },
    lastmodify: {
      header: "Last Modified"
    }
  });
}

/**
 * Generates column definitions for the teacher table
 * @returns Properly filtered and formatted column definitions for teachers
 */
export function getTeacherColumns() {
  return generateColumnDefs(schema.teacher, {
    teacherid: {
      header: "Teacher ID"
    },
    namecn: {
      header: "Name (Chinese)"
    },
    namefirsten: {
      header: "First Name"
    },
    namelasten: {
      header: "Last Name"
    },
    status: {
      meta: {
        filter: {
          type: 'enum',
          mode: ['=', '≠'],
          options: ['Active', 'Inactive', 'On Leave']
        }
      }
    },
    lastlogin: {
      header: "Last Login"
    }
  });
}

/**
 * Generates column definitions for the student table
 * @returns Properly filtered and formatted column definitions for students
 */
export function getStudentColumns() {
  return generateColumnDefs(schema.student, {
    studentid: {
      header: "Student ID"
    },
    namecn: {
      header: "Name (Chinese)"
    },
    namefirsten: {
      header: "First Name"
    },
    namelasten: {
      header: "Last Name"
    },
    dob: {
      header: "Date of Birth"
    }
  });
}


export async function deleteRows<T extends AnyPgTable, PrimaryKey extends keyof T['_']['columns'] & string>
(
    table: T, 
    pk: PrimaryKey,
    values: InferSelectModel<T>[PrimaryKey] | InferSelectModel<T>[PrimaryKey][] //number, number[]
) {
    // const session = await requireRole(["ADMIN"]);
    // if (!session?.user) {
    //     throw new Error("Not authorized ");
    //     return;
    // } 

    const valueslist = Array.isArray(values) ? values : [values]
    const column = getTableColumns(table)[pk]
    return await db.delete(table).where(inArray(column, valueslist)).returning();
}
