import AddEntity, { FormField } from '@/components/data-view/add-entity'
import { insertAdministratorRow } from '../admin-helpers'
import { allAdministratorRows, administratorObject } from '../admin-helpers'

export default async function AddAdministrator({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
}) {
    const params = await searchParams;
    const error = params?.error;

    // Get data for select options
    const administrators = await allAdministratorRows();
    const administratorOptions = [
        { value: "", label: "Not linked" },
        ...administrators.map((administrator: administratorObject) => ({
            value: administrator.administratorid.toString(),
            label: `Administrator ${administrator.administratorid}`
        }))
    ];

    const roleOptions = [
        { value: "1", label: "Admin" },
        { value: "2", label: "Super Admin" },
        { value: "3", label: "Manager" }
    ];

    const statusOptions = [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" }
    ];

    const changePasswordOptions = [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" }
    ];

    // Define form fields
    const fields: FormField[] = [
        {
            name: "namecn",
            label: "Name (CN)",
            type: "text",
            placeholder: "Enter Chinese name...",
            required: true
        },
        {
            name: "namelasten",
            label: "Last Name",
            type: "text",
            placeholder: "Enter last name...",
            required: true
        },
        {
            name: "namefirsten",
            label: "First Name",
            type: "text",
            placeholder: "Enter first name...",
            required: true
        },
        {
            name: "roleid",
            label: "Role",
            type: "select",
            options: roleOptions,
            required: true
        },
        {
            name: "address1",
            label: "Address Line 1",
            type: "text",
            placeholder: "Enter address line 1...",
            required: false
        },
        {
            name: "administratorid",
            label: "Administrator",
            type: "select",
            options: administratorOptions,
            required: false
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            options: statusOptions,
            required: true
        },
        {
            name: "ischangepwdnext",
            label: "Change Password Next Login",
            type: "select",
            options: changePasswordOptions,
            required: true
        },
    ];

    return (
        <AddEntity
            title="Add New Administrator"
            description="Add a new administrator"
            fields={fields}
            submitAction={insertAdministratorRow}
            error={error}
        />
    );
} 