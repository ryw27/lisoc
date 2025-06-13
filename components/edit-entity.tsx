import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'

export interface SelectOption {
    value: string
    label: string
}

// Base interface for common properties
interface BaseFormField {
    name: string
    label: string
    placeholder?: string
    required?: boolean
    width?: 'full' | 'half' | 'third' | 'quarter'
    defaultValue?: string | number | null
}

// Discriminated union for different field types
export type EditFormField = 
    | (BaseFormField & {
        type: 'text'
    })
    | (BaseFormField & {
        type: 'number'
        min?: number
        max?: number
        step?: number
    })
    | (BaseFormField & {
        type: 'textarea'
        rows?: number
    })
    | (BaseFormField & {
        type: 'select'
        options: SelectOption[]
        multiple?: boolean
    })

export interface EditEntityProps {
    title: string
    fields: EditFormField[]
    submitAction: (formData: FormData) => Promise<void>
    cancelHref: string
    error?: string
    submitText?: string
    cancelText?: string
    entityId?: string | number
}

export default function EditEntity({
    title,
    fields,
    submitAction,
    cancelHref,
    error,
    submitText = "Save",
    cancelText = "Cancel",
    entityId
}: EditEntityProps) {
    
    const renderField = (field: EditFormField) => {
        const baseClasses = "rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
        
        switch (field.type) {
            case 'text':
                return (
                    <Input
                        type="text"
                        name={field.name}
                        placeholder={field.placeholder}
                        defaultValue={field.defaultValue as string || ''}
                        className={baseClasses}
                        required={field.required}
                        aria-required={field.required}
                    />
                )
            
            case 'number':
                return (
                    <Input
                        type="number"
                        name={field.name}
                        placeholder={field.placeholder}
                        defaultValue={field.defaultValue ? String(field.defaultValue) : ''}
                        className={baseClasses}
                        required={field.required}
                        aria-required={field.required}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                    />
                )
            
            case 'textarea':
                return (
                    <Textarea
                        name={field.name}
                        placeholder={field.placeholder}
                        defaultValue={field.defaultValue as string || ''}
                        className={baseClasses}
                        required={field.required}
                        aria-required={field.required}
                        rows={field.rows}
                    />
                )
            
            case 'select':
                // Find the current option for display
                const currentOption = field.options.find(
                    option => option.value === String(field.defaultValue)
                );
                
                return (
                    <Select 
                        name={field.name} 
                        required={field.required}
                        defaultValue={field.defaultValue ? String(field.defaultValue) : undefined}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue 
                                placeholder={
                                    currentOption?.label || 
                                    field.placeholder || 
                                    "-- Select --"
                                } 
                            />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {field.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            
            default:
                // TypeScript will ensure this is never reached
                const _exhaustiveCheck: never = field
                return null
        }
    }

    // Group fields by width for proper layout
    const groupedFields: EditFormField[][] = []
    let currentGroup: EditFormField[] = []
    
    fields.forEach((field) => {
        if (field.width === 'half') {
            currentGroup.push(field)
            if (currentGroup.length === 2) {
                groupedFields.push([...currentGroup])
                currentGroup = []
            }
        } else if (field.width === 'third') {
            currentGroup.push(field)
            if (currentGroup.length === 3) {
                groupedFields.push([...currentGroup])
                currentGroup = []
            }
        } else if (field.width === 'quarter') {
            currentGroup.push(field)
            if (currentGroup.length === 4) {
                groupedFields.push([...currentGroup])
                currentGroup = []
            }
        } else {
            if (currentGroup.length > 0) {
                groupedFields.push([...currentGroup])
                currentGroup = []
            }
            groupedFields.push([field])
        }
    })
    
    // Handle remaining fields in currentGroup
    if (currentGroup.length > 0) {
        groupedFields.push([...currentGroup])
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href={cancelHref}
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>
            </div>
            
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4">{title}</h1>
                
                <form action={submitAction} className="flex flex-col gap-6 p-2">
                    <div className="space-y-4">
                        {groupedFields.map((fieldGroup, groupIndex) => (
                            <div 
                                key={groupIndex} 
                                className={fieldGroup.length > 1 ? 'flex gap-3' : ''}
                            >
                                {fieldGroup.map((field) => (
                                    <div 
                                        key={field.name} 
                                        className={`${
                                            fieldGroup.length === 1 ? 'w-full' :
                                            fieldGroup.length === 2 ? 'w-1/2' :
                                            fieldGroup.length === 3 ? 'w-1/3' :
                                            fieldGroup.length === 4 ? 'w-1/4' : 'w-full'
                                        }`}
                                    >
                                        <label className="block text-sm text-gray-400 font-bold mb-2">
                                            {field.label}
                                        </label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    
                    {error && (
                        <p className="self-start text-red-400 text-center mt-2">{error}</p>
                    )}
                    
                    <div className="flex justify-end gap-2">
                        <Link href={cancelHref}>
                            <button 
                                type="button" 
                                className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                            >
                                {cancelText}
                            </button>
                        </Link>
                        <button 
                            type="submit" 
                            className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
                        >
                            {submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
