import EditEntity from "@/components/data-view/edit-entity/edit-entity";
import { FormSections } from "@/lib/data-view/types";
import { getIDRow } from "@/lib/data-view/actions/getIDRow";
import { notFound } from "next/navigation";
import { US_STATES } from "@/lib/utils";
import { UserObject } from "@/lib/data-view/entity-configs/(people)/users";
import { InferSelectModel } from "drizzle-orm";
import { family } from "@/lib/db/schema";

export default async function EditFamilyPage({
	params,
}: {
	params: Promise<{ familyid: string }>;
}) {
	const { familyid } = await params;
	const familyId = parseInt(familyid);

	const response = await getIDRow("family", familyId);
	if (!response.ok || !response.data) {
		return notFound();
	}

	type JoinedRow = { users: UserObject; family: InferSelectModel<typeof family> };
	const rows = response.data as JoinedRow;
	const data = {
		...(rows.family ?? {}),
		...(rows.users ?? {}),
	}

	const fields: FormSections[] = [
		{
			section: "User Details",
			sectionFields: [
				{
					name: "name",
					label: "Username",
					type: "text",
					placeholder: "Enter name...",
					required: true,
					width: "half",
					defaultValue: data.name ?? "N/A"
				},
				{
					name: "email",
					label: "Email",
					type: "text",
					placeholder: "Enter email...",
					required: true,
					width: "half",
					defaultValue: data.email ?? "N/A"
				},
				{
					name: "password",
					label: "Password",
					type: "text",
					placeholder: "Enter password...",
					required: true,
					width: "half",
					defaultValue: data.password ?? "N/A"
				},
				{
					name: "status",
					label: "Status",
					type: "select",
					placeholder: "Select status...",
					required: true,
					width: "half",
					defaultValue: data.status ? "true" : "false",
					options: [
						{
							labelen: "Active",
							labelcn: "Active",
							val: "true",
						},
						{
							labelen: "Inactive",
							labelcn: "Inactive",
							val: "false"
						}
					]
				},
			]
		},
		{
			section: "Contact Details",
			sectionFields: [
				{
					name: "address",
					label: "Address",
					type: "text",
					placeholder: "Enter address...",
					required: false,
					defaultValue: data.address ?? "N/A"
				},
				{
					name: "city",
					label: "City",
					type: "text",
					placeholder: "Enter city...",
					required: false,
					width: "third",
					defaultValue: data.city ?? "N/A"
				},
				{
					name: "state",
					label: "State",
					type: "select",
					placeholder: "Select state...",
					required: false,
					width: "third",
					options: US_STATES.map((state) => ({
						labelen: state,
						labelcn: state,
						val: state,
						defaultValue: data.state ?? "N/A"
					}))
				},
				{
					name: "zip",
					label: "Zip",
					type: "text",
					placeholder: "Enter zip...",
					required: false,
					width: "third",
					defaultValue: data.zip ?? "N/A"
				},
				{
					name: "phone",
					label: "Phone",
					type: "text",
					placeholder: "Enter phone...",
					required: false,
					width: "third",
					defaultValue: data.phone ?? "N/A"
				},
				{
					name: "address1",
					label: "Address 2",
					type: "text",
					placeholder: "Enter address 2...",
					required: false,
					defaultValue: data.address1 ?? "N/A"
				},
				{
					name: "officephone",
					label: "Office Phone",
					type: "text",
					placeholder: "Enter office phone...",
					required: false,
					width: "half",
					defaultValue: data.officephone ?? "N/A"
				},
				{
					name: "cellphone",
					label: "Cell Phone",
					type: "text",
					placeholder: "Enter cell phone...",
					required: false,
					width: "half",
					defaultValue: data.cellphone ?? "N/A"
				},
				{
					name: "email2",
					label: "Email 2",
					type: "text",
					placeholder: "Enter email 2...",
					required: false,
					defaultValue: data.email2 ?? "N/A"
				},
			]
		},
		{
			section: "Family Details",
			sectionFields: [
				{
					name: "fathernamecn",
					label: "Father Name (CN)",
					type: "text",
					placeholder: "Enter father's Chinese name...",
					required: false,
					defaultValue: data.fathernamecn ?? "N/A"
				},
				{
					name: "fatherfirsten",
					label: "Father First Name",
					type: "text",
					placeholder: "Enter father's first name...",
					required: false,
					width: "half",
					defaultValue: data.fatherfirsten ?? "N/A"
				},
				{
					name: "fatherlasten",
					label: "Father Last Name",
					type: "text",
					placeholder: "Enter father's last name...",
					required: false,
					width: "half",
					defaultValue: data.fatherlasten ?? "N/A"
				},
				{
					name: "mothernamecn",
					label: "Mother Name (CN)",
					type: "text",
					placeholder: "Enter mother's Chinese name...",
					required: false,
					defaultValue: data.mothernamecn ?? "N/A"
				},
				{
					name: "motherfirsten",
					label: "Mother First Name",
					type: "text",
					placeholder: "Enter mother's first name...",
					required: false,
					width: "half",
					defaultValue: data.motherfirsten ?? "N/A"
				},
				{
					name: "motherlasten",
					label: "Mother Last Name",
					type: "text",
					placeholder: "Enter mother's last name...",
					required: false,
					width: "half",
					defaultValue: data.motherlasten ?? "N/A"
				},

			]
		},
		{
			section: "Other Information",
			sectionFields: [
				{
					name: "schoolmember",
					label: "School Member",
					type: "text",
					placeholder: "??? Enter school member...",
					required: false,
					width: "half",
					defaultValue: data.schoolmember ?? "N/A"
				},
				{
					name: "remark",
					label: "Remark",
					type: "textarea",
					placeholder: "Enter remark...",
					required: false,
					defaultValue: data.remark ?? "N/A"
				},

			]
		}
	];

	const hiddenInputs = { familyid: familyId };

	return (
		<EditEntity
			entity="family"
			title={`Edit family ${familyId}`}
			description="Current values have already been filled in."
			fields={fields}
			hiddenInputs={hiddenInputs}
		/>
	);
}