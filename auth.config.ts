import { type NextAuthConfig } from "next-auth";

export default {
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id; // primary identifier
                token.role = user.role; // role
                // Only if available
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub;
                session.user.role = token.role;
                session.user.name = token.name;
                session.user.email = token.email ?? "No email";
            }
            return session;
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
    providers: [],
} satisfies NextAuthConfig;
