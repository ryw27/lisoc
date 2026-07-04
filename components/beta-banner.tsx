// Global beta-environment indicator. Rendered once in the root layout so it
// sits on top of every page. Gated on NEXT_PUBLIC_BETA so the same codebase
// shows nothing in production. Kept deliberately non-dismissible and bilingual
// so testers can never mistake the beta deployment for production.

export const IS_BETA = process.env.NEXT_PUBLIC_BETA === "true";

export default function BetaBanner() {
    if (!IS_BETA) return null;

    return (
        <div
            role="alert"
            className="sticky top-0 z-[100] flex w-full items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-amber-950 shadow-sm"
        >
            <span aria-hidden="true">⚠️</span>
            <span>
                BETA — test environment, not production. 测试环境，非正式系统，数据可能随时清除。
            </span>
        </div>
    );
}
