import { emailToCode, checkCode, registerDraft, resendCode, fullRegister } from '@/app/lib/auth-lib/auth-actions';
import RegisterForm from '../../components/register-form';
import { db } from '@/app/lib/db';
import { z } from 'zod';


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

    const teacherReg = await db.query.teacher_registration.findFirst({
        where: (teacher_registration, { eq }) => eq(teacher_registration.linkuuid, parsedUUID.data)
    });

    if (!teacherReg) {
        return <div className="w-full h-full flex justify-center mt-15">Invalid registration link</div>;
    }

    return (
        <RegisterForm 
            requestCode={emailToCode}
            resendCode={resendCode}
            checkCode={checkCode}
            registerDraft={registerDraft}
            fullRegister={fullRegister}
            isTeacher={true}
            inStep={"CREDENTIALS"}
            inCredentials={{ email: teacherReg.email, username: "" }}
        />
    )
}