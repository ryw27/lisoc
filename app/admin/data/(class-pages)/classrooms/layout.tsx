"use client";

// import { useIdMaps } from "@/lib/data-view/providers";
import React from "react";
import { InferSelectModel } from "drizzle-orm";
import { classrooms } from "@/lib/db/schema";
import { type FilterableColumn } from "@/types/dataview.types";
import ConfigLayout from "@/components/data-view/config-layout";
import DataTableColumnHeader from "@/components/data-view/data-table/data-table-header";

export default function ClassroomsLayoutPage({ children }: { children: React.ReactNode }) {
    // const idMaps = useIdMaps();
    const classroomColumns = getClassroomColumns();
    return (
        <ConfigLayout entity="classrooms" columns={classroomColumns}>
            {children}
        </ConfigLayout>
    );
}

function getClassroomColumns() {
    const classroomColumns: FilterableColumn<InferSelectModel<typeof classrooms>>[] = [
        {
            id: "roomid",
            accessorKey: "roomid",
            meta: {
                filter: {
                    type: "number",
                    mode: ["=", "≠", ">", "<", ">=", "<=", "between"] as const,
                },
                label: "Room ID",
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Room ID" tableType="client" />
            ),
            enableHiding: false,
        },
        {
            id: "roomno",
            accessorKey: "roomno",
            meta: {
                filter: {
                    type: "number",
                    mode: ["=", "≠", ">", "<", ">=", "<=", "between"] as const,
                },
                label: "Room Number",
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Room Number" tableType="client" />
            ),
            enableHiding: false,
        },
        {
            id: "roomcapacity",
            accessorKey: "roomcapacity",
            meta: {
                filter: {
                    type: "number",
                    mode: ["=", "≠", ">", "<", ">=", "<=", "between"] as const,
                },
                label: "Room Capacity",
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Room Capacity" tableType="client" />
            ),
            enableHiding: false,
        },
        {
            id: "status",
            accessorKey: "status",
            meta: {
                filter: {
                    type: "enum",
                    mode: ["=", "≠"],
                    options: ["Active", "Inactive"] as const,
                },
                label: "Status",
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" tableType="client" />
            ),
            enableHiding: false,
        },
        {
            id: "notes",
            accessorKey: "notes",
            meta: {
                filter: { type: "text", mode: ["="] as const },
                label: "Notes",
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Notes" tableType="client" />
            ),
            enableHiding: false,
        },
    ];
    return classroomColumns;
}
