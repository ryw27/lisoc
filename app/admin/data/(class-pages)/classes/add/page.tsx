import AddEntity, { FormField } from '@/components/data-view/add-entity'
import { classObject, allClassRows, insertClassRow } from '../class-helpers'

export default async function AddClass({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
}) {
    const params = await searchParams;
    const error = params?.error;

    // Get data for select options
    const classes = await allClassRows();
    const classOptions = classes.map((someclass: classObject) => ({
        value: someclass.classnamecn,
        label: someclass.classnamecn
    }));

    const classTypeOptions = [
        { value: "1", label: "1: Standard Chinese" },
        { value: "2", label: "2: 马立平" },
        { value: "4", label: "4: Clubs" }
    ];

    const classLevelOptions = Array.from({length: 13}, (_, i) => ({
        value: i.toString(),
        label: i.toString()
    }));

    const statusOptions = [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Define form fields. Match form schema to names
    const fields: FormField[] = [
        {
            name: "classnamecn",
            label: "Class Name (中文)",
            type: "text",
            placeholder: "中文课名字",
            required: true
        },
        {
            name: "classnameen",
            label: "Class Name (EN)",
            type: "text",
            placeholder: "Enter the English class name...",
            required: true
        },
        {
            name: "typeid",
            label: "Class Type",
            type: "select",
            required: true,
            options: classTypeOptions
        },
        {
            name: "classno",
            label: "Class Level",
            type: "select",
            required: true,
            options: classLevelOptions
        },
        {
            name: "sizelimits",
            label: "Size Limits",
            type: "number",
            placeholder: "Enter the size limits",
            required: true
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            width: "half",
            options: statusOptions
        },
        {
            name: "classupid",
            label: "Upgrade Class",
            type: "select",
            required: true,
            width: "half",
            options: classOptions
        },
        {
            name: "description",
            label: "Description",
            type: "textarea",
            placeholder: "Enter the description"
        }
    ];

    return (
        <AddEntity
            title="Add a new class"
            description="Fill out the form below to add a new class."
            fields={fields}
            submitAction={insertClassRow}
            error={error}
            submitText="Save"
        />
    );
}