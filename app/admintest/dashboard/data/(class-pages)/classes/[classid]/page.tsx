import { db } from '@/app/lib/db';
import { classes } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import EntityId, { displaySectionGroup } from '@/components/entity-id';
import { Table } from '@/app/lib/entity-types';
import { classTable } from '../class-helpers';

interface ClassPageProps {
    params: Promise<{
        classid: string;
    }>
}

export default async function ClassPage({ params }: ClassPageProps) {
    const class_id = parseInt((await params).classid);
    
    // Fetch the specific class
    const classData = await db.query.classes.findFirst({
        where: eq(classes.classid, class_id)
    });

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup<'classes', Table<"classes">>[] = [
        {
            label: "Class Information",
            display: [
                {
                    label: "Class ID",
                    key: "classid"
                },
                {
                    label: "English Name",
                    key: "classnameen",
                    fallback: "No English name provided"
                },
                {
                    label: "Class Level",
                    key: "classno"
                },
                {
                    label: "Size Limits",
                    key: "sizelimits",
                    fallback: "No limit set"
                },
                {
                    label: "Status",
                    key: "status"
                }
            ]
        },
        {
            label: "Additional Information",
            display: [
                {
                    label: "Description",
                    key: "description",
                    fallback: "No description available"
                },
                {
                    label: "Type ID",
                    key: "typeid",
                    fallback: "No type available"
                },
                {
                    label: "Last Modified",
                    key: "lastmodify",
                    formatter: (value: any) => value ? new Date(value as string).toLocaleDateString() : "Never modified"
                },
                {
                    label: "Created On",
                    key: "createon",
                    formatter: (value: any) => new Date(value as string).toLocaleDateString()
                },
                {
                    label: "Created By",
                    key: "createby"
                },
                {
                    label: "Updated By",
                    key: "updateby"
                },
                {
                    label: "Updated On",
                    key: "updateon",
                    formatter: (value: any) => new Date(value as string).toLocaleDateString()
                }
            ]
        }
    ];

    return (
        <EntityId<"classes", classTable, 'classid'>
            table={classes}
            tableName="classes"
            primaryKey="classid"
            displaySections={displaySections}
            notFoundMessage="Class not found"
            id={class_id}
        />
    );
}
