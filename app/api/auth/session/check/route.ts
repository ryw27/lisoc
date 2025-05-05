import { db } from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

// Constants for session management
const SESSION_COOKIE = "__Host.authjs.session";
const MS_IN_DAY = 86_400_000; // 1 day in milliseconds
const MAX_AGE_MS = 30 * MS_IN_DAY; // 30 days

/**
 * API route to check session validity and implement rolling sessions.
 * This moves the database logic out of middleware into a proper API route.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current session using auth.js
    const session = await auth();
    
    // If no session, return unauthorized
    if (!session || !session.user) {
      return NextResponse.json(
        { valid: false, message: "No session found" },
        { status: 401 }
      );
    }
    
    // Get role from session
    const { role } = session.user;
    
    // Get the session token from cookies
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { valid: false, message: "No session token in cookies" },
        { status: 401 }
      );
    }
    
    // Check session in database
    const result = await db.query(
      `SELECT expires_at, created_at
       FROM sessions
       WHERE id = $1`,
      [sessionToken]
    );
    
    if (!result.rows.length) {
      return NextResponse.json(
        { valid: false, message: "Session not found in database" },
        { status: 401 }
      );
    }
    
    const { expires_at, created_at } = result.rows[0];
    
    // Admin hard cutoff: 1 day since creation
    if (role === "ADMIN" && Date.now() - created_at.getTime() > MS_IN_DAY) {
      await db.query(`DELETE FROM sessions WHERE id = $1`, [sessionToken]);
      return NextResponse.json(
        { valid: false, message: "Admin session expired (1 day limit)" },
        { status: 401 }
      );
    }
    
    // Check if session is expired
    const timeLeft = expires_at.getTime() - Date.now();
    if (timeLeft <= 0) {
      await db.query(`DELETE FROM sessions WHERE id = $1`, [sessionToken]);
      return NextResponse.json(
        { valid: false, message: "Session expired" },
        { status: 401 }
      );
    }
    
    // Rolling session - extend session expiration if less than half of time remains
    if (timeLeft < (role === "ADMIN" ? MS_IN_DAY : MAX_AGE_MS) / 2) {
      const newExp = new Date(
        Date.now() + (role === "ADMIN" ? MS_IN_DAY : MAX_AGE_MS)
      );
      
      await db.query(
        `UPDATE sessions SET expires_at = $1 WHERE id = $2`,
        [newExp, sessionToken]
      );
      
      // Create response with extended session
      const response = NextResponse.json({
        valid: true,
        role,
        message: "Session extended",
        expiresAt: newExp.toISOString(),
      });
      
      // Set cookie on the response
      response.cookies.set({
        name: SESSION_COOKIE,
        value: sessionToken,
        path: "/",
        expires: newExp,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
      
      return response;
    }
    
    // Session is valid without needing extension
    return NextResponse.json({
      valid: true,
      role,
      message: "Session valid",
      expiresAt: expires_at.toISOString(),
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { valid: false, message: "Error checking session" },
      { status: 500 }
    );
  }
} 