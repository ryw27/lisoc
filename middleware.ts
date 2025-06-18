import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware for initial auth check
export function middleware(request: NextRequest) {
    // Log to confirm middleware is running
    
    const pathname = request.nextUrl.pathname;
    
    // Skip auth check for API routes
    if (pathname.startsWith('/api')) {
        return NextResponse.next();
    }
    
    // Only check auth for protected routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        // Check for the session cookie (this doesn't validate the cookie, just checks existence)
        const sessionCookie = request.cookies.get('__Host.authjs.session');
        
        if (!sessionCookie) {
            if (pathname.startsWith('/admin')) {
				return NextResponse.redirect(new URL('/login/admin', request.url)) 
			} else {
				return NextResponse.redirect(new URL('/login', request.url));
			} 
        }
    }
    
    return NextResponse.next();
}

// Only match dashboard and admin routes
export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
}; 