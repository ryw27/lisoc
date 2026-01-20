"use client";

import React, { useState } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth/actions";
import { familyResetPassword } from "@/server/auth/familyRestPassword";

export default function UpdatePasswordPage() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const auth = await requireRole(["FAMILY"]);
            if (!auth) {
                redirect("/forbidden");
            }
            const data = {
                email: String(auth.user.name),
                oldpassword: oldPassword,
                newpassword: newPassword,
            };
            const result = await familyResetPassword(data);
            if (!result.ok) {
                setError(result.message);
                return;
            }

            setSuccess("Password updated successfully/密码更新成功");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-6 text-2xl font-bold">Update Password (重置密码)</h1>

            {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
            {success && (
                <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="password"
                    placeholder="Old Password/旧密码"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded border px-4 py-2"
                />
                <input
                    type="password"
                    placeholder="New Password/新密码"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded border px-4 py-2"
                />
                <input
                    type="password"
                    placeholder="Confirm New Password/确认新密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded border px-4 py-2"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Updating/更新中..." : "Update Password (更新密码)"}
                </button>
            </form>
        </div>
    );
}
