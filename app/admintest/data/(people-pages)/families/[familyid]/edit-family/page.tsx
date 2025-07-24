import EditEntity, { EditFormField } from '@/components/edit-entity'
import { idFamilyRow, updateFamilyRow } from '../../family-helpers'

export default async function EditFamilyPage({
    params,
}: {
    params: { familyid: string, error?: string }
}) {
    
    const { familyid, error } = await params;
    const family_id = parseInt(familyid);
    
    // Fetch the family data
    const currentFamily = await idFamilyRow(family_id);

    if (!currentFamily) {
        return <div>Family not found</div>;
    }

    // Define form fields with current values
    const fields: EditFormField[] = [
        {
            name: "fatherfirsten",
            label: "Father First Name",
            type: "text",
            required: false,
            defaultValue: currentFamily.fatherfirsten || ""
        },
        {
            name: "fatherlasten",
            label: "Father Last Name",
            type: "text",
            required: false,
            defaultValue: currentFamily.fatherlasten || ""
        },
        {
            name: "fathernamecn",
            label: "Father Name (CN)",
            type: "text",
            required: false,
            defaultValue: currentFamily.fathernamecn || ""
        },
        {
            name: "motherfirsten",
            label: "Mother First Name",
            type: "text",
            required: false,
            defaultValue: currentFamily.motherfirsten || ""
        },
        {
            name: "motherlasten",
            label: "Mother Last Name",
            type: "text",
            required: false,
            defaultValue: currentFamily.motherlasten || ""
        },
        {
            name: "mothernamecn",
            label: "Mother Name (CN)",
            type: "text",
            required: false,
            defaultValue: currentFamily.mothernamecn || ""
        },
        {
            name: "address2",
            label: "Address Line 2",
            type: "text",
            required: false,
            defaultValue: currentFamily.address2 || ""
        },
        {
            name: "phonealt",
            label: "Alt Phone",
            type: "text",
            required: false,
            defaultValue: currentFamily.phonealt || ""
        },
        {
            name: "emailalt",
            label: "Alt Email",
            type: "text",
            required: false,
            defaultValue: currentFamily.emailalt || ""
        },
        {
            name: "notes",
            label: "Notes",
            type: "textarea",
            required: false,
            defaultValue: currentFamily.notes || ""
        }
    ];

    async function handleSubmit(formData: FormData) {
        "use server";
        await updateFamilyRow(family_id, formData);
    }

    return (
        <EditEntity
            title={`Edit Family: ${family_id}`}
            fields={fields}
            submitAction={handleSubmit}
            gobacklink={`/admintest/dashboard/data/families/${family_id}`}
            error={error}
        />
    );
} 