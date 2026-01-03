import { notFound } from "next/navigation";
import { InferSelectModel } from "drizzle-orm";
import { teacher } from "@/lib/db/schema";
import { classTypeMap } from "@/lib/utils";
import { type FormSections } from "@/types/dataview.types";
import { getIDRow } from "@/server/data-view/actions/getIDRow";
import { UserObject } from "@/server/data-view/entity-configs/(people)/users";
import EditEntity from "@/components/data-view/edit-entity/edit-entity";

export default async function EditTeacherPage({
    params,
}: {
    params: Promise<{ teacherid: string }>;
}) {
    const { teacherid } = await params;
    const teacherId = parseInt(teacherid);

    const response = await getIDRow("teacher", teacherId);
    if (!response.ok || !response.data) {
        return notFound();
    }

    type JoinedRow = { users: UserObject; teacher: InferSelectModel<typeof teacher> };
    const rows = response.data as JoinedRow;
    const data = {
        ...(rows.teacher ?? {}),
        ...(rows.users ?? {}),
    };
    // TODO: Fetch select options for teacher form

    const fields: FormSections[] = [
        {
            section: "User Details",
            sectionFields: [
                {
                    label: "Chinese Name",
                    name: "namecn",
                    type: "text",
                    required: true,
                    placeholder: "Enter Chinese Name",
                    width: "half",
                    defaultValue: data.namecn,
                },
                {
                    label: "English Name",
                    name: "namelasten",
                    type: "text",
                    required: true,
                    placeholder: "Enter English Name",
                    width: "half",
                    defaultValue: data.namelasten,
                },
                {
                    label: "Username",
                    name: "name",
                    type: "text",
                    required: true,
                    placeholder: "Enter Username",
                    width: "half",
                    defaultValue: data.name ?? "",
                },
                {
                    label: "Email",
                    name: "email",
                    type: "text",
                    required: true,
                    placeholder: "Enter Email",
                    width: "half",
                    defaultValue: data.email ?? "",
                },
                {
                    label: "Password",
                    name: "password",
                    type: "password",
                    required: true,
                    placeholder: "Enter Password",
                    width: "half",
                    defaultValue: data.password ?? "",
                },
            ],
        },
        {
            section: "Teacher Details",
            sectionFields: [
                {
                    label: "Teacher Index",
                    name: "teacherindex",
                    type: "number",
                    required: true,
                    placeholder: "Enter Teacher Index",
                    width: "half",
                    defaultValue: data.teacherindex?.toString() ?? "0.00",
                },
                {
                    label: "Class Type ID",
                    name: "classtypeid",
                    type: "select",
                    required: true,
                    placeholder: "Enter Class Type ID",
                    width: "half",
                    options: Object.entries(classTypeMap).map(([key, item]) => ({
                        labelen: item.typenameen,
                        labelcn: item.typenamecn,
                        val: key,
                    })),
                    defaultValue: data.classtypeid?.toString() ?? "",
                },
            ],
        },
        {
            section: "Contact Details",
            sectionFields: [
                {
                    label: "Address",
                    name: "address",
                    type: "text",
                    required: true,
                    placeholder: "Enter Address",
                    defaultValue: data.address1 ?? "",
                },
                {
                    label: "City",
                    name: "city",
                    type: "text",
                    required: true,
                    placeholder: "Enter City",
                    width: "third",
                    defaultValue: data.city ?? "",
                },
                {
                    label: "State",
                    name: "state",
                    type: "text",
                    required: true,
                    placeholder: "Enter State",
                    width: "third",
                    defaultValue: data.state ?? "",
                },
                {
                    label: "Zip",
                    name: "zip",
                    type: "text",
                    required: true,
                    placeholder: "Enter Zip",
                    width: "third",
                    defaultValue: data.zip ?? "",
                },
                {
                    label: "Phone",
                    name: "phone",
                    type: "text",
                    required: true,
                    placeholder: "Enter Phone",
                    defaultValue: data.phone ?? "",
                },
                {
                    label: "Address 2",
                    name: "address1",
                    type: "text",
                    required: false,
                    placeholder: "Enter Address 2",
                    width: "full",
                    defaultValue: data.address1 ?? "",
                },
            ],
        },
        {
            section: "Notes",
            sectionFields: [
                {
                    label: "Notes",
                    name: "notes",
                    type: "textarea",
                    required: false,
                    placeholder: "Enter any additional notes",
                    defaultValue: data.profile ?? "",
                },
            ],
        },
    ];

    const hiddenInputs = { teacherid: teacherId };

    return (
        <EditEntity
            entity="teacher"
            title={`Edit teacher ${teacherId}`}
            description="Current values have already been filled in."
            fields={fields}
            hiddenInputs={hiddenInputs}
        />
    );
}
