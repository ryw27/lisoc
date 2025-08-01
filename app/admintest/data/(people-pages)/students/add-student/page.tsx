import AddEntity, { FormField } from '@/components/data-view/add-entity'
import { insertStudentRow } from '../student-helpers'
import { allStudentRows, studentObject } from '../student-helpers'

export default async function AddStudent({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
}) {
    const params = await searchParams;
    const error = params?.error;

    // Get data for select options
    const students = await allStudentRows();
    const studentOptions = students.map((student: studentObject) => ({
        value: student.studentid.toString(),
        label: `Student ${student.studentid}`
    }));

    const genderOptions = [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
        { value: "Other", label: "Other" }
    ];

    const activeOptions = [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" }
    ];

    // Define form fields
    const fields: FormField[] = [
        {
            name: "studentid",
            label: "Student",
            type: "select",
            options: studentOptions,
            required: true
        },
        {
            name: "studentno",
            label: "Student Number",
            type: "text",
            placeholder: "Enter student number...",
            required: false
        },
        {
            name: "namecn",
            label: "Name (CN)",
            type: "text",
            placeholder: "Enter Chinese name...",
            required: false
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
            name: "gender",
            label: "Gender",
            type: "select",
            options: genderOptions,
            required: false
        },
        {
            name: "ageof",
            label: "Age Group",
            type: "text",
            placeholder: "Enter age group...",
            required: false
        },
        {
            name: "age",
            label: "Age",
            type: "number",
            placeholder: "Enter age...",
            required: false
        },
        {
            name: "dob",
            label: "Date of Birth",
            type: "text",
            placeholder: "YYYY-MM-DD",
            required: true
        },
        {
            name: "active",
            label: "Active Status",
            type: "select",
            options: activeOptions,
            required: true
        },
        {
            name: "upgradable",
            label: "Upgradable",
            type: "number",
            placeholder: "Enter upgradable value...",
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
            title="Add New Student"
            description="Add a new student"
            fields={fields}
            submitAction={insertStudentRow}
            error={error}
        />
    );
} 