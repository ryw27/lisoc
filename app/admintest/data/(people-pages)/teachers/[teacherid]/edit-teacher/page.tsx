import EditEntity, { EditFormField } from '@/components/edit-entity'
import { idTeacherRow, updateTeacherRow } from '../../teacher-helpers'
import { allFamilyRows } from '../../../families/family-helpers'

export default async function EditTeacherPage({
    params,
}: {
    params: { teacherid: string, error?: string }
}) {
    
    const { teacherid, error } = await params;
    const teacher_id = parseInt(teacherid);
    
    // Fetch the teacher data
    const currentTeacher = await idTeacherRow(teacher_id);

    if (!currentTeacher) {
        return <div>Teacher not found</div>;
    }


    const families = await allFamilyRows();
    const familyOptions = [
        { value: "", label: "Not linked" },
        ...families.map((family: any) => ({
            value: family.familyid.toString(),
            label: `Family ${family.familyid}`
        }))
    ];

    // Define form fields with current values
    const fields: EditFormField[] = [
        {
            name: "namecn",
            label: "Name (CN)",
            type: "text",
            required: true,
            defaultValue: currentTeacher.namecn
        },
        {
            name: "namelasten",
            label: "Last Name",
            type: "text",
            required: true,
            defaultValue: currentTeacher.namelasten
        },
        {
            name: "namefirsten",
            label: "First Name",
            type: "text",
            required: true,
            defaultValue: currentTeacher.namefirsten
        },
        {
            name: "address2",
            label: "Address Line 2",
            type: "text",
            required: false,
            defaultValue: currentTeacher.address2 || ""
        },
        {
            name: "phonealt",
            label: "Alt Phone",
            type: "text",
            required: false,
            defaultValue: currentTeacher.phonealt || ""
        },
        {
            name: "emailalt",
            label: "Alt Email",
            type: "text",
            required: false,
            defaultValue: currentTeacher.emailalt || ""
        },
        {
            name: "familyid",
            label: "Family",
            type: "select",
            required: false,
            options: familyOptions,
            defaultValue: currentTeacher.familyid?.toString() || ""
        },
        {
            name: "notes",
            label: "Notes",
            type: "textarea",
            required: false,
            defaultValue: currentTeacher.notes || ""
        }
    ];

    async function handleSubmit(formData: FormData) {
        "use server";
        await updateTeacherRow(teacher_id, formData);
    }

    return (
        <EditEntity
            title={`Edit Teacher: ${currentTeacher.namecn}`}
            fields={fields}
            submitAction={handleSubmit}
            gobacklink={`/admintest/dashboard/data/teachers/${teacher_id}`}
            error={error}
        />
    );
}
