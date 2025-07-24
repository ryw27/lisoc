"use client";
import { applyCheck } from "@/app/lib/semester/sem-actions";
import { Input } from "@/components/ui/input";
import { checkApplySchema } from "@/app/lib/semester/sem-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod/v4";
import { familyObject } from "../../data/(people-pages)/families/family-helpers";

interface ApplyFormState {
  balanceId: string;
  amount: string;
  checkNo: string;
  paidDate: string;
}



export default function ApplyButton({ family }: { family: familyObject }) {
    const today = new Date().toISOString().split('T')[0];

    const checkForm = useForm({
        resolver: zodResolver(checkApplySchema),
        defaultValues: {
            paidDate: today 
        }
    })



    const onSubmit = async (formData: z.infer<typeof checkApplySchema>) => {
        try {
            // console.log(formData);
            await applyCheck(formData, family);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            checkForm.setError("root", { message: errorMessage });
            console.error(error);
        }
    };

    return (
        <form
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
                min="0"
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
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
                Apply
            </button>
        </form>
    );
}