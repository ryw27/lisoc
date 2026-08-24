import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeChain } from "../helpers/db";

vi.mock("@/lib/db", async () => {
    const h = await import("../helpers/db");
    return { db: h.makeDb(h.ALL_TABLES).db };
});

// Import AFTER mocks are registered.
import { db } from "@/lib/db";
import { ensureSeats } from "@/server/registration/data";
import type { uiClasses } from "@/types/shared.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const tx = anyDb.__tx;

/** A minimal uiClasses arrangement payload. */
function makeArr(overrides: Partial<uiClasses> = {}): uiClasses {
    return {
        arrangeid: 3,
        seasonid: 5,
        classid: 7,
        teacherid: 1,
        roomid: 1,
        timeid: 10,
        seatlimit: null,
        agelimit: null,
        suitableterm: 1,
        waiveregfee: false,
        closeregistration: false,
        tuitionW: "300",
        specialfeeW: "0",
        bookfeeW: "20",
        tuitionH: "150",
        specialfeeH: "0",
        bookfeeH: "10",
        isregclass: true,
        notes: null,
        ...overrides,
    };
}

/**
 * Queue the two selects ensureSeats issues: the FOR UPDATE lock on the arrangement row, then
 * the count of active registrations. Returns the lock chain so tests can assert on it.
 */
function queueSelects(taken: number) {
    const lockChain = makeChain(undefined);
    tx.select.mockReturnValueOnce(lockChain);
    tx.select.mockReturnValueOnce(makeChain([{ count: taken }]));
    return lockChain;
}

describe("ensureSeats", () => {
    beforeEach(() => {
        tx.select.mockReset();
    });

    it("treats a null seatlimit as unlimited without querying", async () => {
        await expect(ensureSeats(tx, makeArr({ seatlimit: null }), 5)).resolves.toBe(true);
        expect(tx.select).not.toHaveBeenCalled();
    });

    it("treats a zero seatlimit as unlimited without querying", async () => {
        await expect(ensureSeats(tx, makeArr({ seatlimit: 0 }), 5)).resolves.toBe(true);
        expect(tx.select).not.toHaveBeenCalled();
    });

    it("allows registration while active registrations are below the seat limit", async () => {
        queueSelects(19);
        await expect(ensureSeats(tx, makeArr({ seatlimit: 20 }), 5)).resolves.toBe(true);
    });

    it("rejects registration once active registrations reach the seat limit", async () => {
        queueSelects(20);
        await expect(ensureSeats(tx, makeArr({ seatlimit: 20 }), 5)).resolves.toBe(false);
    });

    it("rejects registration when the class is already over its seat limit", async () => {
        queueSelects(25);
        await expect(ensureSeats(tx, makeArr({ seatlimit: 20 }), 5)).resolves.toBe(false);
    });

    it("locks the arrangement row FOR UPDATE before counting", async () => {
        const lockChain = queueSelects(0);
        await ensureSeats(tx, makeArr({ seatlimit: 20 }), 5);
        expect(lockChain.for).toHaveBeenCalledWith("update");
    });

    it("throws when the arrangement id is missing", async () => {
        await expect(
            ensureSeats(tx, makeArr({ arrangeid: undefined, seatlimit: 20 }), 5)
        ).rejects.toThrow("Arrangement id missing for registration");
        expect(tx.select).not.toHaveBeenCalled();
    });
});
