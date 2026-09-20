import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", async () => {
    const h = await import("../helpers/db");
    const { db, tx } = h.makeDb(h.ALL_TABLES);
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
import { removeBalance } from "@/server/payments/actions";
import { removeRegistration } from "@/server/registration/actions/removeRegistration";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const tx = anyDb.__tx;
const mockRequireRole = vi.mocked(requireRole);

const regRow = {
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
};

const balanceRow = {
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
};

beforeEach(() => {
    vi.clearAllMocks();
    tx.query.classregistration.findFirst.mockResolvedValue(undefined);
    tx.query.familybalance.findFirst.mockResolvedValue(undefined);
});

describe("removeRegistration", () => {
    it("archives the row to registration_save, then deletes it, in one transaction", async () => {
        tx.query.classregistration.findFirst.mockResolvedValue(regRow);
        const order: string[] = [];
        tx.insert.mockImplementation(() => {
            order.push("insert");
            return { values: vi.fn(async () => undefined) };
        });
        tx.delete.mockImplementation(() => {
            order.push("delete");
            return { where: vi.fn(async () => undefined) };
        });

        await removeRegistration(42);

        expect(mockRequireRole).toHaveBeenCalledWith(["ADMIN"], { redirect: false });
        expect(anyDb.transaction).toHaveBeenCalledTimes(1);
        expect(order).toEqual(["insert", "delete"]);
        expect(tx.insert).toHaveBeenCalledWith(registrationSave);
        expect(tx.insert.mock.results[0].value.values).toHaveBeenCalledWith({
            ...regRow,
            deletedby: "admin@example.com",
        });
        expect(tx.delete).toHaveBeenCalledWith(classregistration);
        expect(revalidatePath).toHaveBeenCalledWith("/admin/management/99");
    });

    it("throws and writes nothing when the registration does not exist", async () => {
        await expect(removeRegistration(42)).rejects.toThrow("Registration not found");
        expect(tx.insert).not.toHaveBeenCalled();
        expect(tx.delete).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("rejects a non-positive id before touching the database", async () => {
        await expect(removeRegistration(0)).rejects.toThrow();
        expect(anyDb.transaction).not.toHaveBeenCalled();
    });

    it("propagates the auth guard's rejection", async () => {
        mockRequireRole.mockRejectedValueOnce(new Error("Access denied. Required role not found"));
        await expect(removeRegistration(42)).rejects.toThrow("Access denied");
        expect(anyDb.transaction).not.toHaveBeenCalled();
    });
});

describe("removeBalance", () => {
    it("archives the row to familybalance_save, then deletes it, in one transaction", async () => {
        tx.query.familybalance.findFirst.mockResolvedValue(balanceRow);
        const order: string[] = [];
        tx.insert.mockImplementation(() => {
            order.push("insert");
            return { values: vi.fn(async () => undefined) };
        });
        tx.delete.mockImplementation(() => {
            order.push("delete");
            return { where: vi.fn(async () => undefined) };
        });

        await removeBalance(500);

        expect(mockRequireRole).toHaveBeenCalledWith(["ADMIN"], { redirect: false });
        expect(order).toEqual(["insert", "delete"]);
        expect(tx.insert).toHaveBeenCalledWith(familybalanceSave);
        expect(tx.insert.mock.results[0].value.values).toHaveBeenCalledWith({
            ...balanceRow,
            deletedby: "admin@example.com",
        });
        expect(tx.delete).toHaveBeenCalledWith(familybalance);
        expect(revalidatePath).toHaveBeenCalledWith("/admin/management/99");
    });

    it("throws and writes nothing when the balance does not exist", async () => {
        await expect(removeBalance(500)).rejects.toThrow("No family balance found");
        expect(tx.insert).not.toHaveBeenCalled();
        expect(tx.delete).not.toHaveBeenCalled();
    });
});
