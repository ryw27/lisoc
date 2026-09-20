import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { classes, familybalancetype, seasons, student } from "@/lib/db/schema";
import { regStatusMap } from "@/lib/utils";
import { requireRole } from "@/server/auth/actions";
import ToolsTabs, { type BalanceSaveView, type RegistrationSaveView } from "./tools-tabs";

const uniq = (ids: number[]) => Array.from(new Set(ids));

// "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DD HH:mm"; the timestamps have no timezone.
const shortTs = (ts: string) => ts.replace("T", " ").slice(0, 16);

async function fetchRecycleBin() {
    const [regRows, balRows] = await Promise.all([
        db.query.registrationSave.findMany({ orderBy: (rs, { desc }) => [desc(rs.deletedon)] }),
        db.query.familybalanceSave.findMany({ orderBy: (fs, { desc }) => [desc(fs.deletedon)] }),
    ]);

    // Save tables have no FKs/relations, so resolve display names with a few IN queries.
    const studentIds = uniq(regRows.map((r) => r.studentid));
    const classIds = uniq(regRows.map((r) => r.classid));
    const seasonIds = uniq([...regRows, ...balRows].map((r) => r.seasonid));
    const typeIds = uniq(balRows.map((b) => b.typeid));

    const [students, classRows, seasonRows, typeRows] = await Promise.all([
        studentIds.length
            ? db
                  .select({
                      studentid: student.studentid,
                      namecn: student.namecn,
                      namefirsten: student.namefirsten,
                      namelasten: student.namelasten,
                  })
                  .from(student)
                  .where(inArray(student.studentid, studentIds))
            : [],
        classIds.length
            ? db
                  .select({ classid: classes.classid, classnamecn: classes.classnamecn })
                  .from(classes)
                  .where(inArray(classes.classid, classIds))
            : [],
        seasonIds.length
            ? db
                  .select({ seasonid: seasons.seasonid, seasonnamecn: seasons.seasonnamecn })
                  .from(seasons)
                  .where(inArray(seasons.seasonid, seasonIds))
            : [],
        typeIds.length
            ? db
                  .select({
                      typeid: familybalancetype.typeid,
                      typenameen: familybalancetype.typenameen,
                  })
                  .from(familybalancetype)
                  .where(inArray(familybalancetype.typeid, typeIds))
            : [],
    ]);

    const studentMap = new Map(students.map((s) => [s.studentid, s]));
    const classMap = new Map(classRows.map((c) => [c.classid, c.classnamecn]));
    const seasonMap = new Map(seasonRows.map((s) => [s.seasonid, s.seasonnamecn]));
    const typeMap = new Map(typeRows.map((t) => [t.typeid, t.typenameen]));

    const registrations: RegistrationSaveView[] = regRows.map((r) => {
        const s = studentMap.get(r.studentid);
        return {
            saveid: r.saveid,
            regid: r.regid,
            familyid: r.familyid,
            studentid: r.studentid,
            studentname: s
                ? `${s.namecn ?? ""} ${s.namefirsten ?? ""} ${s.namelasten ?? ""}`.trim()
                : `#${r.studentid}`,
            classname: classMap.get(r.classid) ?? `#${r.classid}`,
            season: seasonMap.get(r.seasonid) ?? `#${r.seasonid}`,
            status: regStatusMap[r.statusid as keyof typeof regStatusMap] ?? String(r.statusid),
            regdate: r.registerdate.slice(0, 10),
            deletedon: shortTs(r.deletedon),
            deletedby: r.deletedby ?? "",
        };
    });

    const balances: BalanceSaveView[] = balRows.map((b) => ({
        saveid: b.saveid,
        balanceid: b.balanceid,
        familyid: b.familyid,
        season: seasonMap.get(b.seasonid) ?? `#${b.seasonid}`,
        type: typeMap.get(b.typeid) ?? `#${b.typeid}`,
        amount: Number(b.totalamount),
        checkno: b.checkno ?? "",
        regdate: b.registerdate.slice(0, 10),
        paiddate: b.paiddate.startsWith("1900-01-01") ? "" : b.paiddate.slice(0, 10),
        notes: b.notes ?? "",
        deletedon: shortTs(b.deletedon),
        deletedby: b.deletedby ?? "",
    }));

    return { registrations, balances };
}

export default async function ToolsPage() {
    await requireRole(["ADMIN"]);
    const { registrations, balances } = await fetchRecycleBin();

    return (
        <div>
            <h1 className="mb-1 text-2xl font-bold">Admin Tools / 管理工具</h1>
            <p className="text-muted-foreground mb-4 text-sm">
                Records deleted from the family management page are kept here. Restore (↶) moves a
                record back to its original table; Delete (✕) removes it permanently. /
                从家庭管理页面删除的记录暂存于此：恢复(↶)将记录还原到原表，删除(✕)则永久删除。
            </p>
            <ToolsTabs registrations={registrations} balances={balances} />
        </div>
    );
}
