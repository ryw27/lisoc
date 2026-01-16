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
            className="container mx-auto flex items-end justify-center gap-3 py-4"
        >
            {/* Label styled as metadata */}
            <label
                className="text-muted-foreground mb-2 text-xs font-bold tracking-wide uppercase"
                htmlFor="balanceid"
            >
                Apply to:
            </label>

            <Input
                id="balanceid"
                placeholder="Balance ID"
                type="number"
                className="border-input bg-background focus:border-accent focus:ring-accent w-28 px-3 py-2 text-sm focus:ring-1"
                {...checkForm.register("balanceid", { required: true })}
            />

            <Input
                placeholder="Amount"
                type="number"
                step="0.01"
                className="border-input bg-background focus:border-accent focus:ring-accent w-40 px-3 py-2 text-sm focus:ring-1"
                {...checkForm.register("amount", { required: true, valueAsNumber: true })}
            />

            <Input
                placeholder="Check No"
                type="text"
                className="border-input bg-background focus:border-accent focus:ring-accent w-40 px-3 py-2 text-sm focus:ring-1"
                {...checkForm.register("checkNo")}
            />

            <Input
                placeholder="Paid Date"
                type="date"
                defaultValue={today}
                className="border-input bg-background focus:border-accent focus:ring-accent w-40 px-3 py-2 text-sm focus:ring-1"
                {...checkForm.register("paidDate")}
            />

            <Input
                placeholder="Memo / Note"
                type="text"
                className="border-input bg-background focus:border-accent focus:ring-accent w-60 px-3 py-2 text-sm focus:ring-1"
                {...checkForm.register("note")}
            />

            <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm px-6 py-2 text-xs font-bold tracking-widest uppercase shadow-sm transition-colors"
            >
                Apply
            </button>
        </form>
    );
}
