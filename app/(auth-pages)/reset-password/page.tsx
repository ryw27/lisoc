import { notFound } from "next/navigation"
import { checkResetLink } from "@/lib/auth";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { z } from "zod/v4";

const resetParamsSchema = z.object({
    token: z.uuid(),
    email: z.email(),
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

    const response = await checkResetLink({ uuid: token, email} );
    
    if (!response.ok || (response.ok && response.data === false)) {
        return notFound();
    }

    return (
        <ResetPasswordForm
            userEmail={email}
            userToken={token}
        />
    );
}
