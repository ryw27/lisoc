import { z } from "zod/v4";


export const studentSchema = z.object({
	familyid: z.number(),
	studentno: z.string(), // number of students 
	namecn: z.string(),
	namelasten: z.string(),
	namefirsten: z.string(),
	gender: z.string(),
	ageof: z.string(), // minimum age studetn can theoretically be
	age: z.number(),
	dob: z.string().default('1900-01-01 00:00:00'),
	active: z.boolean().default(false),
	notes: z.string().default(''),
})

export const feedbackSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	phone: z
		.string()
		.regex(/^[\d+\-()\s]{7,20}$/i, "Invalid phone number")
		.optional(),
	email: z.email("Invalid email address"),
	subject: z.string().min(1, "Subject is required").max(150),
	comment: z.string().min(1, "Message is required").max(2000),
});
