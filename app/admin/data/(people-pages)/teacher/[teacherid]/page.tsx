import { notFound } from "next/navigation";
import { InferSelectModel } from "drizzle-orm";
import { teacher } from "@/lib/db/schema";
import { classTypeMap } from "@/lib/utils";
import { getIDRow } from "@/server/data-view/actions/getIDRow";
import { UserObject } from "@/server/data-view/entity-configs/(people)/users";
import EntityId, { displaySectionGroup } from "@/components/data-view/id-entity-view/entity-id";

interface TeacherPageProps {
    params: Promise<{
        teacherid: string;
    }>;
}

export default async function TeacherPage({ params }: TeacherPageProps) {
    const teacher_id = parseInt((await params).teacherid);

    const response = await getIDRow("teacher", teacher_id);
    if (!response.ok || !response.data) {
        return notFound();
    }

    type JoinedRow = { users: UserObject; teacher: InferSelectModel<typeof teacher> };
    const rows = response.data as JoinedRow;
    const data = {
        ...(rows.teacher ?? {}),
        ...(rows.users ?? {}),
    };

    const displaySections: displaySectionGroup[] = [
        {
            section: "User Details",
            display: [
                {
                    label: "Chinese Name",
                    value: data.namecn ?? "N/A",
                },
                {
                    label: "English Name",
                    value: data.namelasten ?? "N/A",
                },
                {
                    label: "Email",
                    value: data.email ?? "N/A",
                },
                {
                    label: "Username",
                    value: data.name ?? "",
                },
            ],
        },
        {
            section: "Teacher Details",
            display: [
                {
                    label: "Teacher Index",
                    value: data.teacherindex?.toString() ?? "N/A",
                },
                {
                    label: "Class Type ID",
                    value:
                        classTypeMap[data.classtypeid as keyof typeof classTypeMap]?.typenameen ??
                        "N/A",
                },
                {
                    label: "Status",
                    value: data.status,
                },
            ],
        },
        {
            section: "Contact Details",
            display: [
                {
                    label: "Address",
                    value: data.address1 ?? "N/A",
                },
                {
                    label: "City",
                    value: data.city ?? "N/A",
                },
                {
                    label: "State",
                    value: data.state ?? "N/A",
                },
                {
                    label: "Zip",
                    value: data.zip ?? "N/A",
                },
                {
                    label: "Phone",
                    value: data.phone ?? "N/A",
                },
                {
                    label: "Address 2",
                    value: data.address1 ?? "N/A",
                },
            ],
        },
        {
            section: "Other Information",
            display: [
                {
                    label: "Notes",
                    value: data.profile ?? "N/A",
                },
                {
                    label: "Subject",
                    value: data.subject ?? "N/A",
                },
                {
                    label: "Created By",
                    value: data.createby ?? "N/A",
                },
                {
                    label: "Updated By",
                    value: data.updateby ?? "N/A",
                },
                {
                    label: "User ID",
                    value: data.userid ?? "",
                },
            ],
        },
    ];

    return (
        <EntityId
            title={`Teacher ${String(teacher_id)}`}
            entity="teacher"
            displayFields={displaySections}
            id={String(teacher_id)}
        />
    );
}
