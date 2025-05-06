import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcrypt"
import { z } from "zod"

//Declare module for session user buut it's not working idk why lol
declare module "next-auth" {
  interface Session {
    user: {
      role: string;
    } & DefaultSession["user"]
  }
}
 

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Your email address", required: true},
        password: { label: "Password", type: "password", placeholder: "Your password", required: true },
      },
      authorize: async (credentials) => {
        //Parse credentials with zod
        const parsedCredentials = z.object({
            email: z.string().email(),
            password: z.string().min(8),
        }).safeParse(credentials);

        if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const result = await db.query(
                "SELECT * FROM users WHERE email = $1",
                [email]
            )
            if (result.rowCount === 0) {
                return null;
            }
            const user = result.rows[0];
            const valid = await bcrypt.compare(password, user.password);
            if (valid) {
                return user;
            }
        }
        return null;
      },
    }),
  ],
  adapter: { 
    //Adapter for database operations, authjs uses this to interact with the database, automatically runs queries when running authjs functions
    //SET SCHEMA CORRECTLY  
    async createUser(user) {
        const result = await db.query(
            "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *",
            [user.email, user.name]
        )
        return result.rows[0];
    },
    async getUser(id) {
        const result = await db.query(
            "SELECT * FROM users WHERE id = $1",
            [id]
        )
        return result.rows[0] ?? null;
    },
    async updateUser(user) {
        const result = await db.query(
            "UPDATE users SET email = $1, name = $2 WHERE id = $3",
            [user.email, user.name, user.id]
        )
        return result.rows[0] ?? null;
    },
    async deleteUser(id) {
        await db.query(
            "DELETE FROM users WHERE id = $1",
            [id]
        )
    },
    async getUserByEmail(email) {
        const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        )
        return result.rows[0] ?? null;
    },
    async createSession(session) {
        const result = await db.query(
            "INSERT INTO sessions (user_id, expires_at, session_token) VALUES ($1, $2, $3) RETURNING *",
            [session.userId, session.expires, session.sessionToken]
        )
        return result.rows[0];
    },
    async getSessionAndUser(sessionToken) {
        const result = await db.query(
            "SELECT * FROM sessions INNER JOIN users ON sessions.user_id = users.id WHERE sessions.id = $1 AND sessions.expires_at > $2",
            [sessionToken, Date.now()]
        )
        const row = result.rows[0];
        return {
            session: {
                sessionToken: row.id,
                expires: row.expires_at,
                userId: row.user_id,
            },
            user: {
                id: row.user_id,
                name: row.name,
                email: row.email,
                role: row.role,
                emailVerified: row.email_verified,
            }
        };
    },
    async updateSession(session) {
        const result = await db.query(
            "UPDATE sessions SET expires_at = $1 WHERE id = $2",
            [session.expires, session.userId]
        )
        return result.rows[0] ?? null;
    },
    async deleteSession(sessionToken) {
        await db.query(
            "DELETE FROM sessions WHERE id = $1",
            [sessionToken]
        )
    }
  },
  callbacks: {
    async session({ session, token }) {
        if (token && session.user) {
            session.user.id = token.sub as string || "";
            session.user.role = token.role as string || "";
        }
        return session;
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
  }
})