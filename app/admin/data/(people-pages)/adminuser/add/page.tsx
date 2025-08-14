import { FormSections } from "@/lib/data-view/types";
import AddAdminChoice from "./add-admin-choice";
import { US_STATES } from "@/lib/utils";

export default function AddAdministrator() {
	const fields: FormSections[] = [
		{
			section: "User Details",
			sectionFields: [
				{
					name: "namecn",
					label: "Chinese Name",
					type: "text",
					placeholder: "Enter the Chinese name",
					required: true,
				},
				{
					name: "firstname",
					label: "First Name",
					type: "text",
					placeholder: "Enter the first name",
					required: true,
					width: "half",
				},
				{
					name: "lastname",
					label: "Last Name",
					type: "text",
					placeholder: "Enter the last name",
					required: true,
					width: "half",
				},
				{
					name: "name",
					label: "Username",
					type: "text",
					placeholder: "Enter the username",
					required: true,
					width: "half",
				},
				{
					name: "email",
					label: "Email",
					type: "text",
					placeholder: "Enter the email",
					required: true,
					width: "half",
				},
				{
					name: "password",
					label: "Password",
					type: "text",
					placeholder: "Enter the password",
					required: true,
					width: "half",
				},
				{
					name: "status",
					label: "Status",
					type: "select",
					placeholder: "Select the status",
					required: true,
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
					required: true,
				},
				{
					name: "city",
					label: "City",
					type: "text",
					placeholder: "Enter the city",
					required: true,
					width: "third",
				},
				{
					name: "state",
					label: "State",
					type: "select",
					placeholder: "Enter the state",
					required: true,
					width: "third",
					options: US_STATES.map((state) => ({
						labelen: state,
						labelcn: state,
						val: state,
					}))
				},
				{
					name: "zip",
					label: "Zip",
					type: "text",
					placeholder: "Enter the zip",
					required: true,
					width: "third"
				},
				{
					name: "phone",
					label: "Phone",
					type: "text",
					placeholder: "Enter the phone",
					required: true,
				},
				{
					name: "address1",
					label: "Address 2",
					type: "text",
					placeholder: "Enter the address 2",
					required: false,
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
					required: false,
				}
			]
		}
	];

	return (
		<AddAdminChoice fields={fields} />
	)

}
