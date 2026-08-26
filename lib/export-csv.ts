import { download, generateCsv, mkConfig, type ColumnHeader } from "export-to-csv";

// ----------------------------------------------------------------
// Generic CSV export for client tables.
// Pass `columnHeaders` ({ key, displayLabel }) to both pick and order
// the exported columns; otherwise every key on the row is exported.
// ----------------------------------------------------------------
export function exportRowsToCsv<
    T extends Record<string, string | number | boolean | null | undefined>,
>(rows: T[], filename: string, columnHeaders?: ColumnHeader[]) {
    if (!rows.length) return;

    const config = mkConfig({
        fieldSeparator: ",",
        filename,
        decimalSeparator: ".",
        ...(columnHeaders ? { columnHeaders } : { useKeysAsHeaders: true }),
    });

    download(config)(generateCsv(config)(rows));
}
