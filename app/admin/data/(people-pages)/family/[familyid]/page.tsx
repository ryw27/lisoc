import { notFound } from "next/navigation";
import { InferSelectModel } from "drizzle-orm";
import { family } from "@/lib/db/schema";
import { getIDRow } from "@/server/data-view/actions/getIDRow";
import { UserObject } from "@/server/data-view/entity-configs/(people)/users";
import EntityId, { displaySectionGroup } from "@/components/data-view/id-entity-view/entity-id";

interface FamilyPageProps {
    params: Promise<{
        familyid: string;
    }>;
}

export default async function FamilyPage({ params }: FamilyPageProps) {
    const family_id = parseInt((await params).familyid);

    const response = await getIDRow("family", family_id);
    if (!response.ok || !response.data) {
        return notFound();
    }

    type JoinedRow = { users: UserObject; family: InferSelectModel<typeof family> };
    const rows = response.data as JoinedRow;
    const data = {
        ...(rows.family ?? {}),
        ...(rows.users ?? {}),
    };

    const displaySections: displaySectionGroup[] = [
        {
            section: "User Details",
            display: [
                {
                    label: "Username",
                    value: data.name ?? "N/A",
                },
                {
                    label: "Email",
                    value: data.email,
                },
            ],
        },
        {
            section: "Family Information",
            display: [
                {
                    label: "Father Name (CN)",
                    value: data.fathernamecn ?? "N/A",
                },
                {
                    label: "Father First Name",
                    value: data.fatherfirsten ?? "N/A",
                },
                {
                    label: "Father Last Name",
                    value: data.fatherlasten ?? "N/A",
                },
                {
                    label: "Mother Name (CN)",
                    value: data.mothernamecn ?? "N/A",
                },
                {
                    label: "Mother First Name",
                    value: data.motherfirsten ?? "N/A",
                },
                {
                    label: "Mother Last Name",
                    value: data.motherlasten ?? "N/A",
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
                    label: "Office Phone",
                    value: data.officephone ?? "N/A",
                },
                {
                    label: "Cell Phone",
                    value: data.cellphone ?? "N/A",
                },
                {
                    label: "Email 2",
                    value: data.email2 ?? "N/A",
                },
            ],
        },
        {
            section: "Other Information",
            display: [
                {
                    label: "School Member",
                    value: data.schoolmember ?? "N/A",
                },
                {
                    label: "Remark",
                    value: data.remark ?? "N/A",
                },
            ],
        },
    ];
    return (
        <EntityId
            title={`Family ${String(family_id)}`}
            entity="family"
            displayFields={displaySections}
            id={String(family_id)}
        />
    );
}
