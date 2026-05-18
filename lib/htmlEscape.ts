// Minimal HTML/attribute escaper for use inside email templates.
//
// Email HTML is rendered by mail clients without our control, and once an
// email lands in someone's inbox a stored-XSS-style payload can outlive the
// account that triggered it. The values we currently interpolate (UUID
// tokens, server-generated codes) are safe today, but the moment someone
// reuses these helpers with a user-controlled value (a name, a comment,
// etc.) the bare template literal becomes a vector. Use `escapeHtml` for
// element text content and `escapeAttr` for attribute values; route through
// `safeHref` for any URL that contains a user-controlled component.

export function escapeHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Same as escapeHtml but kept as a separate name to make intent obvious at
// call sites where the value lands inside an attribute (href, src, ...).
export const escapeAttr = escapeHtml;

// Build a hyperlink-safe href. Rejects javascript:, data:, vbscript: schemes
// and falls back to "#" so a malicious URL can't smuggle script execution
// into an HTML email.
export function safeHref(url: string): string {
    const trimmed = url.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
        return "#";
    }
    return escapeAttr(trimmed);
}
