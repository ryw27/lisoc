import { notFound } from "next/navigation";
import { InferSelectModel } from "drizzle-orm";
import { adminuser, users } from "@/lib/db/schema";
import { getIDRow } from "@/server/data-view/actions/getIDRow";
import EntityId, { displaySectionGroup } from "@/components/data-view/id-entity-view/entity-id";

interface AdministratorPageProps {
    params: Promise<{
        userid: string;
    }>;
}

export default async function AdministratorPage({ params }: AdministratorPageProps) {
    const admin_id = parseInt((await params).userid);

    const response = await getIDRow("adminuser", admin_id);
    if (!response.ok || !response.data) {
        return notFound();
    }

    type JoinedRow = {
        users: InferSelectModel<typeof users>;
        adminuser: InferSelectModel<typeof adminuser>;
    };
    const rows = response.data as JoinedRow;
    const data = {
        ...(rows.adminuser ?? {}),
        ...(rows.users ?? {}),
    };

    const displaySections: displaySectionGroup[] = [
        {
            section: "User Details",
            display: [
                {
                    label: "Chinese Name",
                    value: data.namecn,
                },
                {
                    label: "First Name",
                    value: data.firstname,
                },
                {
                    label: "Last Name",
                    value: data.lastname,
                },
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
            section: "Contact Details",
            display: [
                {
                    label: "Address",
                    value: data.address ?? "N/A",
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
                    label: "Status",
                    value: data.status,
                },
                {
                    label: "Created On",
                    value: data.createon ?? "N/A",
                },
                {
                    label: "Last Login",
                    value: data.lastlogin ?? "N/A",
                },
                {
                    label: "Roles",
                    value: data.roles.join(", "),
                },
                {
                    label: "User ID",
                    value: data.userid ?? "N/A",
                },
                {
                    label: "Admin ID",
                    value: String(data.adminid ?? "N/A"),
                },
            ],
        },
        {
            section: "Notes",
            display: [
                {
                    label: "Notes",
                    value: data.notes ?? "N/A",
                },
            ],
        },
    ];

    return (
        <EntityId
            title={`Administrator ${String(admin_id)}`}
            entity="adminuser"
            displayFields={displaySections}
            id={String(admin_id)}
        />
    );
}
