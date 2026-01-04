// import { requireRole } from "@/lib/auth/requireRole"
import { db } from "@/lib/db";
import RegChangeTable from "@/components/registration/regchanges/RegChangeTable";

export default async function RegChangeRequestPage() {
    // const user = await requireRole(["ADMIN"]);

    // Get active seasons directly - simpler approach
    const year = await db.query.seasons.findFirst({
        where: (s, { eq }) => eq(s.status, "Active"),
        orderBy: (s, { asc }) => asc(s.seasonid),
    });
    if (!year) {
        return <div className="">No active academic year</div>;
    }

    const terms = await db.query.seasons.findMany({
        where: (s, { or, eq }) =>
            or(eq(s.seasonid, year.beginseasonid), eq(s.seasonid, year.relatedseasonid)),
        orderBy: (s, { asc }) => asc(s.seasonid),
    });

    if (terms.length !== 2) {
        return <div className="">Error occurred. Please contact support.</div>;
    }

    const [fall, spring] = terms;

    const regchangerequests = await db.query.regchangerequest.findMany({
        where: (rcr, { or, eq }) =>
            or(
                eq(rcr.seasonid, year.seasonid),
                eq(rcr.seasonid, fall.seasonid),
                eq(rcr.seasonid, spring.seasonid)
            ),
        with: {
            family: {
                with: { user: {} },
            },
            student: {},
        },
        orderBy: (rcr, { asc }) => asc(rcr.requestid),
    });

    /**
     * Fetches all admin users and returns a map of adminuserid to admin name.
     * Assumes adminuser table has fields: adminuserid (number), name (string).
     */
    const getAdminIdMap = async (): Promise<Record<number, string>> => {
        const admins = await db.query.adminuser.findMany({});
        return admins.reduce<Record<number, string>>((acc, admin) => {
            if (admin.adminid != null && typeof admin.namecn === "string") {
                acc[admin.adminid] = admin.namecn;
            }
            return acc;
        }, {});
    };

    const adminMap = await getAdminIdMap();

    return (
        <div>
            <RegChangeTable requests={regchangerequests} adminMap={adminMap} />
        </div>
    );
}
