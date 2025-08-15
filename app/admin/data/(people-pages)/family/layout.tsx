"use client";
import React from "react";
import ConfigLayout from "@/components/data-view/config-layout";
import { FilterableColumn } from "@/lib/data-view/types";
import DataTableColumnHeader from "@/components/data-view/data-table/data-table-header";
import { FamilyJoined } from "@/lib/data-view/entity-configs/(people)/family";

export default function FamiliesLayout({ children }: { children: React.ReactNode }) {
	const columns = getFamilyColumns();
	return (
		<ConfigLayout
			entity="family"
			columns={columns}
		>
			{children}
		</ConfigLayout>
	);
}

function getFamilyColumns() {
  	const familyColumns: FilterableColumn<FamilyJoined>[] = [
    	{
			id: "name",
			accessorKey: "name",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Name"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" tableType="server" />
			),
		},
		{
			id: "email",
			accessorKey: "email",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Email"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Email" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "address",
			accessorKey: "address",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Address"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Address" tableType="server" />
			),
		},
		{
			id: "city",
			accessorKey: "city",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "City"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="City" tableType="server" />
			),
		},
		{
			id: "state",
			accessorKey: "state",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "State"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="State" tableType="server" />
			),
		},
		{
			id: "zip",
			accessorKey: "zip",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Zip"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Zip" tableType="server" />
			),
		},
		{
			id: "phone",
			accessorKey: "phone",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Phone"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Phone" tableType="server" />
			),
		},
		{
			id: "createon",
			accessorKey: "createon",
			meta: {
				filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] },
				label: "Create On"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Create On" tableType="server" />	
			),
		},
		{
			id: "lastlogin",
			accessorKey: "lastlogin",
			meta: {
				filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] },
				label: "Last Login"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Last Login" tableType="server" />
			),
		},
		{
			id: "updateon",
			accessorKey: "updateon",
			meta: {
				filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] },
				label: "Update On"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Update On" tableType="server" />
			),
		},
		{
			id: "fatherfirsten",
			accessorKey: "fatherfirsten",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Father First Name (EN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Father First Name (EN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "fatherlasten",
			accessorKey: "fatherlasten",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Father Last Name (EN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Father Last Name (EN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "fathernamecn",
			accessorKey: "fathernamecn",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Father Name (CN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Father Name (CN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "motherfirsten",
			accessorKey: "motherfirsten",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Mother First Name (EN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Mother First Name (EN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "motherlasten",
			accessorKey: "motherlasten",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Mother Last Name (EN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Mother Last Name (EN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "mothernamecn",
			accessorKey: "mothernamecn",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Mother Name (CN)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Mother Name (CN)" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "contact",
			accessorKey: "contact",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Contact (Phone)"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Contact (Phone)" tableType="server" />
			),
		},
		{
			id: "address1",
			accessorKey: "address1",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Address 2"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Address 2" tableType="server" />
			),
		},
		{
			id: "officephone",
			accessorKey: "officephone",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Office Phone"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Office Phone" tableType="server" />
			),
		},
		{
			id: "cellphone",
			accessorKey: "cellphone",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Cell Phone"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Cell Phone" tableType="server" />
			),
		},
		{
			id: "email2",
			accessorKey: "email2",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Email 2"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Email 2" tableType="server" />
			),
		},
		{
			id: "status",
			accessorKey: "status",
			meta: {
				filter: { type: 'enum', mode: ['=', '≠'], options: ['Active', 'Inactive'] },
				label: "Status"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" tableType="server" />
			),
		},
		{
			id: "remark",
			accessorKey: "remark",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Remark"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Remark" tableType="server" />
			),
		},
		{
			id: "schoolmember",
			accessorKey: "schoolmember",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "School Member"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="School Member" tableType="server" />
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
	];
  	return familyColumns;
}


