import EntityId, { displaySectionGroup } from '@/components/data-view/id-entity-view/entity-id';
import getIDRow from '@/lib/data-view/actions/getIDRow';
import { ClassObject } from '@/lib/data-view/entity-configs/(classes)/classes';
import { classTypeMap } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface ClassPageProps {
    params: Promise<{
        classid: string;
    }>
}

export default async function ClassIDPage({ params }: ClassPageProps) {
    const class_id = parseInt((await params).classid);

    const response = await getIDRow("classes", class_id);
    if (!response.ok || !response.data) {
        return notFound() 
    } 

    const curClass = response.data as ClassObject;
    const regClass = curClass.gradeclassid ? (await getIDRow("classes", curClass.gradeclassid)).data as ClassObject : null;
    const upgradeClass = curClass.classupid ? (await getIDRow("classes", curClass.classupid)).data as ClassObject : null;

    // Define display sections with type-safe keys using the table schema
    const displaySections: displaySectionGroup[] = [
        {
            section: "Class Information",
            display: [
                {
                    label: "Class ID",
                    value: String(curClass.classid)
                },
                {
                    label: "English Name",
                    value: curClass.classnameen ?? "No given english class name"
                },
                {
                    label: "Registration Class",
                    value: regClass ? `${regClass.classnamecn} - ${regClass.classnameen}` : "No registration class"
                },
                {
                    label: "Upgrade Class",
                    value: upgradeClass ? `${upgradeClass.classnamecn} - ${upgradeClass.classnameen}` : "No upgrade class"
                },
                {
                    label: "Class Type",
                    value: curClass.typeid ? `${classTypeMap[curClass.typeid as keyof typeof classTypeMap].typenameen} ${classTypeMap[curClass.typeid as keyof typeof classTypeMap].typenamecn}`: "No type available"
                },
                {
                    label: "Class Level",
                    value: curClass.classno ?? "No given class level"
                },
                {
                    label: "Size Limits",
                    value: curClass.sizelimits ? String(curClass.sizelimits) : "No given size limits"
                },
                {
                    label: "Status",
                    value: curClass.status ?? "No given status"
                }
            ]
        },
        {
            section: "Additional Information",
            display: [
                {
                    label: "Description",
                    value: curClass.description ?? "No description available"
                },

                {
                    label: "Class Index",
                    value: curClass.classindex ? String(curClass.classindex) : "No class index available"
                },
                {
                    label: "Last Modified",
                    value: curClass.lastmodify ? new Date(curClass.lastmodify as string).toLocaleDateString() : "Never modified"
                },
                {
                    label: "Created On",
                    value: curClass.createon ? new Date(curClass.createon as string).toLocaleDateString() : "Never created"
                },
                {
                    label: "Created By",
                    value: curClass.createby ?? "No creator"
                },
                {
                    label: "Updated By",
                    value: curClass.updateby ?? "No updater"
                },
                {
                    label: "Updated On",
                    value: curClass.updateon ? new Date(curClass.updateon as string).toLocaleDateString() : "Never updated"
                }
            ]
        }
    ];

    return (
        <EntityId
            title={`Class ${String(curClass.classid)} - ${curClass.classnamecn}`}
            entity="classes"
            displayFields={displaySections}
            id={String(class_id)}
        />
    );
}
