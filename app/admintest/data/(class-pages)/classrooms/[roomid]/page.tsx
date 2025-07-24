import { classrooms } from '@/app/lib/db/schema';
import EntityId, { displaySectionGroup } from '@/components/entity-id';
import { Table } from '@/app/lib/entity-types';
import { classroomTable } from '../classroom-helpers';

interface ClassroomPageProps {
    params: Promise<{
        roomid: string;
    }>
}

export default async function ClassroomPage({ params }: ClassroomPageProps) {
    const room_id = parseInt((await params).roomid);

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup<'classrooms', Table<"classrooms">>[] = [
        {
            label: "Classroom Information",
            display: [
                {
                    label: "Room ID",
                    key: "roomid"
                },
                {
                    label: "Room Number",
                    key: "roomno"
                },
                {
                    label: "Room Capacity",
                    key: "roomcapacity"
                },
                {
                    label: "Status",
                    key: "status"
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
        <EntityId<"classrooms", classroomTable, 'roomid'>
            table={classrooms}
            tableName="classrooms"
            primaryKey="roomid"
            titleCol="roomno"
            displaySections={displaySections}
            notFoundMessage="Classroom not found"
            id={room_id}
        />
    );
} 