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

// Import AFTER mocks are registered.
import { db } from "@/lib/db";
import { requireFamily } from "@/server/auth/actions";
import { familyRequestDrop } from "@/server/registration/regchanges/actions/familyRequestDrop";
import {
    REGSTATUS_DROPOUT,
    REGSTATUS_REGISTERED,
    REGSTATUS_SUBMITTED,
    REQUEST_STATUS_PENDING,
} from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const tx = anyDb.__tx;
const mockRequireFamily = vi.mocked(requireFamily);

/** Make requireFamily() resolve to a caller owning `familyid`. */
function asFamily(familyid: number) {
    mockRequireFamily.mockResolvedValue({
        session: { user: { id: "u1", role: "FAMILY", name: "Fam", email: "f@x.com" } },
        family: { familyid },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

describe("familyRequestDrop — authorization / IDOR", () => {
    beforeEach(() => {
        asFamily(1);
        // Default: no registration found unless a test overrides it.
        tx.query.classregistration.findFirst.mockResolvedValue(undefined);
    });

    it("rejects when the client-supplied familyid is not the caller's own family", async () => {
        await expect(familyRequestDrop(10, 20, /* familyid */ 999, false, "")).rejects.toThrow(
            "Forbidden"
        );
        // Must fail before touching the DB.
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

        await expect(familyRequestDrop(10, 20, /* own */ 1, true, "")).rejects.toThrow("Forbidden");
    });

    it("throws when the target registration does not exist", async () => {
        tx.query.classregistration.findFirst.mockResolvedValue(undefined);
        await expect(familyRequestDrop(10, 20, 1, false, "")).rejects.toThrow(
            /Did not find old class registration/
        );
    });
});

describe("familyRequestDrop — happy path (REGISTERED, override)", () => {
    beforeEach(() => {
        asFamily(1);
    });

    it("inserts a PENDING drop change-request for the caller's own registration", async () => {
        tx.query.classregistration.findFirst.mockResolvedValue({
            regid: 10,
            studentid: 20,
            familyid: 1, // caller owns it
            statusid: REGSTATUS_REGISTERED,
            seasonid: 5,
            classid: 7,
            arrangeid: 3,
            isyearclass: false,
            registerdate: "2026-01-01",
            familybalanceid: 99,
        });
        tx.query.arrangement.findFirst.mockResolvedValue({
            arrangeid: 3,
            classid: 7,
            seasonid: 5,
            season: { canceldeadline: "2099-01-01", earlyregdate: "2026-01-01" },
        });
        tx.insert.mockReturnValue(makeChain(undefined));

        await expect(
            familyRequestDrop(10, 20, 1, /* override */ true, "note")
        ).resolves.toBeUndefined();

        // A regchangerequest insert happened with PENDING status + the caller's familyid.
        expect(tx.insert).toHaveBeenCalled();
        const valuesCall = tx.insert.mock.results[0].value.values.mock.calls[0][0];
        expect(valuesCall).toMatchObject({
            regid: 10,
            studentid: 20,
            familyid: 1,
            reqstatusid: REQUEST_STATUS_PENDING,
        });
    });
});

// Sanity: exported status constants are what the assertions above assume.
describe("status constants", () => {
    it("are distinct", () => {
        expect(new Set([REGSTATUS_SUBMITTED, REGSTATUS_REGISTERED, REGSTATUS_DROPOUT]).size).toBe(
            3
        );
    });
});
