import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import ProcessRegChange from "@/components/registration/regchanges/processRegChange";

//import { classes, familybalancetype } from "@/lib/db/schema";

const reqStatusMap = {
    1: "Pending",
    2: "Approved",
    3: "Rejected",
};

type Props = {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProcessRegChangePage({ searchParams }: Props) {
    // Await the searchParams promise to get the actual object
    const params = searchParams ? await searchParams : {};

    const familyIdRaw = params.familyid;
    const familyIdStr = Array.isArray(familyIdRaw) ? familyIdRaw[0] : (familyIdRaw ?? "0");
    const familyId = parseInt(familyIdStr) || 0;
    const requestidRaw = params.requestid;
    const requestid = Array.isArray(requestidRaw)
        ? parseInt(requestidRaw[0])
        : requestidRaw
          ? parseInt(requestidRaw)
          : 0;
    const regidRaw = params.regid;
    const regid = Array.isArray(regidRaw)
        ? parseInt(regidRaw[0])
        : regidRaw
          ? parseInt(regidRaw)
          : 0;
    const classidRaw = params.classid;
    const classid = Array.isArray(classidRaw)
        ? parseInt(classidRaw[0])
        : classidRaw
          ? parseInt(classidRaw)
          : 0;
    const seasonidRaw = params.seasonid;
    const seasonid = Array.isArray(seasonidRaw)
        ? parseInt(seasonidRaw[0])
        : seasonidRaw
          ? parseInt(seasonidRaw)
          : null;
    const relatedseasonidRaw = params.relatedseasonid;
    const relatedseasonid = Array.isArray(relatedseasonidRaw)
        ? parseInt(relatedseasonidRaw[0])
        : relatedseasonidRaw
          ? parseInt(relatedseasonidRaw)
          : null;
    const appliedidRaw = params.appliedid;
    const appliedRegId = Array.isArray(appliedidRaw)
        ? parseInt(appliedidRaw[0])
        : appliedidRaw
          ? parseInt(appliedidRaw)
          : 0;
    const statusRaw = params.status;
    const status = Array.isArray(statusRaw)
        ? parseInt(statusRaw[0])
        : statusRaw
          ? parseInt(statusRaw)
          : 1;
    const requestDateRaw = params.requestDate;
    const requestDate = Array.isArray(requestDateRaw) ? requestDateRaw[0] : (requestDateRaw ?? "");
    const parentNoteRaw = params.parentNote;
    const parentNote = Array.isArray(parentNoteRaw) ? parentNoteRaw[0] : (parentNoteRaw ?? "");
    console.log(seasonid, relatedseasonid);

    const reqStatus = reqStatusMap[status as 1 | 2 | 3];
    // 2. Get active school year
    const activeYear = await db.query.seasons.findFirst({
        where: (season, { eq }) => eq(season.status, "Active"),
        orderBy: (season, { asc }) => [asc(season.seasonid)],
    });
    if (!activeYear) {
        return <div>No active semesters. If you think this is a mistake, please contact ...</div>;
    }

    const getClassIdMap = async (): Promise<Record<number, string>> => {
        const classes = await db.query.classes.findMany({});
        return classes.reduce<Record<number, string>>((rec, cls) => {
            if (cls.classid != null && typeof cls.classnamecn === "string") {
                rec[cls.classid] = cls.classnamecn;
            }
            return rec;
        }, {});
    };

    const feeIdMap = async (): Promise<Record<number, string>> => {
        const feeTypes = await db.query.familybalancetype.findMany({});
        return feeTypes.reduce<Record<number, string>>((rec, feeType) => {
            if (
                feeType.typeid != null &&
                typeof feeType.typenameen === "string" &&
                feeType.isshow
            ) {
                rec[feeType.typeid] = feeType.typenameen;
            }
            return rec;
        }, {});
    };

    const feeTypeIdMap = await feeIdMap();

    const classIdMap = await getClassIdMap();

    // get all class registratin for the familid and active year

    const familyClassRegistrations = await db.query.classregistration.findMany({
        where: (reg, { and, eq }) =>
            and(eq(reg.familyid, familyId), eq(reg.seasonid, activeYear.seasonid)),
        with: {
            student: {},
        },
    });

    return (
        <div className="p-6">
            <div className="mb-4">
                <Link
                    href="/admin/management/regchangerequests"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to regchange list</span>
                </Link>
            </div>
            <h1 className="mb-4 text-2xl font-semibold">Process Reg Change</h1>
            {familyId ? (
                <div>
                    <p className="mb-4">
                        Family ID: <strong>{familyId}</strong>{" "}
                    </p>
                    <p className="mb-4">
                        Request ID: <strong>{requestid}</strong>{" "}
                    </p>
                    <p className="mb-4">
                        Request Date: <strong>{requestDate}</strong>{" "}
                    </p>
                    <p className="mb-4">Parent Comment : {parentNote} </p>
                    <p className="mb-4">Status : {reqStatus} </p>
                </div>
            ) : null}
            <div>
                <ProcessRegChange
                    requestId={requestid}
                    regId={regid}
                    appliedRegId={appliedRegId}
                    classId={classid}
                    familyId={familyId}
                    status={status}
                    //requestDate={requestDate}
                    registration={familyClassRegistrations}
                    //parentNote={parentNote}
                    classMap={classIdMap}
                    feeMap={feeTypeIdMap}
                />
            </div>
        </div>
    );
}
