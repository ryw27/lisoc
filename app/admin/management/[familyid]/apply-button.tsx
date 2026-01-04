"use client";

import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod/v4";
import { familyObj } from "@/types/shared.types";
import { applyCheck } from "@/server/payments/actions";
import { checkApplySchema } from "@/server/payments/schema";
import { Input } from "@/components/ui/input";

export default function ApplyButton({ family }: { family: familyObj }) {
    const formRef = useRef<HTMLFormElement>(null);

    const today = new Date().toISOString().split("T")[0];

    const checkForm = useForm({
        resolver: zodResolver(checkApplySchema),
        defaultValues: {
            paidDate: today,
        },
    });

    const onSubmit = async (formData: z.infer<typeof checkApplySchema>) => {
        try {
            await applyCheck(formData, family.familyid);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            checkForm.setError("root", { message: errorMessage });
            console.error(error);
        } finally {
            formRef.current?.reset(); // Optionally reset the form or provide feedback to the user
        }
    };

    return (
        <form
            ref={formRef}
            onSubmit={checkForm.handleSubmit(onSubmit)}
            className="container mx-auto flex items-center justify-center gap-2"
        >
            <label className="text-sm" htmlFor="balanceid">
                Apply to
            </label>
            <Input
                id="balanceid"
                placeholder="Balance ID"
                type="number"
                className="w-28 rounded-md border border-gray-300 p-2"
                {...checkForm.register("balanceid", { required: true })}
            />
            <Input
                placeholder="Amount"
                type="number"
                className="w-40 rounded-md border border-gray-300 p-2"
                step="0.01"
                {...checkForm.register("amount", { required: true, valueAsNumber: true })}
            />
            <Input
                placeholder="Check No"
                type="text"
                className="w-40 rounded-md border border-gray-300 p-2"
                {...checkForm.register("checkNo")}
            />
            <Input
                placeholder="Paid Date"
                type="date"
                defaultValue={today}
                className="w-40 rounded-md border border-gray-300 p-2"
                {...checkForm.register("paidDate")}
            />
            <Input
                placeholder="Note"
                type="text"
                className="w-60 rounded-md border border-gray-300 p-2"
                {...checkForm.register("note")}
            />

            <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
                Apply
            </button>
        </form>
    );
}
