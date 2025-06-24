import { type NextAuthConfig } from "next-auth";

export default { 
    callbacks: {
        async session({ session, token }) {
            if (session.user) session.user.role = token.role;
            return session
        },
        async jwt({ token, user }) {
            if (user) token.role = user.role;
            return token;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/login",
        signOut: "/logout",
    }, 
    providers: []
} satisfies NextAuthConfig;