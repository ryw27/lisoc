import EditEntity from "@/components/data-view/edit-entity/edit-entity";
import { FormSections } from "@/lib/data-view/types";
import { getIDRow } from "@/lib/data-view/actions/getIDRow";
import { notFound } from "next/navigation";
import { US_STATES } from "@/lib/utils";
import { UserObject } from "@/lib/data-view/entity-configs/(people)/users";
import { InferSelectModel } from "drizzle-orm";
import { adminuser } from "@/lib/db/schema";

export default async function EditAdministratorPage({
	params,
}: {
	params: Promise<{ userid: string }>;
}) {
	const { userid } = await params;
	const adminId = parseInt(userid);

	const response = await getIDRow("adminuser", adminId);
	if (!response.ok || !response.data) {
		return notFound();
	}

	type JoinedRow = { users: UserObject; adminuser: InferSelectModel<typeof adminuser> };
	const rows = response.data as JoinedRow;
	const data = {
		...(rows.adminuser ?? {}),
		...(rows.users ?? {}),
	}

	const fields: FormSections[] = [
		{
			section: "User Details",
			sectionFields: [
				{
					name: "namecn",
					label: "Chinese Name",
					type: "text",
					placeholder: "Enter the Chinese name",
					defaultValue: data.namecn,
				},
				{
					name: "firstname",
					label: "First Name",
					type: "text",
					placeholder: "Enter the first name",
					width: "half",
					defaultValue: data.firstname,
				},
				{
					name: "lastname",
					label: "Last Name",
					type: "text",
					placeholder: "Enter the last name",
					width: "half",
					defaultValue: data.lastname,
				},
				{
					name: "name",
					label: "Username",
					type: "text",
					placeholder: "Enter the username",
					width: "half",
					defaultValue: data.name ?? undefined,
				},
				{
					name: "email",
					label: "Email",
					type: "text",
					placeholder: "Enter the email",
					width: "half",
					defaultValue: data.email,
				},
				{
					name: "password",
					label: "Password",
					type: "password",
					placeholder: "Enter the password",
					width: "half",
					defaultValue: data.password ?? undefined,
				},
				{
					name: "status",
					label: "Status",
					type: "select",
					placeholder: "Select the status",
					width: "half",
					options: [
						{
							labelen: "Active",
							labelcn: "Active",
							val: "Active",
						},
						{
							labelen: "Inactive",
							labelcn: "Inactive",
							val: "Inactive",
						},
					],
					defaultValue: data.status ?? undefined,
				},
			],
		},
		{
			section: "Contact Details",
			sectionFields: [
				{
					name: "address",
					label: "Address",
					type: "text",
					placeholder: "Enter the address",
					defaultValue: data.address ?? undefined,
				},
				{
					name: "city",
					label: "City",
					type: "text",
					placeholder: "Enter the city",
					width: "third",
					defaultValue: data.city ?? undefined,
				},
				{
					name: "state",
					label: "State",
					type: "select",
					placeholder: "Enter the state",
					width: "third",
					options: US_STATES.map((state) => ({
						labelen: state,
						labelcn: state,
						val: state,
					})),
					defaultValue: data.state ?? undefined,
				},
				{
					name: "zip",
					label: "Zip",
					type: "text",
					placeholder: "Enter the zip",
					width: "third",
					defaultValue: data.zip ?? undefined,
				},
				{
					name: "phone",
					label: "Phone",
					type: "text",
					placeholder: "Enter the phone",
					defaultValue: data.phone ?? undefined,
				},
				{
					name: "address1",
					label: "Address 2",
					type: "text",
					placeholder: "Enter the address 2",
					defaultValue: data.address1 ?? undefined,
				}
			]
		},
		{
			section: "Notes",
			sectionFields: [
				{
					name: "notes",
					label: "Notes",
					type: "textarea",
					placeholder: "Enter any additional notes",
					defaultValue: data.notes ?? undefined,
				}
			]
		}
	];

	const hiddenInputs = { adminid: adminId };

	return (
		<EditEntity
			entity="adminuser"
			title={`Edit administrator ${adminId}`}
			description="Current values have already been filled in."
			fields={fields}
			hiddenInputs={hiddenInputs}
		/>
	);
}