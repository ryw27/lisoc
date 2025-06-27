import { ColumnDef } from "@tanstack/react-table";

//Helper function to format date
// export function formatDate(date: Date) {
//     // Format as YYYY-MM-DD to ensure consistency between server and client
//     if (!date) return "";
//     try {
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const day = String(date.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//     } catch (error) {
//         return "Invalid date";
//     }
// }
//Filter types
export type filterTypes = 
    | {type: 'text'; mode: ['=']}
    | {type: 'enum'; mode: ['=', '≠'], options: readonly string[]}
    | {type: 'number'; mode: ['=', '≠', '>', '<', '>=', '<=', 'between']}
    | {type: 'date'; mode: ['in the last', '=', 'between', '>=', '<='], options: ['hours', 'days', 'months', 'years']}

export interface ColumnMetaFilter {
    filter?: filterTypes;
}

export type FilterableColumn<TData> =
  ColumnDef<TData, unknown>   // TanStack's generic column
  & { id: string           // force this to exist
      meta: ColumnMetaFilter,  
}

