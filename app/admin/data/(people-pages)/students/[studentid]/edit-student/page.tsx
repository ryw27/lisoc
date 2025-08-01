import EditEntity, { EditFormField } from '@/components/data-view/edit-entity'
import { idStudentRow, updateStudentRow } from '../../student-helpers'
import { allFamilyRows, familyObject } from '../../../families/family-helpers'

export default async function EditStudentPage({
    params,
    searchParams,
}: {
    params: Promise<{ studentid: string }>
    searchParams: Promise<{ error?: string }>
}) {
    
    const { studentid } = await params;
    const { error } = await searchParams;
    const student_id = parseInt(studentid);
    
    // Fetch the student data
    const currentStudent = await idStudentRow(student_id);

    if (!currentStudent) {
        return <div>Student not found</div>;
    }

    // Get data for select options
    const families = await allFamilyRows();
    const familyOptions = families.map((family: familyObject) => ({
        value: family.familyid.toString(),
        label: `Family ${family.familyid}`
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

    // Define form fields with current values
    const fields: EditFormField[] = [
        {
            name: "familyid",
            label: "Family",
            type: "select",
            required: true,
            options: familyOptions,
            defaultValue: currentStudent.familyid.toString()
        },
        {
            name: "studentno",
            label: "Student Number",
            type: "text",
            required: false,
            defaultValue: currentStudent.studentno || ""
        },
        {
            name: "namecn",
            label: "Name (CN)",
            type: "text",
            required: false,
            defaultValue: currentStudent.namecn || ""
        },
        {
            name: "gender",
            label: "Gender",
            type: "select",
            required: false,
            options: genderOptions,
            defaultValue: currentStudent.gender || ""
        },
        {
            name: "ageof",
            label: "Age Group",
            type: "text",
            required: false,
            defaultValue: currentStudent.ageof || ""
        },
        {
            name: "age",
            label: "Age",
            type: "number",
            required: false,
            defaultValue: currentStudent.age?.toString() || ""
        },
        {
            name: "dob",
            label: "Date of Birth",
            type: "text",
            required: true,
            defaultValue: currentStudent.dob
        },
        {
            name: "active",
            label: "Active Status",
            type: "select",
            required: true,
            options: activeOptions,
            defaultValue: currentStudent.active.toString()
        },
        {
            name: "upgradable",
            label: "Upgradable",
            type: "number",
            required: false,
            defaultValue: currentStudent.upgradable.toString()
        }
    ];

    async function handleSubmit(formData: FormData) {
        "use server";
        await updateStudentRow(student_id, formData);
    }

    return (
        <EditEntity
            title={`Edit Student: ${currentStudent.namecn}`}
            fields={fields}
            submitAction={handleSubmit}
            gobacklink={`/admintest/dashboard/data/students/${student_id}`}
            error={error}
        />
    );
} 