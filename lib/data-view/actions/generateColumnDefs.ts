import { AnyPgColumn } from "drizzle-orm/pg-core";
import { PgColumn } from "drizzle-orm/pg-core";
import { FilterableColumn, filterTypes } from "../types";
import { isPgColumn } from "../helpers";


/**
 * Maps Drizzle column types to filter types
 * @param column A Drizzle column from the schema
 * @returns The appropriate filter type as a string
 */
export function getFilterTypeFromColumn(column: AnyPgColumn): string {
  const pgColumn = column as PgColumn;
  const columnName = pgColumn.name;
  const originalDataType = pgColumn.getSQLType(); // Use getSQLType() here
  const dataType = originalDataType?.toLowerCase() || '';

  if (dataType.includes('varchar') || dataType.includes('text') || dataType.includes('char')) {
    return 'text';
  }
  // Broadened number checks
  if (dataType.includes('int') || dataType.includes('decimal') || dataType.includes('numeric') || dataType.includes('float') || dataType.includes('serial') || dataType.includes('double') || dataType.includes('real')) {
    return 'number';
  }
  if (dataType.includes('timestamp') || dataType.includes('date')) {
    return 'date';
  }
  if (dataType.includes('boolean')) {
    return 'enum';
  }

  // If it reaches here, it's an unrecognized type that will default to 'text'.
  // Log the specific data type that wasn't caught by the conditions above.
  console.error(`[FilterTypeDebug] Column '${columnName}' with raw DB dataType '${originalDataType}' (processed as '${dataType}') is defaulting to filter type 'text'.`);
  return 'text';
}

/**
 * Creates a filter configuration based on the column type
 * @param type The type of the column ('text', 'enum', 'number', 'date')
 * @returns A filter configuration object
 */
export function defaultFilter(type: string): filterTypes {
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



/**
 * Generates column definitions with filter metadata from a Drizzle schema table
 * @type {T} The type of the table, derived from the schema: can be classes, teacher, student, etc.
 * @param table A Drizzle schema table
 * @param overrides Optional overrides for specific columns
 * @returns An array of column definitions with filter metadata. Used for the table component.
 */
export function generateColumnDefs<T extends object>(
  table: { [K in keyof T]: AnyPgColumn },
  overrides: Partial<Record<keyof T, Partial<FilterableColumn<T>>>> = {},
  exclude: string[] = []
): FilterableColumn<T>[] {
  try {
    return Object.entries(table)
    .filter(([key, column]) => isPgColumn(column as AnyPgColumn) && !exclude.includes(key))
    .map(([key, column]) => {
      const baseKey = key as keyof T;
      const columnType = getFilterTypeFromColumn(column as AnyPgColumn);
      const baseFilter = defaultFilter(columnType);
      
      if (columnType === 'enum' && (column as PgColumn).getSQLType()?.toLowerCase().includes('boolean')) {
        (baseFilter as any).options = ['true', 'false'];
      }
      
      return {
        id: key,
        accessorKey: key,
        //TODO: fix this
        // accessorFn: columnType === 'date' ? (row) => formatISO(new Date(row[key as keyof T] as string)) : undefined,
        header: key,
        meta: {
          filter: baseFilter
        },
        ...overrides[baseKey],
      } as FilterableColumn<T>;
    }) as FilterableColumn<T>[];
  } catch (error) {
    console.error('Error generating column definitions:', error);
    return [];
  }
}