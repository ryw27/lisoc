"use client";
import { useState } from "react";
import { classroomColumns, Classroom, Class , classColumns} from "@/app/admintest/components/columns/column-types";
import DataTable from "@/app/admintest/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import HorizontalNav from "@/components/horizontal-nav";

export default function ClassesPage() {
    const [selectedTab, setSelectedTab] = useState("classes");
    const mockClasses: Class[] = [
        {
            id: 1,
            class_name_cn: "Class 1",
            class_name_en: "Class 1",
            upgrade_class: "Class 1",
            class_level: "Class 1",
            class_type: "Class 1",
            status: "Active",
            updateBy: "Class 1",
            updateAt: new Date(),
            description: "Notes 1",
        },
        {
            id: 2,
            class_name_cn: "Class 2",
            class_name_en: "Class 2",
            upgrade_class: "Class 2",
            class_level: "Class 2",
            class_type: "Class 2",
            status: "Inactive",
            updateBy: "Class 2",
            updateAt: new Date(),
            description: "Notes 2",
        },
        {
            id: 3,
            class_name_cn: "中文课",
            class_name_en: "Chinese Class",
            upgrade_class: "Class 3",
            class_level: "Class 3",
            class_type: "Class 3",
            status: "Active",
            updateBy: "Class 3",
            updateAt: new Date(),
            description: "Notes 3",
        },
        {
            id: 4,
            class_name_cn: "英文课",
            class_name_en: "English Class",
            upgrade_class: "Class 4",
            class_level: "Class 4",
            class_type: "Class 4",
            status: "Inactive",
            updateBy: "Class 4",
            updateAt: new Date(),
            description: "Notes 4",
        },
        {
            id: 5,
            class_name_cn: "数学课",
            class_name_en: "Math Class",
            upgrade_class: "Class 5",
            class_level: "Class 5",
            class_type: "Class 5",
            status: "Active",
            updateBy: "Class 5",
            updateAt: new Date(),
            description: "Notes 5",
        },
    ];

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
            <h1 className="text-2xl font-bold">Classes</h1>
            <HorizontalNav tabs={tabs} selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
                <DataTable data={mockClasses} columns={classColumns as ColumnDef<Class>[]} />
        </div>
    )
}