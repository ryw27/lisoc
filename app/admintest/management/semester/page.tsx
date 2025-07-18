import { db } from "@/app/lib/db";
import Logo from "@/components/logo";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import SemesterView from "../components/sem-view";
import { getSelectOptions, Transaction } from "@/app/lib/semester/sem-actions";
import { type fullArrData, type studentView, type fullSemClassesData, fullClassStudents } from "@/app/lib/semester/sem-schemas";
import { InferSelectModel } from "drizzle-orm";
import { updateArrangement, addArrangement } from "@/app/lib/semester/sem-actions";
import { arrangement, classregistration, seasons, student } from "@/app/lib/db/schema";


export default async function SemesterPage() {
    // TODO: MAke sure this finds the academic year, not the semesters
    const active = await db.query.seasons.findMany({
        where: (seasons, { eq }) => eq(seasons.status, "Active"),
        orderBy: (seasons, { asc }) => [asc(seasons.seasonid)]
    });

    if (active.length === 0 || !active || active.length !== 2) {
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

    if (active.length !== 2) {
        throw new Error("Active seasons must be 3");
    }

    const { year, sem } = { year: active[0], sem: active[1] };

    const relatedSeason = await db.query.seasons.findFirst({
        where: (season, { eq }) => eq(season.seasonid, year.relatedseasonid),
        columns: { startdate: true }
    });

    const isSpring = relatedSeason?.startdate
        ? new Date(relatedSeason.startdate).getTime() <= Date.now()
        : false;


    // All reg classes for the year, both full, fall, and spring
    const classData = await db.query.arrangement.findMany({
        where: (arr, { and, or, eq }) => and(
            or(eq(arr.seasonid, year.seasonid), eq(arr.seasonid, sem.seasonid)),
            eq(arr.isregclass, true)
        ),
        orderBy: (arr, { asc }) => [asc(arr.arrangeid)]
    });

    // TODO: type student better if you want lol
    const getStudentView = async (tx: Transaction, studentReg: InferSelectModel<typeof classregistration> & { student: InferSelectModel<typeof student> } ) => {
        // TODO: More complete handling of whether a drop/transfer has occured
        // Check if dropped, request status id is 2 indicating approval
        const requests = await db.query.regchangerequest.findFirst({
            where: (reg, { and, eq }) => and(eq(reg.appliedid, studentReg.regid), eq(reg.reqstatusid, 2))
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
                        : regStatusMap[studentReg.statusid as 1 | 2 | 3 | 4 | 5]

        return {
            regid: studentReg.regid,
            studentid: studentReg.studentid,
            registerDate: studentReg.registerdate,
            dropped: status,
            familyid: studentReg.familyid,
            namecn: studentReg.student.namecn,
            namelasten: studentReg.student.namelasten,
            namefirsten: studentReg.student.namefirsten,
            dob: studentReg.student.dob,
            gender: studentReg.student.gender || "Unknown",
            notes: studentReg.notes || ""
        } satisfies studentView
    }

    // Get student view data and transform into data table form
    const getStudentsAndClassrooms = async (regClass: InferSelectModel<typeof arrangement>): Promise<fullClassStudents & { classrooms: fullClassStudents[] }> => {
        // 
        // Get the students who have registered. These are attached to regclasses like 3R because of how we queried for classData 13 lines up.
        // This is done pre or post dispersal. All registrations are first sent to R classes.
        return await db.transaction(async (tx) => {
            const regClassStudents = await tx.query.classregistration.findMany({
                where: (studentreg, { and, eq, or }) => and(
                    eq(studentreg.classid, regClass.classid), 
                    or(eq(studentreg.seasonid, year.seasonid), eq(studentreg.seasonid, sem.seasonid))
                ),
                with: {
                    student: {
                        with: {
                            family: true
                        }
                    },
                }
            });

            const regStudentView = await Promise.all(
                regClassStudents.map((c) => {
                    return getStudentView(tx, c);
                })
            );

            // Get the specific classes of this reg class, i.e. 3A, 3B, 3C
            // Check which classes have regclassid as a gradeclassid.
            const specificRegClasses = await tx.query.classes.findMany({
                where: (classes, { eq }) => eq(classes.gradeclassid, regClass.classid),
                columns: {
                    classid: true
                }
            });

            const studentsofClasses = []

            for (const gradeClass of specificRegClasses) {
                // Find the arrangement in the academic year or the semester
                const specificArrangement = await tx.query.arrangement.findFirst({
                    where: (arr, { eq, or, and }) => and(
                        eq(arr.classid, gradeClass.classid), 
                        or(eq(arr.seasonid, year.seasonid), eq(arr.seasonid, sem.seasonid))
                    )
                });

                if (!specificArrangement) {
                    continue;
                }

                const classStudents = await tx.query.classregistration.findMany({
                    where: (studentreg, { and, eq, or }) => and(
                        eq(studentreg.classid, specificArrangement.classid), 
                        or(eq(studentreg.seasonid, year.seasonid), eq(studentreg.seasonid, sem.seasonid))
                    ),
                    with: {
                        student: {
                            with: {
                                family: true
                            }
                        },
                    }
                }); 
                const classViewStudents = await Promise.all(
                    classStudents.map((c) => {
                        return getStudentView(tx, c);
                    })
                );

                const classObj = {
                    arrinfo: specificArrangement,
                    students: classViewStudents
                } satisfies fullClassStudents

                studentsofClasses.push(classObj);
            }

            const dataview = {
                arrinfo: regClass,
                students: regStudentView,
                classrooms: studentsofClasses
            } satisfies fullClassStudents & { classrooms: fullClassStudents[]}

            return dataview;
        })

    }
    console.log(classData);

    // Fetch all student data upfront
    const classDataWithStudents: fullSemClassesData = await Promise.all(
        classData.map((classItem) => {
            const regClassInfo = getStudentsAndClassrooms(classItem);
            return regClassInfo;
        })
    );

    console.log(classDataWithStudents);

    const { options, idMaps } = await getSelectOptions();

    return (
        <SemesterView 
            season={year}
            fullSemClassData={classDataWithStudents}
            selectOptions={options}
            idMaps={idMaps}
            insertArr={addArrangement}
            updateArr={updateArrangement}
        />
    )
}