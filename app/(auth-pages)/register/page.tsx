import { emailToCode, checkCode, register, resendCode } from '@/app/lib/auth-lib/auth-actions';
import RegisterForm from '@/components/register-form';
import FamilyForm from '@/components/family-form';


// const emailSchema = z.object({
//     email: z
//         .string()
//         .min(1, { message: "This field has to be filled"})
//         .email("This is not a valid email")
//         .refine(async (e) => {
//             return await checkExistence(e);
//         }, "This email already exists. Please login")
// })

export default function RegisterPage() {
    return (
        <RegisterForm 
            register={register}
            requestCode={emailToCode}
            resendCode={resendCode}
            checkCode={checkCode}
            familyForm={<FamilyForm />}
        />
    )
}