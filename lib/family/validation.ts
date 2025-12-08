import { z } from "zod/v4";


export const studentSchema = z.object({
	familyid: z.coerce.number({
		message: "Please Enter a number"
	}).min(0, { message: "Family ID must be positive" }),
	// studentno: z.string(), // number of students 
	namecn: z.string().optional().or(z.literal("")),
	namelasten: z.string().optional().or(z.literal("")),
	namefirsten: z.string().optional().or(z.literal("")),
	gender: z.enum(["Male", "Female", "Other"]),
	//ageof: z.string(), // minimum age student can theoretically be
	//age: z.coerce.number({ message: "Please enter a number"}).min(1, { message: "Age must be positive"}),
	dob: z.coerce.date({ message: "Please enter a valid date"}).default(new Date("1900-01-01T00:00:00Z")),
	active: z.boolean().default(true),
	notes: z.string().default(""),
})
.refine(
	(data) =>
		(data.namecn && data.namecn.trim() !== "") ||
		((data.namelasten && data.namelasten.trim() !== "") &&
			(data.namefirsten && data.namefirsten.trim() !== "")),
	{
		message: "Either Chinese name or both English first and last names must be filled.",
		path: ["namecn"], // Attach error to namecn for simplicity
	}
);

export const feedbackSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, { message: "Name is too long"}),
	phone: z
		.string()
		.regex(/^[\d+\-()\s]{7,20}$/i, "Invalid phone number")
		.optional(),
	email: z.email("Invalid email address"),
	subject: z.string().min(1, "Subject is required").max(150, { message: "Subject is too long"}),
	comment: z.string().min(1, "Message is required").max(2000, { message: "Message is too long. Please reduce."}),
});
