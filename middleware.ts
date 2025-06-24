import NextAuth, { NextAuthRequest } from 'next-auth';
import authConfig from './auth.config';
import { NextResponse } from 'next/server';


const { auth } = NextAuth(authConfig);
export default auth((req:NextAuthRequest) => {
    const pathname = req.nextUrl.pathname;
    // Only check auth for protected routes
    if (!req.auth || new Date(req.auth.expires) < new Date(Date.now())) {
        if (pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login/admin', req.url)) 
        } else if (pathname.startsWith('/teacher')) {
            return NextResponse.redirect(new URL('/login/teacher', req.url));
        } else {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    if (pathname.startsWith('/admin') && req.auth.user.role != "ADMIN") {
        return NextResponse.redirect(new URL('/forbidden', req.url));
    } else if (pathname.startsWith('/teacher') && req.auth.user.role != "TEACHER") {
        return NextResponse.redirect(new URL('/forbidden', req.url));
    } else if (pathname.startsWith('/dashboard') && req.auth.user.role != "FAMILY") {
        return NextResponse.redirect(new URL('/forbidden', req.url));
    }

    return NextResponse.next();
})

// Only match dashboard and admin routes
export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
}; 