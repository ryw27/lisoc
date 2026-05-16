import { UserObject } from "@/server/data-view/entity-configs/(people)/users";
import { db } from "../../lib/db";
import { escapeAttr, escapeHtml, safeHref } from "../../lib/htmlEscape";
import { msSendEmail } from "../../lib/nodemailer";
//import { transporter } from "../../lib/nodemailer";
import { SITE_LINK } from "../../lib/utils";

// All email templates escape interpolated values, even when the values are
// currently server-generated (UUIDs, numeric codes). The risk we're guarding
// against is a future change that interpolates user-controlled content (a
// display name, a comment, etc.) and turns the email into a stored-XSS sink.

export async function sendRegEmail(emailTo: string, token: string) {
    const safeToken = escapeHtml(token);
    await msSendEmail(
        emailTo,
        "LISOC Account Registration Verification",
        `
        <p> Your verification code is <strong> ${safeToken} </strong>. This code will expire in 10 minutes </p>
        <p> If you are not trying to register, please ignore this email </p>
    `
    );
}

export async function sendFPEmail(emailTo: string, uuid: string) {
    const url = `${SITE_LINK}/reset-password?token=${encodeURIComponent(uuid)}&email=${encodeURIComponent(emailTo)}`;
    const safeHrefValue = safeHref(url);
    const safeUrlText = escapeHtml(url);
    await msSendEmail(
        emailTo,
        "LISOC Forgot Password Link",
        `
            <p> Reset your password with the following <a href="${safeHrefValue}"> link </a> </p>
            <p> If the link is not working, please try copy and pasting the following into your browser: ${safeUrlText} </p>
            <p> If you are not trying to reset your password, please ignore this email </p>
        `
    );
}

export async function sendRegLinkEmail(emailTo: string, token: string, type: "Teacher" | "Admin") {
    const url = `${SITE_LINK}/register/${encodeURIComponent(token)}?email=${encodeURIComponent(emailTo)}`;
    const safeHrefValue = safeHref(url);
    const safeUrlText = escapeHtml(url);
    const safeType = escapeHtml(type);
    await msSendEmail(
        emailTo,
        `LISOC ${safeType} Registration Link`,
        `
            <p> Register your account with the following link: <a href="${safeHrefValue}">${safeUrlText}</a> </p>
            <p> If the link is not working, please try copy and pasting the following into your browser: ${safeUrlText} </p>
            <p> This link will expire in 7 days </p>
            <p> If you are not trying to register, please ignore this email </p>
        `
    );
}

export async function sendAccountSetupEmail(
    emailTo: string,
    token: string,
    type: "Teacher" | "Admin"
) {
    const url = `${SITE_LINK}/setup-account?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailTo)}`;
    const safeHrefValue = safeHref(url);
    const safeUrlText = escapeHtml(url);
    const safeType = escapeHtml(type);
    const safeEmail = escapeHtml(emailTo);
    void escapeAttr; // imported for future attribute interpolations
    await msSendEmail(
        emailTo,
        `LISOC ${safeType} Account Setup`,
        `
            <p>An administrator has created a LISOC ${safeType} account for ${safeEmail}.</p>
            <p>To finish setting up your account, click the link below and choose your password.</p>
            <p><a href="${safeHrefValue}">Set up your account</a></p>
            <p>If the link is not working, please try copy and pasting the following into your browser: ${safeUrlText}</p>
            <p>This link will expire in 7 days.</p>
            <p>If you did not expect this email, please ignore it.</p>
        `
    );
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
