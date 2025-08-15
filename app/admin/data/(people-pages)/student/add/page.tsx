import AddEntity from "@/components/data-view/add-entity/add-entity";
import { FormSections } from "@/lib/data-view/types";

export default async function AddStudent() {

	const fields: FormSections[] = [
		{
			section: "Student Details",
			sectionFields: [
				{
					label: "Family ID",
					name: "familyid",
					type: "number",
					required: true,
					placeholder: "Enter Family ID",
				},
				// {
				// 	label: "Student Number",
				// 	name: "studentno",
				// 	type: "number",
				// 	required: false,
				// 	placeholder: "Enter Student Number",
				// },
				{
					label: "Chinese Name",
					name: "namecn",
					type: "text",
					required: true,
					placeholder: "Enter Chinese Name",
				},
				{
					label: "Last Name",
					name: "namelasten",
					type: "text",
					required: true,
					placeholder: "Enter Last Name",
					width: "half",
				},
				{
					label: "First Name",
					name: "namefirsten",
					type: "text",
					required: true,
					placeholder: "Enter First Name",
					width: "half",
				},
				{
					label: "Gender",
					name: "gender",
					type: "select",
					required: true,
					placeholder: "Select Gender",
					options: [
						{ labelen: "Male", labelcn: "Male", val: "male" },
						{ labelen: "Female", labelcn: "Female", val: "female" },
						{ labelen: "Other", labelcn: "Other", val: "other" },
					],
					width: "half",
				},
				{
					label: "Age",
					name: "age",
					type: "number",
					required: true,
					placeholder: "Enter Age",
					width: "half",
				},
				{
					label: "Date of Birth",
					name: "dob",
					type: "date",
					required: true,
					placeholder: "Enter Date of Birth",
					width: "half",
				},
				{
					label: "Active",
					name: "active",
					type: "select",
					required: true,
					placeholder: "Enter Active",
					options: [
						{ labelen: "Active", labelcn: "Active", val: "true" },
						{ labelen: "Inactive", labelcn: "Inactive", val: "false" },
					],
					width: "half",
				},
			],
		},
		{
			section: "Notes",
			sectionFields: [
				{
					label: "Notes",
					name: "notes",
					type: "textarea",
					required: false,
					placeholder: "Enter Notes",
				},
			],
		},
	];

	return (
		<AddEntity
			entity="student"
			title="Add a new student"
			description="Create a new student."
			fields={fields}
		/>
	);
}


