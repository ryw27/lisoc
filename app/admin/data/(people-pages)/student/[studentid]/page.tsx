import EntityId, { displaySectionGroup } from "@/components/data-view/id-entity-view/entity-id";
import { getIDRow } from "@/lib/data-view/actions/getIDRow";
import { StudentObject } from "@/lib/data-view/entity-configs/(people)/student";
import { notFound } from "next/navigation";

interface StudentPageProps {
	params: Promise<{
		studentid: string;
	}>;
}

export default async function StudentPage({ params }: StudentPageProps) {
	const student_id = parseInt((await params).studentid);

	const response = await getIDRow("student", student_id);
	if (!response.ok || !response.data) {
		return notFound();
	}

	const student = response.data as StudentObject;

	const displaySections: displaySectionGroup[] = [
		{
			section: "Student Information",
			display: [
				{
					label: "Student ID",
					value: String(student_id),
				},
                {
                    label: "Student No",
					value: student.studentno ?? "N/A",
                },
				{
					label: "Name",
					value: `${student.namecn} ${student.namelasten} ${student.namefirsten}`,
				},
				{
					label: "Gender",
					value: student.gender ?? "N/A",
				},
				{
					label: "Age",
					value: student.age ? String(student.age) : "N/A",
				},
				{
					label: "Date of Birth",
					value: student.dob ? new Date(student.dob).toLocaleDateString() : "N/A",
				},
				{
					label: "Active",
					value: student.active ? "Yes" : "No",
				},
			],
		},
		{
			section: "Other Information",
			display: [
				{
					label: "Family ID",
					value: student.familyid ? String(student.familyid) : "N/A",
				},
				{
					label: "Last Modified",
					value: student.lastmodify ? new Date(student.lastmodify).toLocaleDateString() : "N/A",
				},				
				{
					label: "Created On",
					value: student.createddate ? new Date(student.createddate).toLocaleDateString() : "N/A",
				},
				{
					label: "Notes",
					value: student.notes ?? "N/A",
				},

			],
		},
	];

	return (
		<EntityId
			title={`Student ${String(student_id)}`}
			entity="student"
			displayFields={displaySections}
			id={String(student_id)}
		/>
	);
}