import { type NextAuthConfig } from "next-auth";

export default { 
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.userid = token.userid ?? token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.userid = user.userid ?? user.id;
                token.sub = user.userid ?? user.id;
            }
            // Ensure at least one of token.userid or token.sub is present
            if (!token.userid && token.sub) {
                token.userid = token.sub;
            }
            if (!token.sub && token.userid) {
                token.sub = token.userid;
            }
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