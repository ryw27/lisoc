import AddEntity, { FormField } from '@/components/add-entity'
import { insertTeacherRow } from '../teacher-helpers'
import { allTeacherRows } from '../teacher-helpers'

export default async function AddTeacher({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
}) {
    const params = await searchParams;
    const error = params?.error;


    const teachers = await allTeacherRows();
    const teacherOptions = [
        { value: "", label: "Not linked" },
        ...teachers.map((teacher: any) => ({
            value: teacher.teacherid.toString(),
            label: `Teacher ${teacher.teacherid}`
        }))
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
            name: "classid",
            label: "Class",
            type: "select",
            options: teacherOptions,
            required: false
        },
        {
            name: "address2",
            label: "Address Line 2",
            type: "text",
            placeholder: "Enter address line 2...",
            required: false
        },
        {
            name: "phonealt",
            label: "Alt Phone",
            type: "text",
            placeholder: "Enter alternative phone...",
            required: false
        },
        {
            name: "emailalt",
            label: "Alt Email",
            type: "text",
            placeholder: "Enter alternative email...",
            required: false
        },
        {
            name: "teacherid",
            label: "Teacher",
            type: "select",
            options: teacherOptions,
            required: false
        },
        {
            name: "notes",
            label: "Notes",
            type: "textarea",
            placeholder: "Enter any notes...",
            required: false
        }
    ];

    return (
        <AddEntity
            title="Add New Teacher"
            description="Add a new teacher"
            fields={fields}
            submitAction={insertTeacherRow}
            error={error}
        />
    );
}
