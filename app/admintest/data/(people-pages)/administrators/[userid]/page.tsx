import { adminuser } from '@/lib/db/schema';
import EntityId, { displaySectionGroup } from '@/components/data-view/entity-id';
import { Table } from '@/lib/data-view/types';
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
                    label: "Name (CN)",
                    key: "namecn"
                },
            ]
        },
        {
            label: "Status & Management",
            display: [
                {
                    label: "Status",
                    key: "status",
                    formatter: (value) => value ? "Active" : "Inactive"
                },
                {
                    label: "Change Password Next Login",
                    key: "ischangepwdnext",
                    formatter: (value) => value ? "Yes" : "No"
                },
                {
                    label: "Create By",
                    key: "createby",
                    formatter: (value) => value ? new Date(value as string).toLocaleDateString() : "Never created"
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