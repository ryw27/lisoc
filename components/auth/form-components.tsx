import type { ComponentProps } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface FormInputProps {
    label: string;
    type: string;
    extras?: Omit<
        ComponentProps<"input">,
        | "type"
        | "name"
        | "placeholder"
        | "className"
        | "required"
        | "aria-required"
        | "aria-invalid"
    >;
    register?: UseFormRegisterReturn;
    required?: boolean;
    error?: string;
}

export function FormInput({ label, type, extras, register, required, error }: FormInputProps) {
    return (
        <div className="flex w-full flex-col">
            <label className="text-black-400 mb-2 block text-sm font-bold">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <Input
                type={type}
                name={label}
                placeholder={`Enter your ${label.toLowerCase()}`}
                className="mb-3 h-9 rounded-sm px-2 py-4 !text-base [&::placeholder]:font-medium [&::placeholder]:text-gray-400"
                required={required}
                aria-required={required}
                aria-invalid={!!error}
                {...register}
                {...extras}
            />
        </div>
    );
}

export function FormError({ error }: { error?: string | null }) {
    if (!error) return null;

    return <p className="text-sm text-red-600">{error}</p>;
}

export function FormSubmit({
    children,
    disabled,
    className,
}: {
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            type="submit"
            disabled={disabled}
            className={cn(
                "cursor-pointer rounded-sm bg-blue-600 px-4 py-2 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        >
            {children}
        </button>
    );
}
