import { notFound } from "next/navigation";
import { z } from "zod/v4";
import { isAccountSetupLinkValid } from "@/server/auth/accountSetup.actions";
import SetupAccountForm from "@/components/auth/setup-account-form";

const setupParamsSchema = z.object({
    token: z.uuid(),
    email: z.email(),
});

export default async function SetupAccount({
    searchParams,
}: {
    searchParams: Promise<{ token?: string; email?: string }>;
}) {
    const params = await searchParams;
    const parsed = setupParamsSchema.safeParse(params);
    if (!parsed.success) {
        return notFound();
    }
    const { token, email } = parsed.data;

    const response = await isAccountSetupLinkValid({ email, token });
    if (!response.ok || response.data !== true) {
        return notFound();
    }

    return <SetupAccountForm userEmail={email} userToken={token} />;
}
