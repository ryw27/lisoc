import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { type FormSections, type FormSelectOptions } from "@/types/dataview.types";
import AddEntity from "@/components/data-view/add-entity/add-entity";
import EntityFormsHeader from "@/components/data-view/entity-forms-header";

export default async function AddClassroom() {
    const statusOptions = [
        { val: "Active", labelen: "Active", labelcn: "Active" },
        { val: "Inactive", labelen: "Inactive", labelcn: "Inactive" },
    ];

    // Define form fields. Match form schema to names
    const fields: FormSections[] = [
        {
            section: "Classroom Information",
            sectionFields: [
                {
                    name: "roomno",
                    label: "Room Number",
                    type: "text",
                    placeholder: "Enter the room number...",
                    required: true,
                },
                {
                    name: "roomcapacity",
                    label: "Room Capacity",
                    type: "number",
                    placeholder: "Enter the room capacity",
                    required: true,
                },
                {
                    name: "status",
                    label: "Status",
                    type: "select",
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
                    placeholder: "Enter any additional notes",
                    required: false,
                },
            ],
        },
    ];

    return (
        <>
            <EntityFormsHeader type="add" gobacklink={`${ADMIN_DATAVIEW_LINK}/classrooms`} />
            <AddEntity
                entity="classrooms"
                title="Add a new classroom"
                description="Fill out the form below to add a new classroom. Be sure to double check your inputs before saving."
                fields={fields}
            />
        </>
    );
}
