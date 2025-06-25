import LoginForm from '../components/login-form';
import { login } from '@/app/lib/auth-lib/auth-actions';

export default function LoginPage() {
    return (
        <LoginForm isAdminForm={false} isTeacherForm={false} login={login} />
    )
}