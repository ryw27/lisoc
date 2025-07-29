import { codeSchema } from "../validation";
import { emailSchema } from "../validation";
import { pgadapter } from "../auth";
import { z } from "zod/v4";


// Step 3: Check the inputted code. 
export async function checkCode(data: z.infer<typeof codeSchema>, email: string) {
    emailSchema.parse({ email: email });
    const codeData = codeSchema.parse(data);

    // Automatically deletes the token and validates it
    const vt = await pgadapter.useVerificationToken({ identifier: email, token: codeData.code })
    
    if (!vt) {
        throw new Error("Invalid or expired code")
    }

    // Check if token is expired
    if (new Date(vt.expires) < new Date(Date.now())) {
        throw new Error("Expired Code")
    }
}