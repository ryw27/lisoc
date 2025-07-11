import { seasons } from "@/app/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { db } from "@/app/lib/db";
import SemesterViewBox from "./sem-view-box";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSelectOptions } from "@/app/lib/semester/sem-actions";


type semViewProps = {
    season: InferSelectModel<typeof seasons>
}

// Data type for data table
export type studentView = {
    regid: number;
    studentid: number;
    registerDate: string; 
    dropped: studentStatus;
    familyid: number;
    namecn: string;
    namelasten: string;
    namefirsten: string;
    dob: string;
    gender: string;
    notes: string
} 

export type studentStatus = 
    | "Submitted"
    | "Registered"
    | "Dropout" 
    | "Dropout Spring"
    | "Pending Drop"
    | {}

// Start with a general class overview that is clickable. Each one expands into a data table of students
export default async function SemesterView({ season }: semViewProps) {
    // Active semester
    const classData = await db.query.arrangement.findMany({
        where: (arr, { eq }) => eq(arr.seasonid, season.seasonid),
        with: {
            class: {
                columns: {
                    classid: true,
                    classnamecn: true,
                    classnameen: true
                }
            },
            teacher: {
                columns: {
                    teacherid: true,
                    namecn: true,
                    namefirsten: true,
                    namelasten: true
                }
            }, 
            classroom: {}
        }
    });

    const selectOptions = await getSelectOptions();

    // Get student view data and transform into data table form

    const getStudents = async (classid: number) => {
        // Get all students who have registered
        const reg = await db.query.classregistration.findMany({
            where: (reg, { and, eq }) => and(eq(reg.classid, classid), eq(reg.seasonid, season.seasonid)),
            with: {
                student: {}
            }
        });

        const dataview = await Promise.all(reg.map(async (student) => {
            // TODO: More complete handling of drop/transfer status
            // Check if dropped, request status id is 2 indicating approval
            const requests = await db.query.regchangerequest.findFirst({
                where: (reg, { and, eq }) => and(eq(reg.appliedid, student.regid), eq(reg.reqstatusid, 2))
            });

            const reqStatusMap = {
                1: "Pending Drop",
                2: "Dropout",
                3: "Submitted"
            }

            const regStatusMap = {
                1: "Submitted",
                2: "Registered",
                3: "Dropout", // Shouldn't get here
                4: "Dropout",
                5: "Dropout Spring"
            }
            const status = requests ? 
                                reqStatusMap[requests.reqstatusid as 1 | 2 | 3] 
                                : regStatusMap[student.statusid as 1 | 2 | 3 | 4 | 5]

            return {
                regid: student.regid,
                studentid: student.studentid,
                registerDate: student.registerdate,
                dropped: status,
                familyid: student.familyid,
                namecn: student.student.namecn,
                namelasten: student.student.namelasten,
                namefirsten: student.student.namefirsten,
                dob: student.student.dob,
                gender: student.student.gender || "Unknown",
                notes: student.notes || ""
            } satisfies studentView
        }))

        return dataview;
    }

    // const onDrop = async (row: ColumnDef<studentView>) => {
    //     // Extract the studentView from the row
    //     const student: studentView = row.original as studentView;

    //     // You may need to provide these from your component's scope/context
    //     // For this example, we assume you have access to:
    //     // - season (current season object)
    //     // - classid (current class id)
    //     // - userId (admin user id performing the drop)
    //     // - registration (the registration record for this student in this class/season)
    //     // - regstatusid/oriregstatusid (from registration or business logic)
    //     // - isyearclass/relatedseasonid (from class or season context)
    //     // - etc.

    //     // Example: You must fill in these values from your actual data/context
    //     const registration = {
    //         regid: student.regid,
    //         appliedid: student.regid,
    //         studentid: student.studentid,
    //         seasonid: season.seasonid,
    //         isyearclass: false, // Set appropriately
    //         relatedseasonid: season.relatedseasonid ?? null,
    //         classid: student.classid ?? 0,
    //         registerdate: student.registerDate,
    //         oriregstatusid: 1, // Set appropriately
    //         regstatusid: 3, // e.g. 3 = dropped, set appropriately
    //         reqstatusid: 2, // e.g. 2 = approved, set appropriately
    //         familybalanceid: null,
    //         familyid: student.familyid,
    //         otherfee: null,
    //         newbalanceid: null,
    //         submitdate: new Date().toISOString(),
    //         processdate: null,
    //         lastmodify: new Date().toISOString(),
    //         notes: '',
    //         adminmemo: '',
    //         adminuserid: typeof userId === 'string' ? userId : '',
    //     };

    //     // Only include fields that exist in the regchangerequest table
    //     await db.insert(regchangerequest).values({
    //         regid: registration.regid,
    //         appliedid: registration.appliedid,
    //         studentid: registration.studentid,
    //         seasonid: registration.seasonid,
    //         isyearclass: registration.isyearclass,
    //         relatedseasonid: registration.relatedseasonid,
    //         classid: registration.classid,
    //         registerdate: registration.registerdate,
    //         oriregstatusid: registration.oriregstatusid,
    //         regstatusid: registration.regstatusid,
    //         reqstatusid: registration.reqstatusid,
    //         familybalanceid: registration.familybalanceid,
    //         familyid: registration.familyid,
    //         otherfee: registration.otherfee,
    //         newbalanceid: registration.newbalanceid,
    //         submitdate: registration.submitdate,
    //         processdate: registration.processdate,
    //         lastmodify: registration.lastmodify,
    //         notes: registration.notes,
    //         adminmemo: registration.adminmemo,
    //         adminuserid: registration.adminuserid,
    //     });
    // }



    return (
        <div className="container mx-auto flex flex-col">
            <h1 className="font-bold text-3xl mb-4">{season.seasonnamecn}</h1>
            <div className="flex flex-col gap-2">
                {classData.map(async (val, idx) => {
                    const studentView = await getStudents(val.classid);

                    return (
                        <SemesterViewBox
                            key={`${idx}-${val.classid}-${val.arrangeid}`}
                            data={val}
                            registrations={studentView}
                            selectOptions={selectOptions}
                        />
                    )
                })}
            </div>
        </div>
    )
}