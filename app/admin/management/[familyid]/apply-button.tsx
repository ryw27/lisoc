"use client";
import { applyCheck } from "@/lib/payments/actions/adminApplyCheck";
import { Input } from "@/components/ui/input";
import { checkApplySchema } from "@/lib/payments/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod/v4";
import { familyObj } from "@/lib/shared/types";
import { useRef } from "react";

export default function ApplyButton({ family }: { family: familyObj }) {
    const formRef = useRef<HTMLFormElement>(null);
    
    const today = new Date().toISOString().split('T')[0];

    const checkForm = useForm({
        resolver: zodResolver(checkApplySchema),
        defaultValues: {
            paidDate: today 
        }
    })

    const onSubmit = async (formData: z.infer<typeof checkApplySchema>) => {
        try {
            await applyCheck(formData, family.familyid);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            checkForm.setError("root", { message: errorMessage });
            console.error(error);
        }
        finally {
            formRef.current?.reset();   // Optionally reset the form or provide feedback to the user
        }
    };

    return (
        <form ref={formRef}
            onSubmit={checkForm.handleSubmit(onSubmit)}
            className="flex gap-2 items-center mx-auto container justify-center"
        >
            <label className="text-sm" htmlFor="balanceid">
                Apply to
            </label>
            <Input
                id="balanceid"
                placeholder="Balance ID"
                type="number"
                className="border border-gray-300 rounded-md p-2 w-28"
                {...checkForm.register("balanceid", { required: true })}
            />
            <Input
                placeholder="Amount"
                type="number"
                className="border border-gray-300 rounded-md p-2 w-40"
                step="0.01"
                {...checkForm.register("amount", { required: true, valueAsNumber: true })}
            />
            <Input
                placeholder="Check No"
                type="text"
                className="border border-gray-300 rounded-md p-2 w-40"
                {...checkForm.register("checkNo")}
            />
            <Input
                placeholder="Paid Date"
                type="date"
                defaultValue={today}
                className="border border-gray-300 rounded-md p-2 w-40"
                {...checkForm.register("paidDate")}
            />
            <Input
                placeholder="Note"
                type="text"
                className="border border-gray-300 rounded-md p-2 w-60"
                {...checkForm.register("note")}
            />


            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
                Apply
            </button>
        </form>
    );
}