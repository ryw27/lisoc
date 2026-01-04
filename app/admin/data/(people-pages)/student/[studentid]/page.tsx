import { notFound } from "next/navigation";
import { InferSelectModel } from "drizzle-orm";
import { student } from "@/lib/db/schema";
import { getIDRow } from "@/server/data-view/actions/getIDRow";
import EntityId, { displaySectionGroup } from "@/components/data-view/id-entity-view/entity-id";

interface StudentPageProps {
    params: Promise<{
        studentid: string;
    }>;
}

export default async function StudentPage({ params }: StudentPageProps) {
    const student_id = parseInt((await params).studentid);

    const response = await getIDRow("student", student_id);
    if (!response.ok || !response.data) {
        return notFound();
    }

    const studentData = response.data as InferSelectModel<typeof student>;

    const displaySections: displaySectionGroup[] = [
        {
            section: "Student Information",
            display: [
                {
                    label: "Student ID",
                    value: String(student_id),
                },
                {
                    label: "Student No",
                    value: studentData.studentno ?? "N/A",
                },
                {
                    label: "Name",
                    value: `${studentData.namecn} ${studentData.namelasten} ${studentData.namefirsten}`,
                },
                {
                    label: "Gender",
                    value: studentData.gender ?? "N/A",
                },
                {
                    label: "Age",
                    value: studentData.age ? String(studentData.age) : "N/A",
                },
                {
                    label: "Date of Birth",
                    value: studentData.dob ? new Date(studentData.dob).toLocaleDateString() : "N/A",
                },
                {
                    label: "Active",
                    value: studentData.active ? "Yes" : "No",
                },
            ],
        },
        {
            section: "Other Information",
            display: [
                {
                    label: "Family ID",
                    value: studentData.familyid ? String(studentData.familyid) : "N/A",
                },
                {
                    label: "Last Modified",
                    value: studentData.lastmodify
                        ? new Date(studentData.lastmodify).toLocaleDateString()
                        : "N/A",
                },
                {
                    label: "Created On",
                    value: studentData.createddate
                        ? new Date(studentData.createddate).toLocaleDateString()
                        : "N/A",
                },
                {
                    label: "Notes",
                    value: studentData.notes ?? "N/A",
                },
            ],
        },
    ];

    return (
        <EntityId
            title={`Student ${String(student_id)}`}
            entity="student"
            displayFields={displaySections}
            id={String(student_id)}
        />
    );
}
