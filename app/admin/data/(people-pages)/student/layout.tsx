"use client";
import React from "react";
import ConfigLayout from "@/components/data-view/config-layout";
import { useIdMaps } from "@/lib/data-view/providers";
import { FilterableColumn } from "@/lib/data-view/types";
import { IdMaps } from "@/lib/registration/types";
import { StudentObject } from "@/lib/data-view/entity-configs/(people)/student";
import DataTableColumnHeader from "@/components/data-view/data-table/data-table-header";

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
    const idMaps = useIdMaps();
    const columns = getStudentColumns(idMaps);
    return <ConfigLayout entity="student" children={children} columns={columns} />;
}

function getStudentColumns(_idMaps: IdMaps) {
	const studentColumns: FilterableColumn<StudentObject>[] = [
		{
			id: "familyid",
			accessorKey: "familyid",
			meta: {
				filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
				label: "Family ID"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Family ID" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "studentno",
			accessorKey: "studentno",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Student No"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Student No" tableType="server" />
			),
		},
		{
			id: "namecn",
			accessorKey: "namecn",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Name (CN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name (CN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "namelasten",
			accessorKey: "namelasten",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Last Name (EN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Last Name (EN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "namefirsten",
			accessorKey: "namefirsten",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "First Name (EN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="First Name (EN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "gender",
			accessorKey: "gender",
			meta: {
				filter: { type: 'enum', mode: ['=', '≠'], options: ['Male', 'Female'] as const },
				label: "Gender"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Gender" tableType="server" />
			),
		},
		{
			id: "ageof",
			accessorKey: "ageof",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Age of"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Age of" tableType="server" />
			),
		},
		{
			id: "age",		
			accessorKey: "age",
			meta: {
				filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
				label: "Age"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Age" tableType="server" />
			),
		},	
		{
			id: "dob",
			accessorKey: "dob",
			meta: {
				filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] },
				label: "Date of Birth"
				},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Date of Birth" tableType="server" />
			),
		},
		{
			id: "active",
			accessorKey: "active",
			meta: {
				filter: { type: 'enum', mode: ['=', '≠'], options: ['Active', 'Inactive'] as const },
				label: "Active"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Active" tableType="server" />
			),
		},
		{
			id: "createddate",
			accessorKey: "createddate",
			meta: {
				filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] },	
				label: "Create On"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Create On" tableType="server" />
			),
		},
		{
			id: "lastmodify",
			accessorKey: "lastmodify",	
			meta: {
				filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] },
				label: "Last Modify"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Last Modify" tableType="server" />
			),
		},
		{
			id: "notes",
			accessorKey: "notes",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Notes"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Notes" tableType="server" />
			),
		},
	];
	return studentColumns;
}