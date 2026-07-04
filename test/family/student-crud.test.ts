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
import { requireFamily, requireRole } from "@/server/auth/actions";
import {
    createStudent,
    getFammilyStudent,
    removeStudent,
    updateFamily,
} from "@/server/familymanagement/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const tx = anyDb.__tx;
const mockRequireFamily = vi.mocked(requireFamily);
const mockRequireRole = vi.mocked(requireRole);

/** requireFamily() resolves to a caller owning `familyid`. */
function asFamily(familyid: number) {
    mockRequireFamily.mockResolvedValue({
        session: { user: { id: "u1", role: "FAMILY", name: "Fam", email: "f@x.com" } },
        family: { familyid },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

/** requireRole() resolves to a FAMILY session (and wires requireFamily too). */
function roleFamily(familyid: number) {
    mockRequireRole.mockResolvedValue({
        user: { id: "u1", role: "FAMILY", name: "Fam", email: "f@x.com" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    asFamily(familyid);
}

/** requireRole() resolves to an ADMIN session (no family ownership). */
function roleAdmin() {
    mockRequireRole.mockResolvedValue({
        user: { id: "a1", role: "ADMIN", name: "Admin", email: "a@x.com" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

/** A student payload that passes studentSchema.parse (Chinese name + gender). */
function validStudentInput(familyid: number) {
    return {
        familyid,
        namecn: "小明",
        gender: "Male" as const,
        dob: new Date("2015-01-01T00:00:00Z"),
        active: true,
        notes: "",
    };
}

/** A family payload with the fields updateFamily reads (no schema.parse in the action). */
function validFamilyInput() {
    return {
        fathernamecn: "父",
        fatherfirsten: "",
        fatherlasten: "",
        mothernamecn: "母",
        motherfirsten: "",
        motherlasten: "",
        address: "1 Main St",
        phone: "5551234",
        phonealt: "5555678",
        emailalt: "alt@example.com",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
}

describe("createStudent", () => {
    beforeEach(() => {
        asFamily(1);
        tx.query.student.findMany.mockResolvedValue([]);
    });

    it("rejects when the client-supplied familyid is not the caller's own family (IDOR)", async () => {
        await expect(createStudent(validStudentInput(999), 999, -1)).rejects.toThrow("Forbidden");
        // Must fail before touching the DB / transaction.
        expect(db.transaction).not.toHaveBeenCalled();
    });

    it("throws when modifying a student that is not in the family's list", async () => {
        // curStudents does not contain studentid 42.
        tx.query.student.findMany.mockResolvedValue([{ studentid: 7, familyid: 1 }]);
        await expect(createStudent(validStudentInput(1), 1, 42)).rejects.toThrow(
            "Student to update not found"
        );
    });

    it("adds a new student (studentid === -1) and returns the inserted row", async () => {
        tx.query.student.findMany.mockResolvedValue([]);
        const inserted = { studentid: 10, familyid: 1, studentno: "1", namecn: "小明" };
        tx.insert.mockReturnValue(makeChain([inserted]));

        const result = await createStudent(validStudentInput(1), 1, -1);

        expect(result).toEqual(inserted);
        expect(tx.insert).toHaveBeenCalled();
        // studentno computed from curStudents.length + 1.
        const valuesArg = tx.insert.mock.results[0].value.values.mock.calls[0][0];
        expect(valuesArg).toMatchObject({ familyid: 1, studentno: "1", namecn: "小明" });
    });

    it("modifies an existing student and returns the reloaded row", async () => {
        const existing = { studentid: 5, familyid: 1, namecn: "旧名" };
        tx.query.student.findMany.mockResolvedValue([existing]);
        tx.update.mockReturnValue(makeChain(undefined));

        const result = await createStudent(validStudentInput(1), 1, 5);

        expect(tx.update).toHaveBeenCalled();
        expect(result).toEqual(existing);
    });
});

describe("getFammilyStudent", () => {
    it("rejects a FAMILY caller reading another family's students (IDOR)", async () => {
        roleFamily(1);
        await expect(getFammilyStudent(999)).rejects.toThrow("Forbidden");
        expect(db.query.student.findMany).not.toHaveBeenCalled();
    });

    it("returns the caller's own students for a matching FAMILY", async () => {
        roleFamily(1);
        const rows = [{ studentid: 1, familyid: 1 }];
        anyDb.query.student.findMany.mockResolvedValue(rows);

        const result = await getFammilyStudent(1);
        expect(result).toEqual(rows);
    });

    it("allows ADMIN to read any family's students (no ownership check)", async () => {
        roleAdmin();
        const rows = [{ studentid: 2, familyid: 42 }];
        anyDb.query.student.findMany.mockResolvedValue(rows);

        const result = await getFammilyStudent(42);
        expect(result).toEqual(rows);
        expect(mockRequireFamily).not.toHaveBeenCalled();
    });
});

describe("removeStudent", () => {
    it("throws when the student does not exist", async () => {
        roleFamily(1);
        anyDb.query.student.findFirst.mockResolvedValue(undefined);
        await expect(removeStudent(123)).rejects.toThrow("Student not found");
    });

    it("rejects when a FAMILY caller targets a student owned by another family (IDOR)", async () => {
        roleFamily(1);
        anyDb.query.student.findFirst.mockResolvedValue({ studentid: 20, familyid: 2 });
        await expect(removeStudent(20)).rejects.toThrow("Forbidden");
        expect(db.delete).not.toHaveBeenCalled();
    });

    it("throws when the student has registration history", async () => {
        roleFamily(1);
        anyDb.query.student.findFirst.mockResolvedValue({ studentid: 20, familyid: 1 });
        anyDb.query.classregistration.findMany.mockResolvedValue([{ regid: 99, studentid: 20 }]);
        await expect(removeStudent(20)).rejects.toThrow(
            /Cannot delete student with registration history/
        );
        expect(db.delete).not.toHaveBeenCalled();
    });

    it("deletes a student the caller owns with no registrations", async () => {
        roleFamily(1);
        anyDb.query.student.findFirst.mockResolvedValue({ studentid: 20, familyid: 1 });
        anyDb.query.classregistration.findMany.mockResolvedValue([]);
        anyDb.delete.mockReturnValue(makeChain(undefined));

        await expect(removeStudent(20)).resolves.toBeUndefined();
        expect(db.delete).toHaveBeenCalled();
    });
});

describe("updateFamily", () => {
    it("rejects a FAMILY caller updating another family (IDOR)", async () => {
        roleFamily(1);
        await expect(updateFamily(validFamilyInput(), 999)).rejects.toThrow("Forbidden");
        expect(db.update).not.toHaveBeenCalled();
    });

    it("updates the family for a matching FAMILY caller", async () => {
        roleFamily(1);
        anyDb.update.mockReturnValue(makeChain(undefined));

        await expect(updateFamily(validFamilyInput(), 1)).resolves.toBeUndefined();
        expect(db.update).toHaveBeenCalled();
    });
});
