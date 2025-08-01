import AddEntity, { FormField } from '@/components/data-view/add-entity'
import { insertClassroomRow } from '../classroom-helpers'

export default async function AddClassroom({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
}) {
    const params = await searchParams;
    const error = params?.error;

    const statusOptions = [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Define form fields. Match form schema to names
    const fields: FormField[] = [
        {
            name: "roomno",
            label: "Room Number",
            type: "text",
            placeholder: "Enter the room number...",
            required: true
        },
        {
            name: "roomcapacity",
            label: "Room Capacity",
            type: "number",
            placeholder: "Enter the room capacity",
            required: true
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: statusOptions
        },
        {
            name: "notes",
            label: "Notes",
            type: "textarea",
            placeholder: "Enter any additional notes"
        }
    ];

    return (
        <AddEntity
            title="Add a new classroom"
            description="Fill out the form below to add a new classroom. Be sure to double check your inputs before saving."
            fields={fields}
            submitAction={insertClassroomRow}
            error={error}
            submitText="Save"
        />
    );
} 