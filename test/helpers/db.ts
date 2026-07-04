import { vi } from "vitest";

/**
 * A chainable, thenable stand-in for a Drizzle query builder.
 *
 * Drizzle builders are lazy + thenable: `await db.select().from(t).where(x).limit(1).for("update")`
 * only executes when awaited. This returns itself for every intermediate builder method and
 * resolves to `result` when awaited (or when `.returning()`/`.execute()` is awaited).
 */
export function makeChain(result: unknown = undefined) {
    const chain: Record<string, unknown> = {};
    const passthrough = [
        "from",
        "where",
        "set",
        "values",
        "limit",
        "offset",
        "orderBy",
        "groupBy",
        "having",
        "leftJoin",
        "innerJoin",
        "rightJoin",
        "for",
        "returning",
        "onConflictDoUpdate",
        "onConflictDoNothing",
    ];
    for (const m of passthrough) chain[m] = vi.fn(() => chain);
    chain.execute = vi.fn(() => Promise.resolve(result));
    chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject);
    return chain;
}

/** Every table a family action reads/writes — passed to makeDb so `db.query.<t>` exists. */
export const ALL_TABLES = [
    "users",
    "family",
    "student",
    "teacher",
    "classregistration",
    "arrangement",
    "seasons",
    "familybalance",
    "feelist",
    "regchangerequest",
    "registration_drafts",
    "verificationToken",
];

type QueryTable = { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };

function makeQuery(tables: string[]): Record<string, QueryTable> {
    const q: Record<string, QueryTable> = {};
    for (const t of tables) {
        q[t] = {
            findFirst: vi.fn().mockResolvedValue(undefined),
            findMany: vi.fn().mockResolvedValue([]),
        };
    }
    return q;
}

function builder() {
    return {
        select: vi.fn(() => makeChain()),
        insert: vi.fn(() => makeChain()),
        update: vi.fn(() => makeChain()),
        delete: vi.fn(() => makeChain()),
    };
}

/**
 * Build a mock `db` (with a matching transaction `tx`, reachable at `db.__tx`) mirroring the
 * slice of the Drizzle client the family actions touch. `db.transaction(cb)` runs `cb(tx)` and
 * returns its result, so a transactional action executes its whole body against `tx`.
 *
 * Configure reads with `db.query.<table>.findFirst.mockResolvedValue(...)`; configure a chained
 * write's result with e.g. `tx.insert.mockReturnValueOnce(makeChain([insertedRow]))`.
 */
export function makeDb(tables: string[]) {
    const tx = { query: makeQuery(tables), ...builder() };
    const db = {
        query: makeQuery(tables),
        ...builder(),
        transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
        __tx: tx,
    };
    return { db, tx };
}
