import { student } from '@/lib/db/schema';
import EntityId, { displaySectionGroup } from '@/components/data-view/entity-id';
import { Table } from '@/lib/data-view/types';
import { studentTable } from '../student-helpers';

interface StudentPageProps {
    params: Promise<{
        studentid: string;
    }>
}

export default async function StudentPage({ params }: StudentPageProps) {
    const student_id = parseInt((await params).studentid);

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup<'student', Table<"student">>[] = [
        {
            label: "Student Information",
            display: [
                {
                    label: "Student ID",
                    key: "studentid"
                },
                {
                    label: "Family ID",
                    key: "familyid"
                },
                {
                    label: "Student Number",
                    key: "studentno",
                    fallback: "Not assigned"
                },
                {
                    label: "Name (CN)",
                    key: "namecn",
                    fallback: "Not provided"
                },
                {
                    label: "Last Name",
                    key: "namelasten"
                },
                {
                    label: "First Name",
                    key: "namefirsten"
                },
                {
                    label: "Gender",
                    key: "gender",
                    fallback: "Not specified"
                },
                {
                    label: "Age Group",
                    key: "ageof",
                    fallback: "Not specified"
                },
                {
                    label: "Age",
                    key: "age",
                    fallback: "Not provided"
                },
                {
                    label: "Date of Birth",
                    key: "dob",
                    formatter: (value: any) => value ? new Date(value as string).toLocaleDateString() : "Not provided"
                }
            ]
        },
        {
            label: "Status & Notes",
            display: [
                {
                    label: "Active",
                    key: "active",
                    formatter: (value: any) => value ? "Yes" : "No"
                },
                {
                    label: "Created Date",
                    key: "createddate",
                    formatter: (value: any) => value ? new Date(value as string).toLocaleDateString() : "Not available"
                },
                {
                    label: "Last Modified",
                    key: "lastmodify",
                    formatter: (value: any) => value ? new Date(value as string).toLocaleDateString() : "Never modified"
                },
                {
                    label: "Upgradable",
                    key: "upgradable"
                },
                {
                    label: "Notes",
                    key: "notes",
                    fallback: "No notes available"
                }
            ]
        }
    ];

    return (
        <EntityId<"student", studentTable, 'studentid'>
            table={student}
            tableName="student"
            primaryKey="studentid"
            titleCol="namefirsten"
            displaySections={displaySections}
            notFoundMessage="Student not found"
            id={student_id}
        />
    );
} 