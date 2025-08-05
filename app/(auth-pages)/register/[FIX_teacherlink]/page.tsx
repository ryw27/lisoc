import { checkRegCode, requestRegCode, registerDraftFamily, fullRegisterFamily, resendCode } from '@/lib/auth';
import RegisterForm from '@/components/auth/register-form';
import { db } from '@/lib/db';
import { z } from 'zod/v4';


export default async function RegisterPage({
    params
}: {
    params: Promise<{ teacherlink: string }>
}) {
    const { teacherlink } = await params;

    // Check if valid registration link

    const parsedUUID = z.string().uuid().safeParse(teacherlink);
    if (!parsedUUID.success) {
        return <div className="w-full h-full flex justify-center mt-15">Invalid registration link</div>;
    }

    const teacherReg = await db.query.registration_drafts.findFirst({
        where: (registration_drafts, { eq }) => eq(registration_drafts.email, parsedUUID.data)
    });

    if (!teacherReg) {
        return <div className="w-full h-full flex justify-center mt-15">Invalid registration link</div>;
    }

    return (
        <RegisterForm 
            requestCode={requestRegCode}
            resendCode={resendCode}
            checkCode={checkRegCode}
            registerDraft={registerDraftFamily}
            fullRegister={fullRegisterFamily}
            isTeacher={true}
            inStep={"CREDENTIALS"}
            inCredentials={{ email: teacherReg.email, username: "" }}
        />
    )
}