import { notFound } from "next/navigation"
import { checkResetLink } from "@/lib/auth";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { z } from "zod/v4";

const resetParamsSchema = z.object({
    token: z.string().min(10), // adjust min length as needed
    email: z.string().email(),
});

export default async function ResetPassword({
    searchParams,
}: {
    searchParams: Promise<{ token: string; email: string }>;
}) {
    const params = await searchParams;

    const parsed = resetParamsSchema.safeParse(params);
    if (!parsed.success) {
        return notFound();
    }

    const { token, email } = parsed.data;

    const isValid = await checkResetLink({ uuid: token, email } );

    if (isValid) {
        return (
            <ResetPasswordForm
                userEmail={email}
                userToken={token}
            />
        );
    }

    return notFound();
}