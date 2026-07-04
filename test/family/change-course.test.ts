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
// The action imports these helpers via the relative specifier "../../data",
// which resolves to server/registration/data. Mocking the alias path
// intercepts the same resolved module.
vi.mock("@/server/registration/data", () => ({
    canTransferOutandIn: vi.fn(),
    getArrSeason: vi.fn(),
    getTotalPrice: vi.fn(),
}));

// Import AFTER mocks are registered.
import { db } from "@/lib/db";
import { requireFamily } from "@/server/auth/actions";
import { canTransferOutandIn, getArrSeason, getTotalPrice } from "@/server/registration/data";
import { familyRequestTransfer } from "@/server/registration/regchanges/actions/familyRequestTransfer";
import { REGSTATUS_REGISTERED, REGSTATUS_SUBMITTED, REQUEST_STATUS_PENDING } from "@/lib/utils";
import type { uiClasses } from "@/types/shared.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const tx = anyDb.__tx;
const mockRequireFamily = vi.mocked(requireFamily);
const mockCanTransfer = vi.mocked(canTransferOutandIn);
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

/** The destination arrangement the client asks to transfer into. */
const newArrange = {
    arrangeid: 42,
    classid: 77,
    seasonid: 9,
    closeregistration: false,
    waiveregfee: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as uiClasses;

describe("familyRequestTransfer — authorization / IDOR", () => {
    beforeEach(() => {
        asFamily(1);
        tx.query.classregistration.findFirst.mockResolvedValue(undefined);
    });

    it("rejects when the client-supplied familyid is not the caller's own family", async () => {
        // Param IDOR throw lives inside the try/catch, so it resolves to {ok:false}.
        await expect(
            familyRequestTransfer(10, 20, /* familyid */ 999, newArrange, "")
        ).resolves.toMatchObject({ ok: false, message: "Forbidden" });
        // Must fail before opening a transaction.
        expect(db.transaction).not.toHaveBeenCalled();
    });

    it("rejects when the loaded registration belongs to another family (row-level IDOR)", async () => {
        // Caller passes their OWN familyid (1) but targets a reg owned by family 2.
        tx.query.classregistration.findFirst.mockResolvedValue({
            regid: 10,
            studentid: 20,
            familyid: 2, // victim
            statusid: REGSTATUS_REGISTERED,
            seasonid: 5,
            classid: 7,
            arrangeid: 3,
        });

        await expect(
            familyRequestTransfer(10, 20, /* own */ 1, newArrange, "")
        ).resolves.toMatchObject({ ok: false, message: "Forbidden" });
    });

    it("returns a not-found result when the target registration does not exist", async () => {
        tx.query.classregistration.findFirst.mockResolvedValue(undefined);
        const res = await familyRequestTransfer(10, 20, 1, newArrange, "");
        expect(res.ok).toBe(false);
        expect(res.message).toMatch(/Did not find old class registration/);
    });

    it("returns an invalid-state result when the registration status is neither SUBMITTED nor REGISTERED", async () => {
        tx.query.classregistration.findFirst.mockResolvedValue({
            regid: 10,
            studentid: 20,
            familyid: 1,
            statusid: 999, // some other status (e.g. dropped/cancelled)
            seasonid: 5,
            classid: 7,
            arrangeid: 3,
        });
        const res = await familyRequestTransfer(10, 20, 1, newArrange, "");
        expect(res.ok).toBe(false);
        expect(res.message).toMatch(/not in a valid state/);
    });
});

describe("familyRequestTransfer — SUBMITTED (unpaid) delete path", () => {
    beforeEach(() => {
        asFamily(1);
    });

    it("deletes the old registration and inserts a negative familybalance, returning ok", async () => {
        tx.query.classregistration.findFirst.mockResolvedValue({
            regid: 10,
            studentid: 20,
            familyid: 1,
            statusid: REGSTATUS_SUBMITTED,
            seasonid: 5,
            classid: 7,
            arrangeid: 3,
            familybalanceid: 99,
        });
        tx.query.arrangement.findFirst.mockResolvedValue({
            arrangeid: 3,
            classid: 7,
            seasonid: 5,
            waiveregfee: false,
            season: { canceldeadline: "2099-01-01", earlyregdate: "2026-01-01" },
        });
        mockGetTotalPrice.mockResolvedValue(100);
        tx.delete.mockReturnValue(makeChain(undefined));
        tx.insert.mockReturnValue(makeChain(undefined));

        const res = await familyRequestTransfer(10, 20, 1, newArrange, "note");
        expect(res).toMatchObject({ ok: true });

        // The old class registration row was deleted.
        expect(tx.delete).toHaveBeenCalledTimes(1);
        // A negative familybalance (tuition removal) was inserted.
        expect(tx.insert).toHaveBeenCalledTimes(1);
        const inserted = tx.insert.mock.results[0].value.values.mock.calls[0][0];
        expect(inserted).toMatchObject({
            appliedregid: 10,
            familyid: 1,
            tuition: "-100",
        });
    });
});

describe("familyRequestTransfer — REGISTERED (paid) change-request path", () => {
    beforeEach(() => {
        asFamily(1);
    });

    it("inserts a PENDING regchangerequest for the caller's own registration", async () => {
        tx.query.classregistration.findFirst.mockResolvedValue({
            regid: 10,
            studentid: 20,
            familyid: 1,
            statusid: REGSTATUS_REGISTERED,
            seasonid: 5,
            classid: 7,
            arrangeid: 3,
            registerdate: "2026-01-01",
            familybalanceid: 99,
        });
        tx.query.arrangement.findFirst.mockResolvedValue({
            arrangeid: 3,
            classid: 7,
            seasonid: 5,
            season: { canceldeadline: "2099-01-01", earlyregdate: "2026-01-01" },
        });
        tx.query.seasons.findFirst.mockResolvedValue({ seasonid: 9 });
        mockCanTransfer.mockReturnValue(true);
        mockGetArrSeason.mockResolvedValue("year");
        tx.insert.mockReturnValue(makeChain(undefined));

        const res = await familyRequestTransfer(10, 20, 1, newArrange, "note");
        expect(res).toMatchObject({ ok: true });

        expect(tx.insert).toHaveBeenCalledTimes(1);
        const inserted = tx.insert.mock.results[0].value.values.mock.calls[0][0];
        expect(inserted).toMatchObject({
            regid: 10,
            studentid: 20,
            familyid: 1,
            classid: newArrange.classid,
            seasonid: 9,
            reqstatusid: REQUEST_STATUS_PENDING,
            isyearclass: true, // getArrSeason mocked to "year"
        });
    });
});
