import { InferSelectModel } from "drizzle-orm";
import { classrooms } from "@/lib/db/schema";
import { type FormSections, type FormSelectOptions } from "@/types/dataview.types";
import { getIDRow } from "@/server/data-view/actions/getIDRow";
import EditEntity from "@/components/data-view/edit-entity/edit-entity";

export default async function EditClassroomPage({
    params,
}: {
    params: Promise<{ roomid: string }>;
}) {
    const { roomid } = await params;
    const room_id = parseInt(roomid);

    // Fetch the classroom data
    const response = await getIDRow("classrooms", room_id);

    if (!response.ok || !response.data) {
        return <div>Classroom not found</div>;
    }

    const currentClassroom = response.data as InferSelectModel<typeof classrooms>;

    const statusOptions = [
        { val: "Active", labelen: "Active", labelcn: "Active" },
        { val: "Inactive", labelen: "Inactive", labelcn: "Inactive" },
    ];

    // Define form fields with current values
    const fields: FormSections[] = [
        {
            section: "Classroom Information",
            sectionFields: [
                {
                    name: "roomno",
                    label: "Room Number",
                    type: "text",
                    required: true,
                    defaultValue: currentClassroom.roomno ?? "",
                },
                {
                    name: "roomcapacity",
                    label: "Room Capacity",
                    type: "number",
                    required: true,
                    defaultValue: currentClassroom.roomcapacity?.toString() ?? "",
                },
                {
                    name: "status",
                    label: "Status",
                    type: "select",
                    defaultValue: currentClassroom.status ?? "",
                    required: true,
                    options: statusOptions as FormSelectOptions[],
                },
            ],
        },
        {
            section: "Extra Information",
            sectionFields: [
                {
                    name: "notes",
                    label: "Notes",
                    type: "textarea",
                    required: false,
                    defaultValue: currentClassroom.notes ?? "",
                },
            ],
        },
    ];

    const hiddenInputs = {
        roomid: currentClassroom.roomid,
    };

    return (
        <EditEntity
            entity="classrooms"
            title={`Edit Classroom: ${currentClassroom.roomno}`}
            description="Current values have already been filled in."
            fields={fields}
            hiddenInputs={hiddenInputs}
        />
    );
}
