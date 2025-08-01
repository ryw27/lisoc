import { 
    registerDraftFamily,
    checkRegCode,
    requestRegCode,
    fullRegisterFamily,
    resendCode
} from '@/lib/auth';
import RegisterForm from '@/components/auth/register-form';


export default function RegisterPage() {
    return (
        <RegisterForm 
            requestCode={requestRegCode}
            resendCode={resendCode}
            checkCode={checkRegCode}
            registerDraft={registerDraftFamily}
            fullRegister={fullRegisterFamily}
            isTeacher={false}
        />
    )
}