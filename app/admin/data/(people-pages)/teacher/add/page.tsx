import { FormSections } from "@/lib/data-view/types";
import { classTypeMap } from "@/lib/utils";
import AddEntity from "@/components/data-view/add-entity/add-entity";

export default async function AddTeacher() {

	const fields: FormSections[] = [
		{
			section: "User Details",
			sectionFields: [
				{
					label: "Chinese Name",
					name: "namecn",
					type: "text",
					required: true,
					placeholder: "Enter Chinese Name",
					width: "half",
				},
				{
					label: "English Name",		
					name: "namelasten",
					type: "text",
					required: true,
					placeholder: "Enter English Name",
					width: "half",
				},
				{
					label: "Username",
					name: "name",
					type: "text",
					required: true,
					placeholder: "Enter Username",
					width: "half",
				},
				{
					label: "Email",
					name: "email",
					type: "text",
					required: true,
					placeholder: "Enter Email",
					width: "half",
				},
				{
					label: "Password",
					name: "password",
					type: "password",
					required: true,
					placeholder: "Enter Password",
					width: "half",
				}
			],
		},
		{
			section: "Teacher Details",
			sectionFields: [
				{
					label: "Teacher Index",
					name: "teacherindex",
					type: "number",
					required: true,
					placeholder: "Enter Teacher Index",
					defaultValue: "0.00",
					width: "half",
				},
				{
					label: "Class Type ID",
					name: "classtypeid",
					type: "select",
					required: true,
					placeholder: "Enter Class Type ID",
					width: "half",
					options: Object.entries(classTypeMap).map(([key, item]) => ({
						labelen: item.typenameen,
						labelcn: item.typenamecn,
						val: key,
					})),
				},
			],
		},
		{
			section: "Contact Details",
			sectionFields: [
				{
					label: "Address",
					name: "address",
					type: "text",
					required: true,
					placeholder: "Enter Address",
				},
				{
					label: "City",
					name: "city",
					type: "text",
					required: true,
					placeholder: "Enter City",
					width: "third",
				},
				{
					label: "State",
					name: "state",
					type: "text",
					required: true,
					placeholder: "Enter State",
					width: "third",
				},
				{
					label: "Zip",
					name: "zip",
					type: "text",
					required: true,
					placeholder: "Enter Zip",
					width: "third",
				},
				{
					label: "Phone",
					name: "phone",
					type: "text",
					required: true,
					placeholder: "Enter Phone",
				},
				{
					label: "Address 2",
					name: "address1",
					type: "text",
					required: false,
					placeholder: "Enter Address 2",
					width: "full",
				}
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
					placeholder: "Enter any additional notes",
				}
			]
		}
	];

	return (
		<AddEntity
			entity="teacher"
			title="Add a new teacher"
			description="Fill out the teacher details yourself."
			fields={fields}
		/>
	);
}


