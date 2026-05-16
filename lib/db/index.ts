// import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolConfig } from "pg";
import * as relations from "./relations";
import * as schema from "./schema";

// Decide the SSL mode for outbound DB connections.
//
// In production we ALWAYS want TLS — connections to managed Postgres
// (Supabase, Neon, RDS, etc.) traverse the public internet and the
// password is in cleartext on the wire without it. We default to
// `rejectUnauthorized: true` so a misconfigured proxy can't silently
// strip TLS. The two escape hatches let the operator opt out when
// strictly necessary:
//
//   - The connection string can carry `sslmode=` (e.g. `sslmode=require`,
//     `sslmode=no-verify`); when present we hand the decision to pg.
//   - Setting `PGSSLMODE` env var has the same effect.
//   - Setting `PG_SSL_REJECT_UNAUTHORIZED=false` keeps TLS but skips cert
//     verification — useful when the managed-provider CA isn't bundled.
//
// In development we default to no TLS so a vanilla local Postgres works.
function resolveSsl(): PoolConfig["ssl"] {
    const url = process.env.DATABASE_URL ?? "";
    if (/[?&]sslmode=/i.test(url) || process.env.PGSSLMODE) {
        // Let pg / libpq derive the SSL config from the URL or env var.
        return undefined;
    }
    if (process.env.NODE_ENV === "production") {
        const allowSelfSigned = process.env.PG_SSL_REJECT_UNAUTHORIZED === "false";
        return { rejectUnauthorized: !allowSelfSigned };
    }
    return false;
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: resolveSsl(),
});

export const db = drizzle({ client: pool, schema: { ...schema, ...relations } });
