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

