import { loginSchema } from "@/lib/auth/validation";
import { emailSchema, usernameSchema } from "@/lib/auth/validation";
import { signIn } from "../auth";

// Only for server page logins. Client side logins are handled by auth.js
export async function serverLogin(formData: FormData, isAdminForm: boolean, isTeacherForm: boolean) {
    const { emailUsername, password } = loginSchema.parse(Object.fromEntries(formData));
    const provider = isAdminForm ? "admin-credentials" : isTeacherForm ? "teacher-credentials" : "family-credentials";

    const isEmail = emailSchema.safeParse({ email: emailUsername }).success;
    const isUsername = usernameSchema.safeParse({ username: emailUsername }).success;

    if (!isEmail && !isUsername) {
        throw new Error("Invalid email or username")
    }

    const result = await signIn(provider, {
        username: isUsername ? emailUsername : null,
        email: isEmail ? emailUsername : null,
        password: password,
        redirect: false,
    });

    if (!result) {
        throw new Error("Invalid credentials")
    }
}