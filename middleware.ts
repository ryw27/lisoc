export { auth as middleware } from "@/app/lib/auth"
import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server"
import { db } from "./app/lib/db";
import { cookies } from "next/headers";

const MAX_AGE = 30 * 24 * 60 * 60;
const MAX_AGE_ADMIN = 12 * 60 * 60; // 12 hours in seconds
const SESSION_COOKIE = "_HOST.authjs.session";
const PROTECTED = {
    ADMIN: ["/admin"],
    TEACHER: ["/dashboard"],
    STUDENT: ["/dashboard"],
}

//Helper function to delete expired sessions manually - used in middleware since non signed out users don't delete sessions automatically
async function deleteExpiredSessions(req: NextRequest, sessionToken: string) {
    //Delete session from database
    const result = await db.query(
        `DELETE FROM app_sessions WHERE id = $1`,
        [sessionToken]
    );

    //Delete session from cookies
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set({
        name: SESSION_COOKIE,
        value: "",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
    })
    return res;
    
}

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtected = Object.values(PROTECTED).some((routes) => routes.some((route) => path.startsWith(route)));

    //Check if route is protected or not
    if (!isProtected) {
        return NextResponse.next();
    }

    //Check if a user is authenticated
    const session = await auth();
    if (!session) {
        return NextResponse.redirect(new URL("/login", req.url));
    } 

    //Check if user has access to the route
    const { role } = session.user; 

    if (role !== "ADMIN" && path.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (path.startsWith("/dashboard")) {
        if (role !== "TEACHER" && role !== "STUDENT") {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
    }

    //Rolling session - extend session expiration if request made
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
        return NextResponse.redirect(new URL("/login", req.url));
    } 

    const result = await db.query(
        `SELECT  expires_at, created_at FROM sessions WHERE id = $1`,
        [sessionToken]
    );
    if (result.rows.length === 0) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const currentSession = result.rows[0];
    if (role === "ADMIN") {
        //Check if admin session is older than 1 day and log out/delete session automatically
        const sessionAge = Date.now() - currentSession.created_at;
        const oneDayInMs = 24 * 60 * 60 * 1000;
        if (sessionAge > oneDayInMs) {
            const res = await deleteExpiredSessions(req, sessionToken);
            return res;
        }
    }

    const timeLeft = currentSession.expires_at - Date.now();
    if (timeLeft < 0) {
        //if expired, delete session
        const res = await deleteExpiredSessions(req, sessionToken);
        return res;
    } else if (timeLeft < MAX_AGE / 2) {
        //Extend session expiration
        let newExp;
        if (role === "ADMIN") {
            //Admin has a shorter session expiration
            newExp = Date.now() + MAX_AGE_ADMIN;
        } else {
            //Student and teacher have a longer session expiration
            newExp = Date.now() + MAX_AGE;
        }

        //Update session expiration in database
        await db.query(
            `UPDATE sessions SET expires_at = $1 WHERE id = $2`,
            [newExp, sessionToken]
        );

        //Update session expiration in cookies
        const res = NextResponse.next(); 
        res.cookies.set({
            name: SESSION_COOKIE,
            value: sessionToken,
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            expires: new Date(newExp),
        })
        return res;
    }

    //If session is valid, return next middleware
    return NextResponse.next();
    
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}