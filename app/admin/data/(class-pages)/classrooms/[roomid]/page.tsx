import { notFound } from "next/navigation";
import { InferSelectModel } from "drizzle-orm";
import { classrooms } from "@/lib/db/schema";
import { getIDRow } from "@/server/data-view/actions/getIDRow";
import EntityId, { displaySectionGroup } from "@/components/data-view/id-entity-view/entity-id";

interface ClassroomPageProps {
    params: Promise<{
        roomid: string;
    }>;
}

export default async function ClassroomPage({ params }: ClassroomPageProps) {
    const room_id = parseInt((await params).roomid);

    const response = await getIDRow("classrooms", room_id);
    if (!response.ok || !response.data) {
        return notFound();
    }

    const curClassroom = response.data as InferSelectModel<typeof classrooms>;

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup[] = [
        {
            section: "Classroom Information",
            display: [
                {
                    label: "Room ID",
                    value: String(curClassroom.roomid),
                },
                {
                    label: "Room Number",
                    value: curClassroom.roomno,
                },
                {
                    label: "Room Capacity",
                    value: String(curClassroom.roomcapacity),
                },
            ],
        },
        {
            section: "Other Information",
            display: [
                {
                    label: "Status",
                    value: curClassroom.status,
                },
                {
                    label: "Notes",
                    value: curClassroom.notes ?? "No notes available",
                },
            ],
        },
    ];

    return (
        <EntityId
            title={`Classroom ${String(curClassroom.roomid)} - ${curClassroom.roomno}`}
            entity="classrooms"
            displayFields={displaySections}
            id={String(room_id)}
        />
    );
}
