import { Input } from "@/components/ui/input";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { ComponentProps } from "react";

interface FormInputProps {
  label: string;
  type: string;
  extras?: Omit<ComponentProps<"input">, "type" | "name" | "placeholder" | "className" | "required" | "aria-required" | "aria-invalid">;
  register?: UseFormRegisterReturn;
  required?: boolean;
  error?: string;
}

export function FormInput({ label, type, extras, register, required, error }: FormInputProps) {
    return (
    <div className="flex flex-col w-full">
        <label className="block text-sm text-gray-400 font-bold mb-2">{label}</label>
        <Input
            type={type}
            name={label}
            placeholder={`Enter your ${label.toLowerCase()}`}
            className="rounded-sm mb-3 px-2 py-4 !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            {...register}
            {...extras}
        /> 
    </div>
    )
}

export function FormError({error}: { error?: string | null }) {
    if (!error) return null;
    
    return (
        <p className="text-sm text-red-600">{error}</p>
    )
}

export function FormSubmit({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
    return (
        <button type="submit" disabled={disabled} className="text-white rounded-sm bg-blue-600 cursor-pointer text-lg font-bold py-2 px-4 disabled:opacity-50">
            {children}
        </button> 
    )
}