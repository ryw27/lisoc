import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Table, TableName } from '@/lib/data-view/types'

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
}

// Discriminated union for different field types
export type FormField = 
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
        options: SelectOption[] // Required for select fields
        multiple?: boolean
    })

export interface AddEntityProps<N extends TableName, T extends Table<N>> {
    title: string
    description: string
    fields: FormField[]
    submitAction: (formData: FormData) => Promise<void>
    error?: string
    submitText?: string
}

// TODO: Cache results in between errors
export default function AddEntity<N extends TableName, T extends Table<N>>({
    title,
    description,
    fields,
    submitAction,
    error,
    submitText = "Save",
}: AddEntityProps<N, T>) {
    
    const renderField = (field: FormField) => {
        const baseClasses = "rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
        
        switch (field.type) {
            case 'text':
                return (
                    <Input
                        type="text"
                        name={field.name}
                        placeholder={field.placeholder}
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
                        className={baseClasses}
                        required={field.required}
                        aria-required={field.required}
                        rows={field.rows}
                    />
                )
            
            case 'select':
                return (
                    <Select 
                        name={field.name} 
                        required={field.required}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={field.placeholder || "-- Select --"} />
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
    const groupedFields: FormField[][] = []
    let currentGroup: FormField[] = []
    
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
        <main className="flex flex-col gap-2">
            <div className="max-w-2xl mx-auto w-full">
                <h1 className="text-2xl font-bold mr-10">{title}</h1>
                <p className="text-sm text-gray-400">{description}</p>
                
                <form action={submitAction} className="flex flex-col p-2">
                    {groupedFields.map((fieldGroup, groupIndex) => (
                        <div 
                            key={groupIndex} 
                            className={`mb-6 ${fieldGroup.length > 1 ? 'flex gap-3' : ''}`}
                        >
                            {fieldGroup.map((field) => (
                                <div 
                                    key={field.name} 
                                    className={fieldGroup.length > 1 ? 'w-1/2' : 'w-full'}
                                >
                                    <label className="block text-sm text-gray-400 font-bold mb-2">
                                        {field.label}
                                    </label>
                                    {renderField(field)}
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {error && (
                        <p className="self-start text-red-400 text-center mt-2">{error}</p>
                    )}
                    
                    <button 
                        type="submit" 
                        className="text-white rounded-sm bg-blue-600 cursor-pointer text-lg font-bold py-2 px-4"
                    >
                        {submitText}
                    </button>
                </form>
            </div>
        </main>
    )
}