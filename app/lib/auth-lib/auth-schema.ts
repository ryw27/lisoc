import { z } from "zod";

// Schemas TODO - add regex
export const emailSchema = z.object({
    email: z
        .string()
        .min(1, { message: "This field has to be filled"})
        .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: "This is not a valid email" })
})

export const credSchema = z.object({
    username: z.
        string()
        .min(1, { message: "Username has to be filled"})
        .max(24, { message: "Username is too long"}),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(72, { message: "Password is too long" })
})

export const codeSchema = z.object({
    code: z.
        string()
        .length(6, { message: "Code must be 6 digits" })
})
// TODO: edit
export const profileSchema = z.object({
    firstName: z.
        string()
        .min(1, { message: "First name has to be filled"})
        .max(24, { message: "First name is too long" }),
    lastName: z.
        string()
        .min(1, { message: "Last name has to be filled"})
        .max(24, { message: "Last name is too long" }),
    phone: z.
        string()
        .min(1, { message: "Phone number has to be filled"})
        .max(15, { message: "Phone number is too long" }),
    address: z.
        string()
        .min(1, { message: "Address has to be filled"})
        .max(100, { message: "Address is too long" }),
    city: z.
        string()
        .min(1, { message: "City has to be filled"})
        .max(24, { message: "City is too long" }),
    state: z.
        string()
        .min(1, { message: "State has to be filled"})
        .max(24, { message: "State is too long" }),
    zip: z.
        string()
        .min(1, { message: "Zip code has to be filled"})
        .max(10, { message: "Zip code is too long" }),
    country: z.
        string()
        .min(1, { message: "Country has to be filled"})
        .max(24, { message: "Country is too long" }),
})