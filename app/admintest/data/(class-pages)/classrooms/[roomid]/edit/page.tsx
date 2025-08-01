import EditEntity, { EditFormField } from '@/components/data-view/edit-entity'
import { idClassroomRow, updateClassroomRow } from '../../classroom-helpers'

export default async function EditClassroomPage({
    params,
}: {
    params: { roomid: string, error?: string }
}) {
    
    const { roomid, error } = await params;
    const room_id = parseInt(roomid);
    
    // Fetch the classroom data
    const currentClassroom = await idClassroomRow(room_id);

    if (!currentClassroom) {
        return <div>Classroom not found</div>;
    }

    const statusOptions = [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Define form fields with current values
    const fields: EditFormField[] = [
        {
            name: "roomno",
            label: "Room Number",
            type: "text",
            required: true,
            defaultValue: currentClassroom.roomno
        },
        {
            name: "roomcapacity",
            label: "Room Capacity",
            type: "number",
            required: true,
            defaultValue: currentClassroom.roomcapacity?.toString()
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: statusOptions.map(option => ({
                label: option.label,
                value: option.value
            })),
            defaultValue: currentClassroom.status
        },
        {
            name: "notes",
            label: "Notes",
            type: "textarea",
            required: false,
            defaultValue: currentClassroom.notes || ""
        }
    ];

    async function handleSubmit(formData: FormData) {
        "use server";
        await updateClassroomRow(room_id, formData);
    }

    return (
        <EditEntity
            title={`Edit Classroom: ${currentClassroom.roomno}`}
            fields={fields}
            submitAction={handleSubmit}
            gobacklink={`/admintest/dashboard/data/classrooms/${room_id}`}
            error={error}
        />
    );
} 