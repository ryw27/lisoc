import EntityId, { displaySectionGroup } from '@/components/data-view/entity-id';
import { Table } from '@/lib/data-view/types';
import { teacherTable } from '../teacher-helpers';
import { teacher } from '@/lib/db/schema';

interface TeacherPageProps {
    params: Promise<{
        teacherid: string;
    }>
}

export default async function TeacherPage({ params }: TeacherPageProps) {
    const teacher_id = parseInt((await params).teacherid);

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup<'teacher', Table<"teacher">>[] = [
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
            ]
        },
        {
            label: "Contact Information",
            display: [
                {
                    label: "Address Line 1",
                    key: "address1",
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
                }
            ]
        }
    ];

    return (
        <EntityId<"teacher", teacherTable, 'teacherid'>
            table={teacher}
            tableName="teacher"
            primaryKey="teacherid"
            titleCol="namecn"
            displaySections={displaySections}
            notFoundMessage="Teacher not found"
            id={teacher_id}
        />
    );
}
