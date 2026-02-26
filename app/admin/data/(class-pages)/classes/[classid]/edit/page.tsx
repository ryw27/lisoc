import EditEntity from "@/components/data-view/edit-entity/edit-entity";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { classTypeMap } from "@/lib/utils";
import { getIDRow } from "@/server/data-view/actions/getIDRow";
import { type FormSections, type FormSelectOptions } from "@/types/dataview.types";
import { InferSelectModel } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function ClassEditPage({ params }: { params: Promise<{ classid: string }> }) {
    const { classid } = await params;
    const classId = parseInt(classid);

    const response = await getIDRow("classes", classId);
    if (!response.ok || !response.data) {
        return notFound();
    }

    const curClass = response.data as InferSelectModel<typeof classes>;

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
                    defaultValue: curClass?.classnamecn ?? "",
                },
                {
                    name: "classnameen",
                    label: "Class Name (EN)",
                    type: "text",
                    placeholder: "Enter english class name",
                    required: true,
                    width: "half",
                    defaultValue: curClass?.classnameen ?? "",
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
                    defaultValue:
                        curClass?.ageid !== undefined && curClass?.ageid !== null
                            ? String(curClass.ageid)
                            : "1",
                },
                {
                    name: "typeid",
                    label: "Class Type",
                    type: "select",
                    placeholder: "Enter the type of class",
                    required: true,
                    options: formClassTypeOptions,
                    width: "half",
                    defaultValue:
                        curClass?.typeid !== undefined && curClass?.typeid !== null
                            ? String(curClass.typeid)
                            : "1",
                },
                {
                    name: "classno",
                    label: "Class Level",
                    type: "number",
                    min: -1,
                    max: 100,
                    placeholder: "Enter class level",
                    required: true,
                    width: "half",
                    defaultValue:
                        curClass?.classno !== undefined && curClass?.classno !== null
                            ? String(curClass.classno)
                            : "0",
                },
                {
                    name: "sizelimits",
                    label: "Size Limits",
                    type: "number",
                    placeholder: "Enter the size limits (0 if none)",
                    required: true,
                    width: "half",
                    defaultValue:
                        curClass?.sizelimits !== undefined && curClass?.sizelimits !== null
                            ? String(curClass.sizelimits)
                            : "100",
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
                    defaultValue: curClass?.status ?? "",
                },
                {
                    name: "gradeclassid",
                    label: "Registration Class",
                    type: "select",
                    required: true,
                    placeholder: "Select the registration or parent class",
                    width: "half",
                    options: gradeClassMap,
                    defaultValue:
                        curClass?.gradeclassid !== undefined && curClass?.gradeclassid !== null
                            ? String(curClass.gradeclassid)
                            : "",
                },
                {
                    name: "classupid",
                    label: "Upgrade Class",
                    type: "select",
                    required: false,
                    placeholder: "Select the upgrade class",
                    width: "half",
                    options: regClassMap,
                    defaultValue:
                        curClass?.classupid !== undefined && curClass?.classupid !== null
                            ? String(curClass.classupid)
                            : "",
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
                    defaultValue: curClass?.description ?? "",
                },
            ],
        },
    ];

    const hiddenInputs = {
        classid: curClass?.classid,
    };
    return (
        <EditEntity
            entity="classes"
            title={`Edit class ${classId}`}
            description="Current values have already been filled in."
            fields={fields}
            hiddenInputs={hiddenInputs}
        />
    );
}
