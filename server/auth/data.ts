import { UserObject } from "@/server/data-view/entity-configs/(people)/users";
import { db } from "../../lib/db";
import { transporter } from "../../lib/nodemailer";
import { SITE_LINK } from "../../lib/utils";

export async function sendRegEmail(emailTo: string, token: string) {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: "LISOC Account Registration Verification",
        html: `
            <p> Your verification code is <strong> ${token} </strong>. This code will expire in 10 minutes </p>
            <p> If you are not trying to register, please ignore this email </p>
        `,
    });
}

// export async function sendFPEmail(emailTo: string, uuid: string) {
//     await transporter.sendMail({
//         from: "LISOC Registration <regadmin@lisoc.org>",
//         to: emailTo,
//         subject: "LISOC Forgot Password Link",
//         html: `
//             <p> Reset your password with the following <a href="${SITE_LINK}/reset-password?token=${uuid}&email=${encodeURIComponent(emailTo)}"> link </a> </p>
//             <p> If you are not trying to reset your password, please ignore this email </p>
//         `
//     });
// }
export async function sendFPEmail(emailTo: string, uuid: string) {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: "LISOC Forgot Password Link",
        html: `
            <p> Reset your password with the following <a href="${SITE_LINK}/reset-password?token=${uuid}&email=${encodeURIComponent(emailTo)}"> link </a> </p>
            <p> If the link is not working, please try copy and pasting the following into your browser: ${SITE_LINK}/reset-password?token=${uuid}&email=${encodeURIComponent(emailTo)} </p>
            <p> If you are not trying to reset your password, please ignore this email </p>
        `,
    });
}

export async function sendRegLinkEmail(emailTo: string, token: string, type: "Teacher" | "Admin") {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: `LISOC ${type} Registration Link`,
        html: `
            <p> Register your account with the following link: <a href="${SITE_LINK}/register/${token}?email=${encodeURIComponent(emailTo)}"> </a> </p>
            <p> If the link is not working, please try copy and pasting the following into your browser: ${SITE_LINK}/register/${token}?email=${encodeURIComponent(emailTo)} </p>
            <p> This link will expire in 7 days </p>
            <p> If you are not trying to register, please ignore this email </p>
        `,
    });
}

export async function checkExistence(
    input: string,
    column: "name" | "email"
): Promise<{ exists: boolean; data: UserObject | undefined }> {
    const result = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u[column], input),
    });

    return { exists: result !== undefined, data: result };
}
