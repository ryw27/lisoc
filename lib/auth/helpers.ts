import { db } from "../db";
import { transporter } from "../nodemailer";
import { SITE_LINK } from "../utils";


export async function sendRegEmail(emailTo: string, token: string) {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: "LISOC Account Registration Verification",
        html: `
            <p> Your verification code is <strong> ${token} </strong>. This code will expire in 10 minutes </p>
            <p> If you are not trying to register, please ignore this email </p>
        `
    });
}

export async function checkExistence(input: string, column: "name" | "email"): Promise<boolean> {
    const result = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u[column], input)
    })
    console.log("result", result)

    return result !== undefined;
}


export async function sendFPEmail(emailTo: string, uuid: string) {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: "LISOC Forgot Password Link",
        html: `
            <p> Reset your password with the following <a href="${SITE_LINK}/reset-password?token=${uuid}&email=${encodeURIComponent(emailTo)}"> link </a> </p>
            <p> If you are not trying to reset your password, please ignore this email </p>
        `
    });   
}