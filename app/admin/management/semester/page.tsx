import Logo from "@/components/logo";
import SemesterView from "@/components/registration/admin/sem-view";
import { db } from "@/lib/db";
import { arrangement, classes, classregistration, student } from "@/lib/db/schema";
import {
    REGSTATUS_DROPOUT,
    REGSTATUS_DROPOUT_SPRING,
    REGSTATUS_REGISTERED,
    REGSTATUS_SUBMITTED,
} from "@/lib/utils";
import { getSelectOptions } from "@/server/seasons/actions/getSelectOptions";
import fetchCurrentSeasons from "@/server/seasons/data";
import {
    type adminStudentView,
    type fullClassStudents,
    type fullRegClass,
    type fullSemClassesData,
} from "@/types/registration.types";
import { type Transaction } from "@/types/server.types";
import { type arrangeClasses, type uiClassKey } from "@/types/shared.types";
import { asc, eq, getTableColumns, InferSelectModel, or, sql } from "drizzle-orm";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default async function SemesterPage() {
    // TODO: MAke sure this finds the academic year, not the semesters
    const seasons = await fetchCurrentSeasons();


/*    const activeYear = await db.query.seasons.findFirst({
        where: (seasons, { eq }) => eq(seasons.status, "Active"),
        orderBy: (seasons, { asc }) => asc(seasons.seasonid),
    });
*/
    const activeYear = seasons.year;

    if (!activeYear) {
        return (
            <div className="flex flex-col">
                <h1 className="mb-6 text-3xl font-bold">Current academic year</h1>
                <div className="flex min-h-full flex-col items-center justify-center p-8">
                    <div className="flex max-w-md flex-col items-center space-y-6 text-center">
                        <Logo />
                        <h2 className="text-2xl font-semibold text-gray-800">
                            No active academic years
                        </h2>
                        <p className="text-gray-600">
                            There are no current active academic years. Get started by starting an
                            academic year
                        </p>
                        <Link
                            href="semester/start-semester"
                            // Theme: Navy Primary -> Gold Hover, Sharp Corners, Uppercase Text
                            className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-none px-4 py-2 text-sm font-bold tracking-wider uppercase shadow-sm transition-colors"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Start academic year
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

/*    const terms = await db.query.seasons.findMany({
        where: (s, { and, eq }) =>
            and(
                eq(s.beginseasonid, activeYear.beginseasonid),
                eq(s.relatedseasonid, 0)
            ),
        orderBy: (s, { asc }) => asc(s.seasonid),
    });

    if (terms.length !== 2) {
        return <div>Error occured. Please report.</div>;
    }
*/
    const { year, fall, spring } = { year: activeYear, fall: seasons.fall, spring: seasons.spring };

    // All reg classes for the year, both full, fall, and spring
    /*    const classData = await db.query.arrangement.findMany({
            where: (arr, { and, or, eq }) => and(
                or(eq(arr.seasonid, year.seasonid), eq(arr.seasonid, fall.seasonid), eq(arr.seasonid, spring.seasonid)),
                eq(arr.isregclass, true)
            ),
            with: {
                    class: {
                        columns:{classno: true }
                    },
            },
            orderBy: (arr, { asc }) => [asc(arr.arrangeid)]
        });
    */

    // same grade class and type will be grouped together to become classkey
    const allClassData = await db
        .select({
            ...getTableColumns(arrangement),
            classkey: sql<number>`(CAST(${classes.classno} AS INTEGER)+100)*1000+CAST(${classes.typeid} AS INTEGER)`,
        })
        .from(arrangement)
        .innerJoin(classes, eq(arrangement.classid, classes.classid))
        .where(
            or(
                eq(arrangement.seasonid, year.seasonid),
                eq(arrangement.seasonid, fall.seasonid),
                eq(arrangement.seasonid, spring.seasonid)
            )
        )
        .orderBy(asc(classes.classno), asc(arrangement.arrangeid));

    const classDataMap: Map<number, (InferSelectModel<typeof arrangement> & uiClassKey)[]> =
        new Map();

    for (const classItem of allClassData) {
        const bucket = classDataMap.get(classItem.classkey);
        if (!bucket) {
            classDataMap.set(classItem.classkey, [classItem]);
        } else {
            bucket.push(classItem);
        }
    }

    const gradeClass: (InferSelectModel<typeof arrangement> & uiClassKey)[][] = [];
    const sortdGradeClasses = Array.from(classDataMap.keys()).sort((a, b) => a - b);
    for (const classkey of sortdGradeClasses) {
        const classItems = classDataMap.get(classkey);
        if (classItems) {
            gradeClass.push(classItems);
        }
    }

    // TODO: type student better if you want lol
    const getStudentView = async (
        studentReg: InferSelectModel<typeof classregistration> & {
            student: InferSelectModel<typeof student>;
        }
    ) => {
        // TODO: More complete handling of whether a drop/transfer has occured
        // Check if dropped, request status id is 2 indicating approval
        // const requests = await db.query.regchangerequest.findFirst({
        //     where: (reg, { and, eq }) => and(eq(reg.appliedid, studentReg.regid), eq(reg.reqstatusid, 2))
        // });
        // const reqStatusMap = {
        //     1: "Pending Drop",
        //     2: "Dropout",
        //     3: "Submitted"
        // }
        const regStatusMap = {
            1: "Submitted",
            2: "Registered",
            3: "Transferred", // Shouldn't get here
            4: "Dropout",
            5: "Dropout Spring",
        };
        // const status = requests ?
        //                 reqStatusMap[requests.reqstatusid as 1 | 2 | 3]
        //                 : regStatusMap[studentReg.statusid as 1 | 2 | 3 | 4 | 5]
        const status = regStatusMap[studentReg.statusid as 1 | 2 | 3 | 4 | 5]; // The current regstatus ids we have

        return {
            regid: studentReg.regid,
            studentid: studentReg.studentid,
            registerDate: studentReg.registerdate,
            status: status,
            familyid: studentReg.familyid,
            namecn: studentReg.student.namecn,
            namelasten: studentReg.student.namelasten,
            namefirsten: studentReg.student.namefirsten,
            dob: studentReg.student.dob,
            gender: studentReg.student.gender || "Unknown",
            notes: studentReg.notes || "",
            classid: studentReg.classid,
        } satisfies adminStudentView;
    };

    const splitStudents = async (
        tx: Transaction,
        curClass: InferSelectModel<typeof arrangement> & uiClassKey
    ) => {
        const regClassStudents = await tx.query.classregistration.findMany({
            where: (studentreg, { and, or, eq }) =>
                and(
                    eq(studentreg.classid, curClass.classid),
                    eq(studentreg.seasonid, curClass.seasonid),
                    or(
                        eq(studentreg.statusid, REGSTATUS_SUBMITTED),
                        eq(studentreg.statusid, REGSTATUS_REGISTERED)
                    )
                ),
            with: {
                student: {
                    with: {
                        family: true,
                    },
                },
            },
        });

        // Get the drops
        const droppedStudents = await tx.query.classregistration.findMany({
            where: (studentreg, { and, or, eq }) =>
                and(
                    eq(studentreg.classid, curClass.classid),
                    eq(studentreg.seasonid, curClass.seasonid),
                    or(
                        //eq(studentreg.statusid, REGSTATUS_TRANSFERRED),
                        eq(studentreg.statusid, REGSTATUS_DROPOUT),
                        eq(studentreg.statusid, REGSTATUS_DROPOUT_SPRING)
                    )
                ),
            with: {
                student: {
                    with: {
                        family: true,
                    },
                },
            },
        });
        const [droppedStudentViews, regStudentViews] = await Promise.all([
            Promise.all(droppedStudents.map((c) => getStudentView(c))),
            Promise.all(regClassStudents.map((c) => getStudentView(c))),
        ]);

        return [droppedStudentViews, regStudentViews];
    };

    // Get student view data and transform into data table form
    const getStudentsAndClassrooms = async (
        regClass: (InferSelectModel<typeof arrangement> & uiClassKey)[]
    ): Promise<fullRegClass> => {
        // Get the students who have registered. These are attached to regclasses like 3R because of how we queried for classData 13 lines up.
        // This is done pre or post dispersal. All registrations are first sent to R classes.
        return await db.transaction(async (tx) => {
            if (regClass.length == 0) {
                throw new Error("No reg class found");
            }
            const allDropped = [];
            const constituentClassObjs = [];

            const constiuentClassrooms = await tx.query.classes.findMany({
                //                where: (classes, { eq }) => eq (classes.classno, String(regClass[0].classno)),
                where: (classes, { eq, and }) =>
                    and(
                        eq(classes.classno, String(Math.trunc(regClass[0].classkey / 1000) - 100)),
                        eq(classes.typeid, regClass[0].classkey % 1000)
                    ),

                columns: {
                    classid: true,
                    classnamecn: true,
                    description: true,
                },
            });

            const [regDroppedStudents, regStudentViews] = await splitStudents(tx, regClass[0]);
            // 2. Get student views for dropped students and students in reg.
            // We have to run this for every class because students can drop while in reg class or any other constituent class

            allDropped.push(...regDroppedStudents);

            for (let index = 1; index < regClass.length; index++) {
                // constituent classes
                const specificArrangement = regClass[index];

                const [droppedStudentViews, classStudentViews] = await splitStudents(
                    tx,
                    specificArrangement
                );
                // 6. Do this for the constituent classroom
                const classObj = {
                    arrinfo: specificArrangement,
                    students: classStudentViews,
                } satisfies fullClassStudents;

                constituentClassObjs.push(classObj);
                allDropped.push(...droppedStudentViews);
            }

            // 3. Get the specific classes of this reg class, i.e. 3A, 3B, 3C
            // Check which classes have regclassid as a gradeclassid.
            /*const constiuentClassrooms = await tx.query.classes.findMany({
                where: (classes, { eq }) => eq(classes.gradeclassid, regClass.classid),
                columns: {
                    classid: true
                }
            });*/

            /* const constiuentClassrooms = await tx.query.classes.findMany({
                 where: (classes, { eq }) => eq(classes.classno, regClass.class.classno),
                 columns: {
                     classid: true,
                     classnamecn: true,
                     description: true
                 }
             });
 
             
             // 4. Set up constituent classrooms as a list and loop
             //const constituentClassObjs = []
 
             for (const gradeClass of constiuentClassrooms) {
                 // 5. Find the arrangement in the academic year or the semester
                 if (gradeClass.classid == regClass.classid) {
                     // it is the same class, skip
                     continue;
                 }
                 const specificArrangement = await tx.query.arrangement.findFirst({
                     where: (arr, { eq, and }) => and(
                         eq(arr.classid, gradeClass.classid), 
                         eq(arr.seasonid, regClass.seasonid) // Must have the same season 
                     )
                 });
                 if (!specificArrangement) {
                     continue;
                 }
                 // 6. Do this for the constituent classroom
                 const [droppedStudentViews, classStudentViews] = await splitStudents(tx, specificArrangement);
                 // 7. Create class obj
                 const classObj = {
                     arrinfo: specificArrangement,
                     students: classStudentViews,
                 } satisfies fullClassStudents
 
                 // 8. Push the values into the arrays
                 constituentClassObjs.push(classObj);
                 allDropped.push(...droppedStudentViews);
             }
             */
            const regClassIds = new Set(regClass.map((c) => c.classid));

            const dataview = {
                arrinfo: regClass[0],
                students: regStudentViews,
                classrooms: constituentClassObjs,
                availablerooms: constiuentClassrooms.filter(
                    (item) => !regClassIds.has(item.classid)
                ),
                dropped: allDropped,
            } satisfies fullRegClass;

            return dataview;
        });
    };

    // Fetch all student data upfront
    const classDataWithStudents: fullSemClassesData = await Promise.all(
        gradeClass.map((classItems) => {
            const regClassInfo = getStudentsAndClassrooms(classItems);
            return regClassInfo;
        })
    );

    // console.log(classDataWithStudents);

    const { options, idMaps } = await getSelectOptions();

    const threeTerms = { year: year, fall: fall, spring: spring };

    const allCurClasses = allClassData.map((classItem) => {
        const classid = classItem.classid;
        const cls = options.classes.find((cls) => cls.classid === classid);
        return {
            arrangeid: classItem.arrangeid,
            seasonid: classItem.seasonid,
            classid: cls ? cls.classid : -1,
            classnamecn: cls ? cls.classnamecn : "unknown",
            typeid: cls ? cls.typeid : -1,
            classno: parseInt(cls ? cls.classno : "-1"),
            description: cls?.description,
        } as arrangeClasses;
    });
    return (
        <SemesterView
            academicYear={threeTerms}
            fullData={classDataWithStudents}
            selectOptions={options}
            idMaps={idMaps}
            allClasses={allCurClasses}
        />
    );
}
