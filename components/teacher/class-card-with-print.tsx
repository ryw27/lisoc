"use client";

import { useRef } from "react";
import { teacherClassStudentView } from "@/types/shared.types";
import TeacherWithClassStudent from "@/components/teacher/teacherClassView";

interface ClassCardWithPrintProps {
    arrangeid: string;
    classnamecn: string;
    roomno: string;
    period: string;
    teachernamecn: string;
    teacherphone: string;
    studentCount: number;
    allClassStudent: teacherClassStudentView[];
}

export default function ClassCardWithPrint({
    arrangeid,
    classnamecn,
    roomno,
    period,
    teachernamecn,
    teacherphone,
    studentCount,
    allClassStudent,
}: ClassCardWithPrintProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const printContainerRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (printContainerRef.current && printRef.current) {
            // Get the student table
            const studentTable = printRef.current.querySelector("[data-student-table]");

            // Create print content with only data
            const printContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="margin: 0 0 15px 0;">Class: ${classnamecn}</h2>
                    <div style="margin-bottom: 10px;">
                        <p style="margin: 5px 0;"><strong>Classroom:</strong> ${roomno}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${period}</p>
                        <p style="margin: 5px 0;"><strong>Teacher:</strong> ${teachernamecn}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${teacherphone}</p>
                        <p style="margin: 5px 0;"><strong>Total Students:</strong> ${studentCount}</p>
                    </div>
                    <div style="margin-top: 20px;">
                        ${studentTable ? studentTable.innerHTML : ""}
                    </div>
                </div>
            `;

            printContainerRef.current.innerHTML = printContent;

            // Print the container
            const printWindow = window.open("", "", "height=600,width=800");
            if (printWindow) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Class Report - ${classnamecn}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            table { border-collapse: collapse; width: 100%; margin-top: 15px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                    </body>
                    </html>
                `);
                printWindow.document.close();

                // Wait for content to load before printing
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    return (
        <div key={arrangeid} className="flex flex-col gap-2" ref={printRef}>
            <div className="border-gray flex cursor-pointer flex-col border-2 p-4 transition-colors duration-200">
                <div className="mb-3 flex items-start justify-between">
                    <h1 className="font-bold">Class {classnamecn}</h1>
                    <button
                        data-print-button
                        onClick={handlePrint}
                        className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                    >
                        Print
                    </button>
                </div>
                <div className="flex gap-x-16">
                    <div className="whitespace-nowrap">classroom : {roomno}</div>
                    <div>time : {period}</div>
                </div>
                <div className="flex gap-x-16">
                    <div>teacher : {teachernamecn}</div>
                    <div>phone : {teacherphone}</div>
                </div>
                <div>Students: {studentCount}</div>
                <div data-student-table>
                    <TeacherWithClassStudent allClassStudent={allClassStudent} />
                </div>
            </div>
            {/* Hidden container for print content */}
            <div ref={printContainerRef} style={{ display: "none" }} />
        </div>
    );
}
