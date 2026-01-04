import { db } from "@/lib/db";
import { ADMIN_DATAVIEW_LINK, classTypeMap } from "@/lib/utils";
import { type FormSections, type FormSelectOptions } from "@/types/dataview.types";
import AddEntity from "@/components/data-view/add-entity/add-entity";
import EntityFormsHeader from "@/components/data-view/entity-forms-header";

export default async function AddClass() {
    // Not using this for now, need reg classes as well
    // const { idMaps } = await getSelectOptions();
    const regClasses = await db.query.classes.findMany({
        where: (c, { eq }) => eq(c.gradeclassid, c.classid),
        columns: {
            classid: true,
            classnamecn: true,
            classnameen: true,
            gradeclassid: true,
        },
    });

    const regClassMap = regClasses.map((c) => ({
        val: c.classid,
        labelen: c.classnameen,
        labelcn: c.classnamecn,
    })) satisfies FormSelectOptions[];

    const gradeClassMap = [
        ...regClassMap,
        {
            val: 0,
            labelen: "Set as registration class (please follow the format)",
            labelcn: "设置registration class. 请遵循格式",
        },
    ] satisfies FormSelectOptions[];

    const formClassTypeOptions = Object.entries(classTypeMap).map(
        ([val, { typenameen, typenamecn }]) => ({
            val: val,
            labelen: typenameen,
            labelcn: typenamecn,
        })
    ) satisfies FormSelectOptions[];

    // Define form fields. Match form schema to names
    const fields: FormSections[] = [
        {
            section: "Names",
            sectionFields: [
                {
                    name: "classnamecn",
                    label: "Class Name (中文)",
                    type: "text",
                    placeholder: "输入中文课名字",
                    required: true,
                    width: "half",
                },
                {
                    name: "classnameen",
                    label: "Class Name (EN)",
                    type: "text",
                    placeholder: "Enter english class name",
                    required: true,
                    width: "half",
                },
            ],
        },
        {
            section: "Details",
            sectionFields: [
                {
                    name: "ageid",
                    label: "Age ID",
                    required: true,
                    type: "number",
                    min: 1,
                    max: 100,
                    placeholder: "Enter the Age required",
                    width: "half",
                },
                {
                    name: "typeid",
                    label: "Class Type",
                    type: "select",
                    placeholder: "Enter the type of class",
                    required: true,
                    options: formClassTypeOptions,
                    width: "half",
                },
                {
                    name: "classno",
                    label: "Class Level",
                    type: "number",
                    min: 1,
                    max: 100,
                    placeholder: "Enter class level",
                    required: true,
                    width: "half",
                },
                {
                    name: "sizelimits",
                    label: "Size Limits",
                    type: "number",
                    placeholder: "Enter the size limits (0 if none)",
                    required: true,
                    width: "half",
                },
            ],
        },
        {
            section: "Class Assignment",
            sectionFields: [
                {
                    name: "status",
                    label: "Status",
                    type: "select",
                    required: true,
                    width: "half",
                    placeholder: "Select status",
                    options: [
                        { val: "Active", labelcn: "注册状态", labelen: "Active" },
                        { val: "Inactive", labelcn: "注册关闭", labelen: "Active" },
                    ],
                },
                {
                    name: "gradeclassid",
                    label: "Registration Class",
                    type: "select",
                    required: true,
                    placeholder: "Select the registration or parent class",
                    width: "half",
                    options: gradeClassMap,
                },
                {
                    name: "classupid",
                    label: "Upgrade Class",
                    type: "select",
                    required: true,
                    placeholder: "Select the upgrade class",
                    width: "half",
                    options: regClassMap,
                },
            ],
        },
        {
            section: "Notes",
            sectionFields: [
                {
                    name: "description",
                    label: "Description",
                    type: "textarea",
                    placeholder: "Enter the description",
                },
            ],
        },
    ];

    return (
        <>
            <EntityFormsHeader type="add" gobacklink={`${ADMIN_DATAVIEW_LINK}/classes`} />
            <AddEntity
                entity="classes"
                title="Add a new class"
                description="To add classes for a semester, go to semester management."
                fields={fields}
            />
        </>
    );
}
