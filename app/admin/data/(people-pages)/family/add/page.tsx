import AddEntity from "@/components/data-view/add-entity/add-entity";
import { FormSections } from "@/lib/data-view/types";
import { US_STATES } from "@/lib/utils";

export default async function AddFamily() {
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
					width: "half"
				},
				{
					name: "email",
					label: "Email",
					type: "text",
					placeholder: "Enter email...",
					required: true,
					width: "half"
				},
				{
					name: "password",
					label: "Password",
					type: "text",
					placeholder: "Enter password...",
					required: true,
					width: "half"
				},
				{
					name: "status",
					label: "Status",
					type: "select",
					placeholder: "Select status...",
					required: true,
					width: "half",
					options: [
						{
							labelen: "Active",
							labelcn: "Active",
							val: "active"
						},
						{
							labelen: "Inactive",
							labelcn: "Inactive",
							val: "inactive"
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
					required: false
				},
				{
					name: "city",
					label: "City",
					type: "text",
					placeholder: "Enter city...",
					required: false,
					width: "third"
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
						val: state
					}))
				},
				{
					name: "zip",
					label: "Zip",
					type: "text",
					placeholder: "Enter zip...",
					required: false,
					width: "third"
				},
				{
					name: "phone",
					label: "Phone",
					type: "text",
					placeholder: "Enter phone...",
					required: false,
					width: "third"
				},
				{
					name: "address1",
					label: "Address 2",
					type: "text",
					placeholder: "Enter address 2...",
					required: false
				},
				{
					name: "officephone",
					label: "Office Phone",
					type: "text",
					placeholder: "Enter office phone...",
					required: false,
					width: "half"
				},
				{
					name: "cellphone",
					label: "Cell Phone",
					type: "text",
					placeholder: "Enter cell phone...",
					required: false,
					width: "half"
				},
				{
					name: "email2",
					label: "Email 2",
					type: "text",
					placeholder: "Enter email 2...",
					required: false
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
					required: false
				},
				{
					name: "fatherfirsten",
					label: "Father First Name",
					type: "text",
					placeholder: "Enter father's first name...",
					required: false,
					width: "half"
				},
				{
					name: "fatherlasten",
					label: "Father Last Name",
					type: "text",
					placeholder: "Enter father's last name...",
					required: false,
					width: "half"
				},
				{
					name: "mothernamecn",
					label: "Mother Name (CN)",
					type: "text",
					placeholder: "Enter mother's Chinese name...",
					required: false
				},
				{
					name: "motherfirsten",
					label: "Mother First Name",
					type: "text",
					placeholder: "Enter mother's first name...",
					required: false,
					width: "half"
				},
				{
					name: "motherlasten",
					label: "Mother Last Name",
					type: "text",
					placeholder: "Enter mother's last name...",
					required: false,
					width: "half"
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
					width: "half"
				},
				{
					name: "remark",
					label: "Remark",
					type: "textarea",
					placeholder: "Enter remark...",
					required: false
				},

			]
		}
	];

	return (
		<AddEntity
			entity="family"
			title="Add a new family"
			description="Register a new family for someone else. This will automatically create a verified user account for the family."
			fields={fields}
		/>
	);
}


