import { family } from '@/lib/db/schema';
import EntityId, { displaySectionGroup } from '@/components/data-view/entity-id';
import { Table } from '@/lib/data-view/types';
import { familyTable } from '../family-helpers';

interface FamilyPageProps {
    params: Promise<{
        familyid: string;
    }>
}

export default async function FamilyPage({ params }: FamilyPageProps) {
    const family_id = parseInt((await params).familyid);

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup<'family', Table<"family">>[] = [
        {
            label: "Family Information",
            display: [
                {
                    label: "Family ID",
                    key: "familyid"
                },
                {
                    label: "User ID",
                    key: "userid"
                },
                {
                    label: "Father First Name",
                    key: "fatherfirsten",
                    fallback: "Not provided"
                },
                {
                    label: "Father Last Name", 
                    key: "fatherlasten",
                    fallback: "Not provided"
                },
                {
                    label: "Father Name (CN)",
                    key: "fathernamecn",
                    fallback: "Not provided"
                },
                {
                    label: "Mother First Name",
                    key: "motherfirsten",
                    fallback: "Not provided"
                },
                {
                    label: "Mother Last Name",
                    key: "motherlasten", 
                    fallback: "Not provided"
                },
                {
                    label: "Mother Name (CN)",
                    key: "mothernamecn",
                    fallback: "Not provided"
                }
            ]
        },
        {
            label: "Contact Information",
            display: [
                {
                    label: "Address Line 1",
                    key: "address1",
                    fallback: "Not provided"
                }
            ]
        }
    ];

    return (
        <EntityId<"family", familyTable, 'familyid'>
            table={family}
            tableName="family"
            primaryKey="familyid"
            titleCol="familyid"
            displaySections={displaySections}
            notFoundMessage="Family not found"
            id={family_id}
        />
    );
} 