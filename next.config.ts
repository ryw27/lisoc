import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import packageJson from "./package.json";

// Hardened HTTP response headers applied to every route.
//
// CSP rules of thumb for this app:
//   - script-src: 'self' for Next/our code, plus PayPal SDK origins. We allow
//     'unsafe-inline' for now because Turbopack and several legacy bits emit
//     inline <script> tags; tightening to a nonce-based policy is tracked in
//     SECURITY_FIXES.md as a follow-up.
//   - style-src: 'self' + 'unsafe-inline' (Tailwind/Radix style attributes).
//   - img-src: 'self' + data: + blob: + https: so user avatars and remote
//     images render without a per-source allowlist.
//   - connect-src: 'self' + PayPal API. NextAuth callbacks live under /api so
//     they don't need an extra origin.
//   - frame-src: PayPal checkout iframe.
//   - frame-ancestors: 'none' so the app can't be wrapped in a hostile iframe
//     (clickjacking).
//   - form-action / base-uri: 'self' to neutralise base-href and form-action
//     hijacks.
// The PayPal JS SDK loads a script from www.paypal.com which then renders
// buttons in iframes, opens a checkout iframe (production or sandbox), and
// beacons telemetry/FPTI data to a handful of PayPal subdomains. Rather
// than enumerate them — PayPal frequently introduces new regional / risk /
// experiment subdomains, and a missing entry silently breaks checkout —
// we trust the *.paypal.com and *.paypalobjects.com namespaces.
//
// This matches PayPal's own CSP guidance
// (https://developer.paypal.com/docs/checkout/troubleshoot/support/#csp).
// Trust trade-off: any compromised PayPal subdomain would be in scope, but
// (a) PayPal manages subdomain hygiene as a regulated payments company,
// and (b) we already grant www.paypal.com script-src trust — a compromise
// at that domain dominates anything a sibling subdomain could do.
const PAYPAL_HOST_WILDCARDS = [
    "https://*.paypal.com",
    "https://*.paypalobjects.com",
];

const isProd = process.env.NODE_ENV === "production";

function buildCsp(): string {
    // In dev we have to allow 'unsafe-eval' for Turbopack's HMR runtime, plus
    // ws:/wss: so the dev server's WebSocket connection succeeds. Production
    // tightens both.
    const scriptExtras = isProd ? "" : " 'unsafe-eval'";
    const connectExtras = isProd ? "" : " ws: wss:";

    const paypal = PAYPAL_HOST_WILDCARDS.join(" ");
    const directives: Record<string, string> = {
        "default-src": "'self'",
        "script-src": `'self' 'unsafe-inline'${scriptExtras} ${paypal}`,
        "style-src": "'self' 'unsafe-inline'",
        "img-src": "'self' data: blob: https:",
        "font-src": "'self' data:",
        "connect-src": `'self' ${paypal}${connectExtras}`,
        "frame-src": `'self' ${paypal}`,
        "frame-ancestors": "'none'",
        "base-uri": "'self'",
        "form-action": "'self'",
        "object-src": "'none'",
    };
    if (isProd) {
        directives["upgrade-insecure-requests"] = "";
    }

    return Object.entries(directives)
        .map(([k, v]) => (v === "" ? k : `${k} ${v}`))
        .join("; ");
}

const securityHeaders = [
    // 1 year HSTS, include subdomains, preload-eligible. Only honoured over
    // HTTPS by browsers, so it's a no-op for local http://localhost dev.
    {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value: [
            "accelerometer=()",
            "autoplay=()",
            "camera=()",
            "display-capture=()",
            "encrypted-media=()",
            "fullscreen=(self)",
            "geolocation=()",
            "gyroscope=()",
            "magnetometer=()",
            "microphone=()",
            "midi=()",
            "payment=(self)",
            "usb=()",
            "xr-spatial-tracking=()",
        ].join(", "),
    },
    {
        key: "Content-Security-Policy",
        value: buildCsp(),
    },
];

const nextConfig: NextConfig = {
    /* config options here */
    env: {
        NEXT_PUBLIC_APP_VERSION: packageJson.version,
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: securityHeaders,
            },
        ];
    },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
