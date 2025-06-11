import z from "zod"

// Parsed filters only, not including page, pageSize, sortBy, sortOrder, match
export type ParsedFilter = {
    field: string, // The column that is being filtered
    op: 'eq' | 'lt' | 'gt' | 'gte' | 'lte', // Operation on clumn
    value: z.infer<typeof primitive> // Correctly coerce value into the correct JS type
}

// Paramaters after proper parsing done
export type parsedParams = {
	page: number,
	pageSize: number,
	sortBy: string | undefined,
	sortOrder: 'asc' | 'desc' | undefined,
	match: 'all' | 'any'
	query: ParsedFilter[]
}

// General search params when they come in from the URL
export type SearchParams = {
    page: string | undefined;
    pageSizes: string | undefined;
    sortBy: string | undefined;
    sortOrder: 'asc' | 'desc' | undefined
    match: 'any' | 'all' | undefined
    [key: string]: string | undefined; // Allow for additional query parameters
}


// Helper zod to turn all query paramaters into the correct type
export const primitive = z.union([
    z.enum(["Active", "Inactive"]),
    z.coerce.number(),
    z.coerce.date(),
    z.string(),
])



export async function parseParams(searchParams: Promise<SearchParams>) {
	const params = await searchParams;
    const out: parsedParams = {
		page: 1,
		pageSize: 10,
		sortBy: undefined,
		sortOrder: undefined,
		match: 'all',
		query: []
	}

    Object.entries(params).forEach(([rawKey, rawValue]) => {
		if (rawValue === undefined) return;
		if (rawKey == "pageSize") {
			const parsed = parseInt(rawValue);
			if (!isNaN(parsed) && parsed > 0) out.pageSize = parsed;
		}
		if (rawKey == "page") {
			const parsed = parseInt(rawValue);
			if (!isNaN(parsed) && parsed > 0) out.page = parsed;
		}
		if (rawKey == "sortBy") {
			const parsed = rawValue;
			if (parsed !== undefined) out.sortBy = parsed;
		}
		if (rawKey == "sortOrder") {
			const parsed = rawValue;
			if (parsed !== undefined) out.sortOrder = parsed as 'asc' | 'desc';
		}
		if (rawKey == "match") out.match = rawValue as 'all' | 'any';
	})

	out.query = parseFilters(params);
	return out;
}


export function parseFilters(params: Record<string, string | undefined>) {
    const out: ParsedFilter[] = []
    Object.entries(params).forEach(([rawKey, rawValue]) => {
        if (rawValue === undefined) return; 
		if (rawKey == "match") return;
		if (rawKey == "pageSize" || rawKey == "page") return;
		if (rawKey == "sortBy" || rawKey == "sortOrder") return;
        let field = rawKey;
        let op: ParsedFilter['op'] = 'eq';
        const reg = rawKey.match(/^(.+)\[(gte|lte|gt|lt)\]$/)
        if (reg) {
            field = reg[1];
            op = reg[2] as ParsedFilter['op']
        }

        const value = primitive.parse(rawValue);
        out.push({field, op, value});
    })
    return out;
}

