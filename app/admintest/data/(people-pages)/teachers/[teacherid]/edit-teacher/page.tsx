import EditEntity, { EditFormField } from '@/components/data-view/edit-entity'
import { idTeacherRow, updateTeacherRow } from '../../teacher-helpers'
// import { allFamilyRows } from '../../../families/family-helpers'

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


    // const families = await allFamilyRows();
    // const familyOptions = [
    //     { value: "", label: "Not linked" },
    //     ...families.map((family: familyObject) => ({
    //         value: family.familyid.toString(),
    //         label: `Family ${family.familyid}`
    //     }))
    // ];

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
            name: "address1",
            label: "Address Line 1",
            type: "text",
            required: false,
            defaultValue: currentTeacher.address1 || ""
        },

    ];

    async function handleSubmit(formData: FormData) {
        "use server";
        await updateTeacherRow(teacher_id, formData);
    }

    return (
        <EditEntity
            title={`Edit Teacher: ${currentTeacher.namefirsten} ${currentTeacher.namelasten}`}
            fields={fields}
            submitAction={handleSubmit}
            gobacklink={`/admintest/dashboard/data/teachers/${teacher_id}`}
            error={error}
        />
    );
}
