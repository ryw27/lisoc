"use client";
import React from "react";
import ConfigLayout from "@/components/data-view/config-layout";
import { FilterableColumn } from "@/lib/data-view/types";
import { TeacherJoined } from "@/lib/data-view/entity-configs/(people)/teacher";
import DataTableColumnHeader from "@/components/data-view/data-table/data-table-header";

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
	const columns = getTeacherColumns();
	return (
		<ConfigLayout
			entity="teacher"
			columns={columns}
		>
			{children}
		</ConfigLayout>
	);
}

function getTeacherColumns() {
	const teacherColumns: FilterableColumn<TeacherJoined>[] = [
		{
			id: "teacherid",
			accessorKey: "teacherid",
			meta: {
				filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
				label: "Teacher ID"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Teacher ID" tableType="server" />
			),
			enableHiding: false,
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
			id: "teacherindex",
			accessorKey: "teacherindex",
			meta: {
				filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
				label: "Teacher Index"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Teacher Index" tableType="server" />
			),
		},
		{
			id: "classtypeid",
			accessorKey: "classtypeid",
			meta: {
				filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
				label: "Class Type ID"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Class Type ID" tableType="server" />
			),
		},
		{
			id: "status",
			accessorKey: "status",
			meta: {
				filter: { type: 'enum', mode: ['=', '≠'], options: ['Active', 'Inactive'] as const },
				label: "Status"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "ischangepwdnext",
			accessorKey: "ischangepwdnext",
			meta: {
				filter: { type: 'enum', mode: ['=', '≠'], options: ['Yes', 'No'] as const },
				label: "Is Change Password Next"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Is Change Password Next" tableType="server" />
			),
		},
		{
			id: "address1",
			accessorKey: "address1",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Address 1"
			},
		},
		{
			id: "subject",
			accessorKey: "subject",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Subject"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Subject" tableType="server" />
			),
		},
		{
			id: "profile",
			accessorKey: "profile",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Profile"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Profile" tableType="server" />
			),
		},
		{
			id: "createby",
			accessorKey: "createby",
			meta: {	
				filter: { type: 'text', mode: ['='] as const },
				label: "Create By"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Create By" tableType="server" />
			),
		},
		{
			id: "updateby",	
			accessorKey: "updateby",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Update By"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Update By" tableType="server" />
			),
		},
		{
			id: "userid",
			accessorKey: "userid",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "User ID"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="User ID" tableType="server" />
			),
		},
		{
			id: "createddate",
			accessorKey: "createddate",
			meta: {
				filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] },
				label: "Created Date"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Created Date" tableType="server" />
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
	return teacherColumns;
}