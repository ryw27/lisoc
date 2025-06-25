import { Input } from "@/components/ui/input";

export function FormInput({ label, type, extras, register, required }: { label: string; type: string; extras?: any; register?: any, required?: boolean }) {
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
            aria-invalid={!!register?.errors?.message}
            {...register}
            {...extras}
        /> 
    </div>
    )
}

export function FormError({error}: { error: any}) {
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