import { teachers } from '@/app/lib/db/schema';
import EntityId, { displaySectionGroup } from '@/components/entity-id';
import { Table } from '@/app/lib/entity-types';
import { teacherTable } from '../teacher-helpers';

interface TeacherPageProps {
    params: Promise<{
        teacherid: string;
    }>
}

export default async function TeacherPage({ params }: TeacherPageProps) {
    const teacher_id = parseInt((await params).teacherid);

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup<'teachers', Table<"teachers">>[] = [
        {
            label: "Teacher Information",
            display: [
                {
                    label: "Teacher ID",
                    key: "teacherid"
                },
                {
                    label: "User ID",
                    key: "userid"
                },
                {
                    label: "Name (CN)",
                    key: "namecn"
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
                    label: "Class ID",
                    key: "classid",
                    fallback: "Not assigned"
                },
                {
                    label: "Family ID",
                    key: "familyid",
                    fallback: "Not linked"
                }
            ]
        },
        {
            label: "Contact Information",
            display: [
                {
                    label: "Address Line 2",
                    key: "address2",
                    fallback: "Not provided"
                },
                {
                    label: "Alt Phone",
                    key: "phonealt",
                    fallback: "Not provided"
                },
                {
                    label: "Alt Email",
                    key: "emailalt",
                    fallback: "Not provided"
                },
                {
                    label: "Created By",
                    key: "createby",
                    fallback: "Unknown"
                },
                {
                    label: "Updated By",
                    key: "updateby",
                    fallback: "Unknown"
                },
                {
                    label: "Updated On",
                    key: "updateon",
                    formatter: (value: any) => value ? new Date(value as string).toLocaleDateString() : "Never updated"
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
        <EntityId<"teachers", teacherTable, 'teacherid'>
            table={teachers}
            tableName="teachers"
            primaryKey="teacherid"
            titleCol="namecn"
            displaySections={displaySections}
            notFoundMessage="Teacher not found"
            id={teacher_id}
        />
    );
}
