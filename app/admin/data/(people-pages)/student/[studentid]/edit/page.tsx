import EditEntity from "@/components/data-view/edit-entity/edit-entity";
import { FormSections } from "@/lib/data-view/types";
import { getIDRow } from "@/lib/data-view/actions/getIDRow";
import { notFound } from "next/navigation";
import { StudentObject } from "@/lib/data-view/entity-configs/(people)/student";

export default async function EditStudentPage({
	params,
}: {
	params: Promise<{ studentid: string }>;
}) {
	const { studentid } = await params;
	const studentId = parseInt(studentid);

	const response = await getIDRow("student", studentId);
	if (!response.ok || !response.data) {
		return notFound();
	}

	const student = response.data as StudentObject;



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
					defaultValue: student.familyid ? String(student.familyid) : "N/A",
				},
				// {
				// 	label: "Student Number",
				// 	name: "studentno",
				// 	type: "number",
				// 	required: false,
				// 	placeholder: "Enter Student Number",
				// 	defaultValue: student.studentno ? String(student.studentno) : "N/A",
				// },
				{
					label: "Chinese Name",
					name: "namecn",
					type: "text",
					required: true,
					placeholder: "Enter Chinese Name",
					defaultValue: student.namecn ? String(student.namecn) : "N/A",
				},
				{
					label: "Last Name",
					name: "namelasten",
					type: "text",
					required: true,
					placeholder: "Enter Last Name",
					defaultValue: student.namelasten ? String(student.namelasten) : "N/A",
					width: "half",
				},
				{
					label: "First Name",
					name: "namefirsten",
					type: "text",
					required: true,
					placeholder: "Enter First Name",
					defaultValue: student.namefirsten ? String(student.namefirsten) : "N/A",
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
					defaultValue: student.gender ? String(student.gender) : "N/A",
					width: "half",
				},
				{
					label: "Age",
					name: "age",
					type: "number",
					required: true,
					placeholder: "Enter Age",
					defaultValue: student.age ? String(student.age) : "N/A",
					width: "half",
				},
				{
					label: "Date of Birth",
					name: "dob",
					type: "date",
					required: true,
					placeholder: "Enter Date of Birth",
					defaultValue: student.dob ? String(student.dob) : "N/A",
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
					defaultValue: student.active ? String(student.active) : "N/A",
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
					defaultValue: student.notes ? String(student.notes) : "N/A",
				},
			],
		},
	];

	const hiddenInputs = { studentid: studentId };

	return (
		<EditEntity
		entity="student"
		title={`Edit student ${studentId}`}
		description="Current values have already been filled in."
		fields={fields}
		hiddenInputs={hiddenInputs}
		/>
	);
}