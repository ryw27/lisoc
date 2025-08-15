"use client";
import React from "react";
import ConfigLayout from "@/components/data-view/config-layout";
import { FilterableColumn } from "@/lib/data-view/types";
import { AdminUserJoined } from "@/lib/data-view/entity-configs/(people)/adminuser";
import DataTableColumnHeader from "@/components/data-view/data-table/data-table-header";

export default function AdministratorsLayout({ children }: { children: React.ReactNode }) {
	const columns = getAdministratorColumns();
	return (
		<ConfigLayout
			entity="adminuser"
			columns={columns}
		>
			{children}
		</ConfigLayout>
	);
}

function getAdministratorColumns() {
	const adminColumns: FilterableColumn<AdminUserJoined>[] = [
		{
			id: "adminid",
			accessorKey: "adminid",
			meta: {
				filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
				label: "Admin ID",
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Admin ID" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "name",
			accessorKey: "name",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Username"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Username" tableType="server" />
			),
			enableHiding: false,
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
			id: "firstname",
			accessorKey: "firstname",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "First Name"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="First Name" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "lastname",
			accessorKey: "lastname",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Last Name"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Last Name" tableType="server" />
			),
			enableHiding: false,
		},
		{
			id: "address1",
			accessorKey: "address1",
			meta: {
				filter: { type: 'text', mode: ['='] as const },
				label: "Address"
			},
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Address" tableType="server" />
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
	return adminColumns;
}


