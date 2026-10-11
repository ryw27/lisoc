import { NextResponse } from "next/server";
import NextAuth, { NextAuthRequest } from "next-auth";
import authConfig from "./auth.config";

const SUPPORTED_LOCALES = ["en", "zh"];

function normalizeLocale(input: string | null | undefined) {
    const base = (input ?? "").split(",")[0]?.trim().split("-")[0]?.toLowerCase();
    return SUPPORTED_LOCALES.includes(base) ? base : "en";
}

const { auth } = NextAuth(authConfig);
export default auth((req: NextAuthRequest) => {
    const pathname = req.nextUrl.pathname;
    const isProtectedRoute =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/teacher") ||
        pathname.startsWith("/dashboard");

    // Determine if we need to set locale cookie and what value to use
    const hasLocaleCookie = Boolean(req.cookies.get("NEXT_LOCALE")?.value);
    const headerLocale = req.headers.get("accept-language");
    const resolvedLocale = normalizeLocale(headerLocale);

    const attachLocaleCookie = (response: NextResponse) => {
        if (!hasLocaleCookie) {
            response.cookies.set("NEXT_LOCALE", resolvedLocale, {
                path: "/",
                maxAge: 60 * 60 * 24 * 365,
            });
        }
        return response;
    };

    // Auth only for protected routes
    if (isProtectedRoute) {
        const isSessionMissingOrExpired = !req.auth || new Date(req.auth.expires) < new Date();
        if (isSessionMissingOrExpired) {
            const loginTarget = pathname.startsWith("/admin")
                ? "/login/admin"
                : pathname.startsWith("/teacher")
                  ? "/login/teacher"
                  : "/login";
            return attachLocaleCookie(NextResponse.redirect(new URL(loginTarget, req.url)));
        }

        const userRole = req.auth!.user.role;
        if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
            return attachLocaleCookie(NextResponse.redirect(new URL("/forbidden", req.url)));
        }
        if (pathname.startsWith("/teacher") && userRole !== "TEACHER") {
            return attachLocaleCookie(NextResponse.redirect(new URL("/forbidden", req.url)));
        }
        if (pathname.startsWith("/dashboard") && userRole !== "FAMILY") {
            return attachLocaleCookie(NextResponse.redirect(new URL("/forbidden", req.url)));
        }
    }

    return attachLocaleCookie(NextResponse.next());
});

export const config = {
    // Skip API routes, Next.js assets and static files in public/ (images, fonts): they
    // need neither the auth gate nor the locale cookie, and every page load pulls several
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|ico|webp|ttf|woff2?)$).*)",
    ],
};
