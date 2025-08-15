import { db } from "@/lib/db";
import Logo from "@/components/logo";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import SemesterView from "@/components/registration/admin/sem-view";
import { getSelectOptions } from "@/lib/registration/semester";
import { type Transaction } from "@/lib/registration/helpers";
import { type adminStudentView, type fullSemClassesData, fullClassStudents, fullRegClass } from "@/lib/registration/types";
import { InferSelectModel } from "drizzle-orm";
import { arrangement, classregistration, student } from "@/lib/db/schema";
import { REGSTATUS_DROPOUT, REGSTATUS_DROPOUT_SPRING, REGSTATUS_REGISTERED, REGSTATUS_SUBMITTED, REGSTATUS_TRANSFERRED } from "@/lib/utils";


export default async function SemesterPage() {
    // TODO: MAke sure this finds the academic year, not the semesters
    const activeYear = await db.query.seasons.findFirst({
        where: (seasons, { eq }) => eq(seasons.status, "Active"),
        orderBy: (seasons, { asc }) => asc(seasons.seasonid)
    });

    if (!activeYear) {
        return (
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold mb-6">
                    Current academic year 
                </h1>
                <div className="flex flex-col items-center justify-center min-h-full p-8">
                    <div className="flex flex-col items-center space-y-6 max-w-md text-center">
                        <Logo />
                        <h2 className="text-2xl font-semibold text-gray-800">
                            No active academic years
                        </h2>
                        <p className="text-gray-600">
                            There are no current active academic years. Get started by starting an academic year 
                        </p>
                        <Link 
                            href="semester/start-semester"
                            className="flex items-center px-4 py-2 gap-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            <PlusIcon className="w-5 h-5" /> Start academic year 
                        </Link>
                    </div>
                </div>
            </div>
        )
    } 

    const terms = await db.query.seasons.findMany({
        where: (s, { or, eq }) => or(
            eq(s.seasonid, activeYear.beginseasonid),
            eq(s.seasonid, activeYear.relatedseasonid)
        ),
        orderBy: (s, { asc }) => asc(s.seasonid)
    });

    if (terms.length !== 2) {
        return (
            <div>
                Error occured. Please report.
            </div>
        )
    }

    const { year, fall, spring } = { year: activeYear, fall: terms[0], spring: terms[1] };


    // All reg classes for the year, both full, fall, and spring
    const classData = await db.query.arrangement.findMany({
        where: (arr, { and, or, eq }) => and(
            or(eq(arr.seasonid, year.seasonid), eq(arr.seasonid, fall.seasonid), eq(arr.seasonid, spring.seasonid)),
            eq(arr.isregclass, true)
        ),
        orderBy: (arr, { asc }) => [asc(arr.arrangeid)]
    });

    // TODO: type student better if you want lol
    const getStudentView = async (studentReg: InferSelectModel<typeof classregistration> & { student: InferSelectModel<typeof student> } ) => {
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
            5: "Dropout Spring"
        }
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
            notes: studentReg.notes || ""
        } satisfies adminStudentView;
    }

    const splitStudents = async (tx: Transaction, curClass: InferSelectModel<typeof arrangement>) => {
        const regClassStudents = await tx.query.classregistration.findMany({
            where: (studentreg, { and, or, eq }) => and(
                eq(studentreg.classid, curClass.classid), 
                eq(studentreg.seasonid, curClass.seasonid),
                or(eq(studentreg.statusid, REGSTATUS_SUBMITTED), eq(studentreg.statusid, REGSTATUS_REGISTERED))
            ),
            with: {
                student: {
                    with: {
                        family: true
                    }
                },
            }
        });

        // Get the drops
        const droppedStudents = await tx.query.classregistration.findMany({
            where: (studentreg, { and, or, eq }) => and(
                eq(studentreg.classid, curClass.classid), 
                eq(studentreg.seasonid, curClass.seasonid),
                or(
                    eq(studentreg.statusid, REGSTATUS_TRANSFERRED), 
                    eq(studentreg.statusid, REGSTATUS_DROPOUT), 
                    eq(studentreg.statusid, REGSTATUS_DROPOUT_SPRING)
                )
            ),
            with: {
                student: {
                    with: {
                        family: true
                    }
                },
            }
        })
        const [droppedStudentViews, regStudentViews] = await Promise.all([
            Promise.all(droppedStudents.map((c) => getStudentView(c))),
            Promise.all(regClassStudents.map((c) => getStudentView(c))),
        ]);

        return [droppedStudentViews, regStudentViews];
    }

    // Get student view data and transform into data table form
    const getStudentsAndClassrooms = async (regClass: InferSelectModel<typeof arrangement>): Promise<fullRegClass> => {
        // Get the students who have registered. These are attached to regclasses like 3R because of how we queried for classData 13 lines up.
        // This is done pre or post dispersal. All registrations are first sent to R classes.
        return await db.transaction(async (tx) => {
            // 1. Create an array for all dropped students which we want to store separately
            const allDropped = []
            // 2. Get student views for dropped students and students in reg.
            // We have to run this for every class because students can drop while in reg class or any other constituent class
            const [regDroppedStudents, regStudentViews] = await splitStudents(tx, regClass);

            allDropped.push(...regDroppedStudents);

            // 3. Get the specific classes of this reg class, i.e. 3A, 3B, 3C
            // Check which classes have regclassid as a gradeclassid.
            const constiuentClassrooms = await tx.query.classes.findMany({
                where: (classes, { eq }) => eq(classes.gradeclassid, regClass.classid),
                columns: {
                    classid: true
                }
            });

            // 4. Set up constituent classrooms as a list and loop
            const constituentClassObjs = []

            for (const gradeClass of constiuentClassrooms) {
                // 5. Find the arrangement in the academic year or the semester
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

            const dataview = {
                arrinfo: regClass,
                students: regStudentViews,
                classrooms: constituentClassObjs,
                dropped: allDropped
            } satisfies fullRegClass

            return dataview;
        })

    }

    // Fetch all student data upfront
    const classDataWithStudents: fullSemClassesData = await Promise.all(
        classData.map((classItem) => {
            const regClassInfo = getStudentsAndClassrooms(classItem);
            return regClassInfo;
        })
    );

    // console.log(classDataWithStudents);

    const { options, idMaps } = await getSelectOptions();

    const threeTerms = { year: year, fall: fall, spring: spring }

    return (
        <SemesterView 
            academicYear={threeTerms}
            fullData={classDataWithStudents}
            selectOptions={options}
            idMaps={idMaps}
        />
    )
}