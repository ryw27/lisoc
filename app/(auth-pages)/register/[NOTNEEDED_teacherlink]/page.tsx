import RegisterForm from '@/components/auth/register-form';
import { z } from 'zod/v4';
import { pgadapter } from '@/lib/auth/auth';


export default async function LinkRegisterPage({
    params
}: {
    params: Promise<{ uuidKey: string, email: string }>
}) {
    // Check if valid uuid key and email
    const { uuidKey, email } = await params;
    const schema = z.object({
        uuid: z.uuid(),
        email: z.email(),
    })
    const parsed = schema.safeParse({ uuidKey, email })
    if (!parsed.success) {
        return <div className="w-full h-full flex justify-center mt-15">Invalid registration link</div>;
    }

    // Check if valid reg link
    const reg = await pgadapter.useVerificationToken({
        identifier: email,
        token: uuidKey
    })
    if (!reg || new Date(reg.expires) > new Date()) {
        return <div className="w-full h-full flex justify-center mt-15">Invalid registration link</div>;
    }


    return (
        <RegisterForm 
            isTeacher={true}
            inStep={"CREDENTIALS"}
            inCredentials={{ email: email, username: "" }}
        />
    )
}