"use client";
import { useIdMaps } from "@/lib/data-view/providers";
import { FilterableColumn } from "@/lib/data-view/types";
import React from "react";
import { classTypeMap } from "@/lib/utils";
import DataTableColumnHeader from "@/components/data-view/data-table/data-table-header";
import { ClassObject } from "@/lib/data-view/entity-configs/(classes)/classes";
import ConfigLayout from "@/components/data-view/config-layout";
import { IdMaps } from "@/lib/registration/types";


export default function ClassLayoutPage({ children }: { children: React.ReactNode}) {
    const idMaps = useIdMaps();
    const classColumns = getClassColumns(idMaps);
    return (
        <ConfigLayout
            entity="classes"
            children={children} 
            columns={classColumns}
        />
    ) 
}


function getClassColumns(idMaps: IdMaps) {
    const classColumns: FilterableColumn<ClassObject>[] = [
        {
            id: "classid",
            accessorKey: "classid",
            meta: {
                filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
                label: "Class ID"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Class ID" tableType="server" />
            ),
            enableHiding: false,
        },
        {
            id: "classindex",
            accessorKey: "classindex",
            meta: {
                filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
                label: "Class Index"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Class Index" tableType="server" />
            ),
        },
        {
            id: "ageid",
            accessorKey: "ageid",
            meta: {
                filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
                label: "Age ID"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Age ID" tableType="server" />
            ),
        },
        {
            id: "typeid",
            accessorKey: "typeid",
            meta: {
                filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
                label: "Class Type"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Class Type" tableType="server" />
            ),
            cell: ({ row }) => {
                const typeid = row.original.typeid;
                const type = classTypeMap[typeid as keyof typeof classTypeMap];
                return (
                    <span title={`Class Type ID: ${typeid}`}>
                        {type?.typenamecn || "Unknown"}
                    </span>
                );
            }
        },
        {
            id: "gradeclassid",
            accessorKey: "gradeclassid",
            meta: {
                filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
                label: "Grade Class ID"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Grade Class ID" tableType="server" />
            ),
            cell: ({ row }) => {
                const gradeclassid = row.original.gradeclassid;
                const gradeclass = idMaps.classMap[gradeclassid as keyof typeof idMaps.classMap];
                return (
                    <span title={`Class ID: ${gradeclassid}`}>
                        {gradeclass?.classnamecn || "Unknown"}
                    </span>
                );
            }
        },
        {
            id: "classno",
            accessorKey: "classno",
            meta: {
                filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
                label: "Class Level"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Class Level" tableType="server" />
            ),
        },
        {
            id: "classnamecn",
            accessorKey: "classnamecn",
            meta: {
                filter: { type: 'text', mode: ['='] as const },
                label: "Class Name (CN)"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Class Name (CN)" tableType="server" />
            ),
            enableHiding: false
        },
        {
            id: "classnameen",
            accessorKey: "classnameen",
            meta: {
                filter: { type: 'text', mode: ['='] as const },
                label: "Class Name (EN)"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Class Name (EN)" tableType="server" />
            ),
            enableHiding: false
        },
        {
            id: "sizelimits",
            accessorKey: "sizelimits",
            meta: {
                filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
                label: "Size Limits"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Size Limits" tableType="server" />
            ),
        },
        {
            id: "status",
            accessorKey: "status",
            meta: {
                filter: { type: 'enum', mode: ['=', '≠'] as const, options: ["Active", "Inactive"] as const },
                label: "Status"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" tableType="server" />
            ),
        },
        {
            id: "description",
            accessorKey: "description",
            meta: {
                filter: { type: 'text', mode: ['='] as const },
                label: "Description"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" tableType="server" />
            ),
        },
        {
            id: "lastmodify",   
            accessorKey: "lastmodify",
            meta: {
                filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] as const },
                label: "Last Modified"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Modified" tableType="server" />
            ),
        },
        {
            id: "createby",
            accessorKey: "createby",
            meta: {
                filter: { type: 'text', mode: ['='] as const },
                label: "Created By"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created By" tableType="server" />
            ),
        },
        {
            id: "createon",
            accessorKey: "createon",
            meta: {
                filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] as const },
                label: "Created On"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created On" tableType="server" />
            ),
            sortingFn: "datetime"
        },
        {
            id: "updateby",
            accessorKey: "updateby",
            meta: {
                filter: { type: 'text', mode: ['='] as const },
                label: "Updated By"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated By" tableType="server" />
            ),
        },
        {
            id: "updateon",
            accessorKey: "updateon",
            meta: {
                filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] as const },
                label: "Last Updated On"
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Last Updated On" tableType="server" />
            ),
            sortingFn: "datetime"
        }
    ]

    return classColumns
}