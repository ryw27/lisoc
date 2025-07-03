import LoginForm from '../../components/login-form';

export default function AdminLoginPage() {
    return (
        <LoginForm isAdminForm={true} isTeacherForm={false}/>
    )
}

