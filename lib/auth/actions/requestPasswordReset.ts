// "use server";
// import { forgotPassSchema } from "../validation";
// import { emailSchema, usernameSchema } from "../validation";
// import { z } from "zod/v4";
// import { pgadapter } from "../auth";
// import { checkExistence, sendFPEmail } from "../helpers";
// import { v4 as uuid } from "uuid";

// export async function requestPasswordReset(data: z.infer<typeof forgotPassSchema>): Promise<{ ok: boolean, message: string }> {
//     const fpCheck = forgotPassSchema.parse(data);
//     const input = fpCheck.emailUsername;

//     // Check if input is an email or username
//     const isEmail = emailSchema.safeParse({ email: input }).success;
//     const isUsername = usernameSchema.safeParse({ username: input }).success;
    
//     let userEmail: string | null = null;
    
//     if (isEmail) {
//         // Input is an email
//         const emailExists = await checkExistence(input, "email");
//         if (!emailExists) {
//             return { ok: false, message: "Account does not exist" }
//         }
//         userEmail = input;
//     } else if (isUsername) {
//         // Input is a username - need to find the associated email
//         const userNameExists = await checkExistence(input, "name");
//         if (!userNameExists) {
//             return { ok: false, message: "Account does not exist" }
//         }
//         userEmail = input;
//     } else {
//         return { ok: false, message: "Invalid Email or Username" }
//     }

//     // await db
//     //     .update(users)
//     //     .set({ ischangepwdnext: true})
//     //     .where(eq(users.email, userEmail!))

//     const uuidCode = uuid();

//     const result = await pgadapter.createVerificationToken({
//         token: uuidCode,
//         identifier: userEmail!,
//         expires: new Date(Date.now() + 1000 * 60 * 15) 
//     });

//     if (!result) {
//         return { ok: false, message: "Error creating verification token" }
//     }

//     await sendFPEmail(userEmail!, uuidCode);

//     return { ok: true, message: "Email sent" }
// }

"use server";
import { forgotPassSchema } from "../validation";
import { emailSchema, usernameSchema } from "../validation";
import { z } from "zod/v4";
import { pgadapter } from "../auth";
import { checkExistence, sendFPEmail } from "../helpers";
import { v4 as uuid } from "uuid";
import { safeAction } from "@/lib/safeAction";

export const requestPasswordReset = safeAction(
    forgotPassSchema,
    async function(data: z.infer<typeof forgotPassSchema>) {
        // Validate input using schema
        const { emailUsername } = forgotPassSchema.parse(data);

        // Determine if input is an email or username
        const isEmail = emailSchema.safeParse({ email: emailUsername }).success;
        const isUsername = usernameSchema.safeParse({ username: emailUsername }).success;

        let userEmail: string | null = null;

        if (isEmail) {
            // Input is an email, check existence
            const exists = await checkExistence(emailUsername, "email");
            if (!exists) {
                throw new Error("Account does not exist");
            }
            userEmail = emailUsername;
        } else if (isUsername) {
            // Input is a username, check existence and resolve to email
            const exists = await checkExistence(emailUsername, "name");
            if (!exists) {
                throw new Error("Account does not exist");
            }
            // Optionally, resolve username to email if needed
            userEmail = emailUsername;
        } else {
            throw new Error("Invalid Email or Username");
        }

        // Generate a unique verification token
        const token = uuid();

        const result = await pgadapter.createVerificationToken({
            token,
            identifier: userEmail,
            expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        });

        if (!result) {
            throw new Error("Database error")
        }

        await sendFPEmail(userEmail, token);
    }
)