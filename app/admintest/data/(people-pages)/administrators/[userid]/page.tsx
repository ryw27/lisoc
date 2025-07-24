import { adminuser } from '@/app/lib/db/schema';
import EntityId, { displaySectionGroup } from '@/components/entity-id';
import { Table } from '@/app/lib/entity-types';
import { administratorTable } from '../admin-helpers';

interface AdministratorPageProps {
    params: Promise<{
        userid: string;
    }>
}

export default async function AdministratorPage({ params }: AdministratorPageProps) {
    const admin_id = parseInt((await params).userid);

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup<'adminuser', Table<"adminuser">>[] = [
        {
            label: "Administrator Information",
            display: [
                {
                    label: "Admin ID",
                    key: "adminid"
                },
                {
                    label: "User ID",
                    key: "userid"
                },
                {
                    label: "Role ID",
                    key: "roleid"
                },
                {
                    label: "Name (CN)",
                    key: "namecn"
                },
                {
                    label: "Last Name",
                    key: "namelasten"
                },
                {
                    label: "First Name",
                    key: "namefirsten"
                },
                {
                    label: "Family ID",
                    key: "familyid",
                    fallback: "Not linked"
                }
            ]
        },
        {
            label: "Status & Management",
            display: [
                {
                    label: "Address Line 2",
                    key: "address2",
                    fallback: "Not provided"
                },
                {
                    label: "Status",
                    key: "status",
                    formatter: (value: any) => value ? "Active" : "Inactive"
                },
                {
                    label: "Change Password Next Login",
                    key: "ischangepwdnext",
                    formatter: (value: any) => value ? "Yes" : "No"
                },
                {
                    label: "Created By",
                    key: "createby",
                    fallback: "Unknown"
                },
                {
                    label: "Updated By",
                    key: "updateby",
                    fallback: "Unknown"
                },
                {
                    label: "Updated On",
                    key: "updateon",
                    formatter: (value: any) => value ? new Date(value as string).toLocaleDateString() : "Never updated"
                },
                {
                    label: "Notes",
                    key: "notes",
                    fallback: "No notes available"
                }
            ]
        }
    ];

    return (
        <EntityId<"adminuser", administratorTable, 'adminid'>
            table={adminuser}
            tableName="adminuser"
            primaryKey="adminid"
            titleCol="namecn"
            displaySections={displaySections}
            notFoundMessage="Administrator not found"
            id={admin_id}
        />
    );
} 