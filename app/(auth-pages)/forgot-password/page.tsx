import ForgotPasswordForm from "../components/forgot-password-form";
import { requestReset } from "@/app/lib/auth-lib/auth-actions"; 

export default function ForgotPassword() {

    return (
        <ForgotPasswordForm requestReset={requestReset}/>
    )
}