import { db } from "@/app/lib/db";
import Logo from "@/components/logo";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import SemesterView from "../components/sem-view";
import { getSelectOptions } from "@/app/lib/semester/sem-actions";
import { type fullArrData, type selectOptions, type classWithStudents, type studentView } from "@/app/lib/semester/sem-schemas";


export default async function SemesterPage() {
    const active = await db.query.seasons.findFirst({
        where: (seasons, { eq }) => eq(seasons.status, "Active")
    });

    if (!active) {
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

    // Active semester
    const classData = await db.query.arrangement.findMany({
        where: (arr, { eq }) => eq(arr.seasonid, active.seasonid),
        with: {
            class: true,
            teacher: true, 
            classroom: true,
            classtime: true,
            suitableterm: true,
        },
        orderBy: (arr, { asc }) => [asc(arr.arrangeid)]
    }) satisfies fullArrData[];

    // TODO: Change teacher and class columns to relevant not null
    const { options, idMaps } = await getSelectOptions()

    // Get student view data and transform into data table form
    const getStudents = async (classid: number): Promise<studentView[]> => {
        // Get all students who have registered
        const reg = await db.query.classregistration.findMany({
            where: (reg, { and, eq }) => and(eq(reg.classid, classid), eq(reg.seasonid, active.seasonid)),
            with: {
                student: {}
            }
        });

        const dataview = await Promise.all(reg.map(async (student) => {
            // TODO: More complete handling of whether a drop/transfer has occured
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

    // Fetch all student data upfront
    const classDataWithStudents: classWithStudents[] = await Promise.all(
        classData.map(async (classItem) => {
            const students = await getStudents(classItem.classid);
            return {
                ...classItem,
                students
            };
        })
    );

    return (
        <SemesterView 
            season={active}
            classDataWithStudents={classDataWithStudents}
            selectOptions={options}
        />
    )
}