import { emailToCode, checkCode, registerDraft, resendCode, fullRegister } from '@/app/lib/auth-lib/auth-actions';
import RegisterForm from '@/app/(auth-pages)/components/register-form';


export default function RegisterPage() {
    return (
        <RegisterForm 
            requestCode={emailToCode}
            resendCode={resendCode}
            checkCode={checkCode}
            registerDraft={registerDraft}
            fullRegister={fullRegister}
            isTeacher={false}
        />
    )
}