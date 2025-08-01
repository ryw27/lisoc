import AddEntity, { FormField } from '@/components/data-view/add-entity'
import { insertFamilyRow } from '../family-helpers'

export default async function AddFamily({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
}) {
    const params = await searchParams;
    const error = params?.error;

    // Define form fields
    const fields: FormField[] = [
        {
            name: "fatherfirsten",
            label: "Father First Name",
            type: "text",
            placeholder: "Enter father's first name...",
            required: false
        },
        {
            name: "fatherlasten",
            label: "Father Last Name",
            type: "text",
            placeholder: "Enter father's last name...",
            required: false
        },
        {
            name: "fathernamecn",
            label: "Father Name (CN)",
            type: "text",
            placeholder: "Enter father's Chinese name...",
            required: false
        },
        {
            name: "motherfirsten",
            label: "Mother First Name",
            type: "text",
            placeholder: "Enter mother's first name...",
            required: false
        },
        {
            name: "motherlasten",
            label: "Mother Last Name",
            type: "text",
            placeholder: "Enter mother's last name...",
            required: false
        },
        {
            name: "mothernamecn",
            label: "Mother Name (CN)",
            type: "text",
            placeholder: "Enter mother's Chinese name...",
            required: false
        },
        {
            name: "address1",
            label: "Address Line 1",
            type: "text",
            placeholder: "Enter address line 1...",
            required: false
        }
    ];

    return (
        <AddEntity
            title="Add New Family"
            description="Add a new family"
            fields={fields}
            submitAction={insertFamilyRow}
            error={error}
        />
    );
} 