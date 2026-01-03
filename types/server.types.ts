import { db } from "@/lib/db";

export type Transaction = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];
export type dbClient = Transaction | typeof db;
