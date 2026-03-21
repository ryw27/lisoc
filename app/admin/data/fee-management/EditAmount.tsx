"use client";

import { useState } from "react";
import { updateFeeAmount } from "./actions"; // Import the server action

export default function EditAmountCell({
    id,
    initialAmount,
}: {
    id: number;
    initialAmount: number;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [amount, setAmount] = useState(initialAmount);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        const result = await updateFeeAmount(id, amount);
        if (result.success) {
            setIsEditing(false);
        } else {
            alert(`Error: ${result.error}`);
        }
        setIsLoading(false);
    };

    return (
        <div>
            {isEditing ? (
                <div className="flex items-center space-x-2">
                    <input
                        type="Number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="rounded border p-1 text-black"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSave}
                        className="rounded bg-blue-500 px-2 py-1 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                        onClick={() => {
                            setAmount(initialAmount);
                            setIsEditing(false);
                        }}
                        className="rounded bg-gray-500 px-2 py-1 text-white"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <span>{amount}</span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="rounded bg-green-500 px-2 py-1 text-white"
                    >
                        Edit
                    </button>
                </div>
            )}
        </div>
    );
}
