import EditEntity, { EditFormField } from '@/components/data-view/edit-entity'
import { idAdministratorRow, updateAdministratorRow } from '../../admin-helpers'
// import { allFamilyRows, familyObject } from '../../../families/family-helpers'

export default async function EditAdministratorPage({
    params,
    searchParams,
}: {
    params: Promise<{ userid: string }>
    searchParams: Promise<{ error?: string }>
}) {
    
    const { userid } = await params;
    const { error } = await searchParams;
    const admin_id = parseInt(userid);
    
    // Fetch the administrator data
    const currentAdmin = await idAdministratorRow(admin_id);

    if (!currentAdmin) {
        return <div>Administrator not found</div>;
    }

    // Get data for select options
    // const families = await allFamilyRows();
    // const familyOptions = [
    //     { value: "", label: "Not linked" },
    //     ...families.map((family: familyObject) => ({
    //         value: family.familyid.toString(),
    //         label: `Family ${family.familyid}`
    //     }))
    // ];

    // const roleOptions = [
    //     { value: "1", label: "Admin" },
    //     { value: "2", label: "Super Admin" },
    //     { value: "3", label: "Manager" }
    // ];

    const statusOptions = [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" }
    ];

    const changePasswordOptions = [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" }
    ];

    // Define form fields with current values
    const fields: EditFormField[] = [
        {
            name: "namecn",
            label: "Name (CN)",
            type: "text",
            required: true,
            defaultValue: currentAdmin.namecn
        },
        {
            name: "namelasten",
            label: "Last Name",
            type: "text",
            required: true,
            defaultValue: currentAdmin.lastname
        },
        {
            name: "namefirsten",
            label: "First Name",
            type: "text",
            required: true,
            defaultValue: currentAdmin.firstname
        },

        {
            name: "address1",
            label: "Address Line 1",
            type: "text",
            required: false,
            defaultValue: currentAdmin.address1
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: statusOptions,
            defaultValue: currentAdmin.status.toString()
        },
        {
            name: "ischangepwdnext",
            label: "Change Password Next Login",
            type: "select",
            required: true,
            options: changePasswordOptions,
            defaultValue: currentAdmin.ischangepwdnext.toString()
        },
        {
            name: "notes",
            label: "Notes",
            type: "textarea",
            required: false,
            defaultValue: currentAdmin.notes || ""
        }
    ];

    async function handleSubmit(formData: FormData) {
        "use server";
        await updateAdministratorRow(admin_id, formData);
    }

    return (
        <EditEntity
            title={`Edit Administrator: ${currentAdmin.namecn}`}
            fields={fields}
            submitAction={handleSubmit}
            gobacklink={`/admintest/dashboard/data/administrators/${admin_id}`}
            error={error}
        />
    );
} 