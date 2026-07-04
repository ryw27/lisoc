import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeChain } from "../helpers/db";

vi.mock("@/lib/db", async () => {
    const h = await import("../helpers/db");
    return { db: h.makeDb(h.ALL_TABLES).db };
});
vi.mock("@/server/auth/actions", () => ({
    requireFamily: vi.fn(),
    requireRole: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// familyRegister imports these via the relative specifier "../data", which resolves to the
// same absolute module as "@/server/registration/data"; Vitest dedupes by resolved id, so this
// mock intercepts the relative import.
vi.mock("@/server/registration/data", () => ({
    ensureTimeline: vi.fn(),
    canRegister: vi.fn(),
    getArrSeason: vi.fn(),
    getTotalPrice: vi.fn(),
}));

// Import AFTER mocks are registered.
import { db } from "@/lib/db";
import { requireFamily } from "@/server/auth/actions";
import {
    canRegister,
    ensureTimeline,
    getArrSeason,
    getTotalPrice,
} from "@/server/registration/data";
import { familyRegister } from "@/server/registration/actions/familyRegister";
import { REGSTATUS_SUBMITTED } from "@/lib/utils";
import type { familyObj, seasonObj, uiClasses } from "@/types/shared.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const tx = anyDb.__tx;
const mockRequireFamily = vi.mocked(requireFamily);
const mockEnsureTimeline = vi.mocked(ensureTimeline);
const mockCanRegister = vi.mocked(canRegister);
const mockGetArrSeason = vi.mocked(getArrSeason);
const mockGetTotalPrice = vi.mocked(getTotalPrice);

/** Make requireFamily() resolve to a caller owning `familyid`. */
function asFamily(familyid: number) {
    mockRequireFamily.mockResolvedValue({
        session: { user: { id: "u1", role: "FAMILY", name: "Fam", email: "f@x.com" } },
        family: { familyid },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

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

/** A minimal season object (only seasonid is read by the action). */
function makeSeason(seasonid = 5): seasonObj {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { seasonid } as any;
}

/** A minimal client-supplied family object. */
function makeFamily(familyid: number): familyObj {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { familyid } as any;
}

describe("familyRegister — authorization / IDOR", () => {
    beforeEach(() => {
        asFamily(1);
    });

    it("throws Forbidden when the client-supplied family is not the caller's own", async () => {
        await expect(familyRegister(makeArr(), makeSeason(5), makeFamily(999), 20)).rejects.toThrow(
            "Forbidden"
        );
        // Must fail before opening a transaction.
        expect(db.transaction).not.toHaveBeenCalled();
    });
});

describe("familyRegister — transactional validation", () => {
    beforeEach(() => {
        asFamily(1);
        // Sensible defaults; individual tests override the branch under test.
        mockEnsureTimeline.mockResolvedValue(true);
        mockCanRegister.mockResolvedValue("normal");
        mockGetArrSeason.mockResolvedValue("year");
        mockGetTotalPrice.mockResolvedValue(300);
    });

    it("throws when ensureTimeline reports a schedule conflict", async () => {
        mockEnsureTimeline.mockResolvedValue(false);
        await expect(familyRegister(makeArr(), makeSeason(5), makeFamily(1), 20)).rejects.toThrow(
            "Registered class does not fit this student's schedule"
        );
    });

    it("throws when the arrangement season does not match the passed-in season", async () => {
        await expect(
            familyRegister(makeArr({ seasonid: 999 }), makeSeason(5), makeFamily(1), 20)
        ).rejects.toThrow("Season of arrangement and passed in season do not match");
    });

    it("throws when registration is closed for the class", async () => {
        mockCanRegister.mockResolvedValue("closed");
        await expect(familyRegister(makeArr(), makeSeason(5), makeFamily(1), 20)).rejects.toThrow(
            "Registration is not currently open for this class"
        );
    });

    it("throws when the student is not in this family", async () => {
        tx.query.student.findFirst.mockResolvedValue(undefined);
        await expect(familyRegister(makeArr(), makeSeason(5), makeFamily(1), 20)).rejects.toThrow(
            "Student not found in this family"
        );
    });
});

describe("familyRegister — happy path (new balance)", () => {
    beforeEach(() => {
        asFamily(1);
        mockEnsureTimeline.mockResolvedValue(true);
        mockCanRegister.mockResolvedValue("normal");
        mockGetArrSeason.mockResolvedValue("year");
        mockGetTotalPrice.mockResolvedValue(300);

        // Student belongs to the caller's family.
        tx.query.student.findFirst.mockResolvedValue({ studentid: 20, familyid: 1 });
        // Fee schedule rows.
        tx.query.feelist.findMany.mockResolvedValue([
            { feeid: 5, feeamount: "50" },
            { feeid: 1, feeamount: "30" },
        ]);
        // No existing family balance -> the "new balance" branch runs. The select must resolve
        // to an (empty) array because the action destructures `const [existingBal] = await ...`.
        tx.select.mockReturnValueOnce(makeChain([]));
    });

    it("creates a new family balance and inserts a SUBMITTED class registration", async () => {
        // Insert order in the source: familybalance first, then classregistration.
        tx.insert.mockReturnValueOnce(makeChain([{ balanceid: 77 }]));
        tx.insert.mockReturnValueOnce(makeChain([{ regid: 123 }]));

        // The action returns its transaction result: the created family balance.
        await expect(
            familyRegister(makeArr(), makeSeason(5), makeFamily(1), 20)
        ).resolves.toMatchObject({ balanceid: 77 });

        // Two inserts: familybalance, then classregistration.
        expect(tx.insert).toHaveBeenCalledTimes(2);

        // Second insert is the class registration; verify its shape.
        const regValues = tx.insert.mock.results[1].value.values.mock.calls[0][0];
        expect(regValues).toMatchObject({
            studentid: 20,
            arrangeid: 3,
            seasonid: 5,
            classid: 7,
            statusid: REGSTATUS_SUBMITTED,
            familyid: 1,
            familybalanceid: 77,
            byadmin: false,
            isyearclass: true,
        });
    });
});
