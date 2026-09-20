import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", async () => {
    const h = await import("../helpers/db");
    const { db, tx } = h.makeDb([...h.ALL_TABLES, "registrationSave", "familybalanceSave"]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).__tx = tx;
    return { db };
});

vi.mock("@/server/auth/actions", () => ({
    requireRole: vi.fn(async () => ({
        user: { id: "admin-1", email: "admin@example.com", role: "ADMIN" },
    })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Import AFTER mocks are registered.
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
    classregistration,
    familybalance,
    familybalanceSave,
    registrationSave,
} from "@/lib/db/schema";
import { requireRole } from "@/server/auth/actions";
import {
    purgeBalance,
    purgeRegistration,
    restoreBalance,
    restoreRegistration,
} from "@/server/tools/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const tx = anyDb.__tx;
const mockRequireRole = vi.mocked(requireRole);

const savedReg = {
    saveid: 5,
    regid: 42,
    appliedid: 0,
    studentid: 7,
    arrangeid: 3,
    seasonid: 62,
    isyearclass: false,
    classid: 11,
    registerdate: "2026-09-01 10:00:00",
    statusid: 2,
    previousstatusid: 0,
    familybalanceid: 500,
    familyid: 99,
    newbalanceid: 0,
    isdropspring: false,
    byadmin: false,
    userid: "0",
    lastmodify: "1900-01-01 00:00:00",
    notes: null,
    deletedon: "2026-09-19 12:00:00",
    deletedby: "admin@example.com",
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { saveid: _s, deletedon: _d, deletedby: _b, ...regRowOnly } = savedReg;

const savedBal = {
    saveid: 9,
    balanceid: 500,
    familyid: 99,
    seasonid: 62,
    totalamount: "-120.00",
    typeid: 2,
    statusid: 2,
    registerdate: "2026-09-01 10:00:00",
    lastmodify: "2026-09-01 10:00:00",
    paiddate: "1900-01-01 00:00:00",
    notes: null,
    deletedon: "2026-09-19 12:00:00",
    deletedby: "admin@example.com",
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { saveid: _s2, deletedon: _d2, deletedby: _b2, ...balRowOnly } = savedBal;

/** insert() builder that records overridingSystemValue()/values() calls. */
function insertBuilder(calls: { override: boolean; values: unknown }[]) {
    return () => {
        const rec = { override: false, values: undefined as unknown };
        calls.push(rec);
        const b = {
            overridingSystemValue: vi.fn(() => {
                rec.override = true;
                return b;
            }),
            values: vi.fn(async (v: unknown) => {
                rec.values = v;
            }),
        };
        return b;
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    tx.query.registrationSave.findFirst.mockResolvedValue(undefined);
    tx.query.familybalanceSave.findFirst.mockResolvedValue(undefined);
    tx.query.classregistration.findFirst.mockResolvedValue(undefined);
    tx.query.familybalance.findFirst.mockResolvedValue(undefined);
    tx.delete.mockImplementation(() => ({ where: vi.fn(async () => undefined) }));
});

describe("restoreRegistration", () => {
    it("re-inserts the row with OVERRIDING SYSTEM VALUE and removes it from the bin", async () => {
        tx.query.registrationSave.findFirst.mockResolvedValue(savedReg);
        const inserts: { override: boolean; values: unknown }[] = [];
        tx.insert.mockImplementation(insertBuilder(inserts));

        await restoreRegistration(5);

        expect(mockRequireRole).toHaveBeenCalledWith(["ADMIN"], { redirect: false });
        expect(tx.insert).toHaveBeenCalledWith(classregistration);
        expect(inserts).toEqual([{ override: true, values: regRowOnly }]);
        expect(tx.delete).toHaveBeenCalledWith(registrationSave);
        expect(revalidatePath).toHaveBeenCalledWith("/admin/other/tools");
        expect(revalidatePath).toHaveBeenCalledWith("/admin/management/99");
    });

    it("refuses when the original regid already exists", async () => {
        tx.query.registrationSave.findFirst.mockResolvedValue(savedReg);
        tx.query.classregistration.findFirst.mockResolvedValue({ regid: 42 });

        await expect(restoreRegistration(5)).rejects.toThrow("already exists");
        expect(tx.insert).not.toHaveBeenCalled();
        expect(tx.delete).not.toHaveBeenCalled();
    });

    it("throws when the archived row is missing", async () => {
        await expect(restoreRegistration(5)).rejects.toThrow("Archived registration not found");
        expect(tx.insert).not.toHaveBeenCalled();
    });
});

describe("restoreBalance", () => {
    it("re-inserts the row with OVERRIDING SYSTEM VALUE and removes it from the bin", async () => {
        tx.query.familybalanceSave.findFirst.mockResolvedValue(savedBal);
        const inserts: { override: boolean; values: unknown }[] = [];
        tx.insert.mockImplementation(insertBuilder(inserts));

        await restoreBalance(9);

        expect(tx.insert).toHaveBeenCalledWith(familybalance);
        expect(inserts).toEqual([{ override: true, values: balRowOnly }]);
        expect(tx.delete).toHaveBeenCalledWith(familybalanceSave);
        expect(revalidatePath).toHaveBeenCalledWith("/admin/management/99");
    });

    it("refuses when the original balanceid already exists", async () => {
        tx.query.familybalanceSave.findFirst.mockResolvedValue(savedBal);
        tx.query.familybalance.findFirst.mockResolvedValue({ balanceid: 500 });

        await expect(restoreBalance(9)).rejects.toThrow("already exists");
        expect(tx.insert).not.toHaveBeenCalled();
    });
});

/** delete() builder whose .returning() resolves to `rows`. */
function deleteBuilder(rows: unknown[]) {
    return () => {
        const b = {
            where: vi.fn(() => b),
            returning: vi.fn(async () => rows),
        };
        return b;
    };
}

describe("purgeRegistration", () => {
    it("deletes the archived row permanently (no transaction, no re-insert)", async () => {
        anyDb.delete.mockImplementation(deleteBuilder([{ saveid: 5 }]));

        await purgeRegistration(5);

        expect(mockRequireRole).toHaveBeenCalledWith(["ADMIN"], { redirect: false });
        expect(anyDb.delete).toHaveBeenCalledWith(registrationSave);
        expect(anyDb.insert).not.toHaveBeenCalled();
        expect(tx.insert).not.toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith("/admin/other/tools");
    });

    it("throws when nothing was deleted", async () => {
        anyDb.delete.mockImplementation(deleteBuilder([]));
        await expect(purgeRegistration(5)).rejects.toThrow("Archived registration not found");
        expect(revalidatePath).not.toHaveBeenCalled();
    });
});

describe("purgeBalance", () => {
    it("deletes the archived row permanently", async () => {
        anyDb.delete.mockImplementation(deleteBuilder([{ saveid: 9 }]));

        await purgeBalance(9);

        expect(anyDb.delete).toHaveBeenCalledWith(familybalanceSave);
        expect(revalidatePath).toHaveBeenCalledWith("/admin/other/tools");
    });

    it("throws when nothing was deleted", async () => {
        anyDb.delete.mockImplementation(deleteBuilder([]));
        await expect(purgeBalance(9)).rejects.toThrow("Archived balance not found");
    });
});
