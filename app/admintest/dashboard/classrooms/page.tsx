"use client";
import { Classroom } from "@/app/admintest/components/columns/column-types";
import { classroomColumns } from "@/app/admintest/components/columns/column-types";
import DataTable from "@/app/admintest/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import HorizontalNav from "@/components/horizontal-nav";
import { useState } from "react";
export default function ClassroomsPage() {
    const [selectedTab, setSelectedTab] = useState("classrooms");
    const mockClassrooms: Classroom[] = [
        {
            room_id: 1,
            classroom_name: "Classroom 1",
            seats: 10,
            status: "Active",
            notes: "Notes 1",
        },
        {
            room_id: 2,
            classroom_name: "Classroom 2",
            seats: 20,
            status: "Inactive",
            notes: "Notes 2",
        },
        {
            room_id: 3,
            classroom_name: "Classroom 3",
            seats: 30,
            status: "Active",
            notes: "Notes 3",
        },
        {
            room_id: 4,
            classroom_name: "Classroom 4",
            seats: 40,
            status: "Inactive",
            notes: "Notes 4",
        },
    ]

    const tabs = [
        {
            label: "Classes",
            value: "classes",
        },
        {
            label: "Classrooms",
            value: "classrooms",
        }
    ]

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Class Management</h1>
            <HorizontalNav tabs={tabs} selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
            <DataTable data={mockClassrooms} columns={classroomColumns as ColumnDef<Classroom>[]} />
        </div>
    )
}