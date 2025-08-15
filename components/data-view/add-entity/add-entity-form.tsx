"use client";
import { Input } from '@/components/ui/input'
import { 
    Select, 
    SelectTrigger, 
    SelectValue, 
    SelectContent, 
    SelectItem 
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { useState } from "react";
import { Button } from '../../ui/button';
import { useActionState } from 'react';
import { insertRow } from '@/lib/data-view/actions/insertRow';
// import { Table } from '@/lib/data-view/types';
import { type Registry } from '@/lib/data-view/registry';
import { type FormSections, type FormField } from '@/lib/data-view/types';



export interface AddEntityProps {
    fields: FormSections[];
    entity: keyof Registry;
}

type FormState = {
    ok?: boolean;
    message?: string;
    id?: string | number;
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
}

const renderField = (
    field: FormField,
    opts: {
        pending: boolean;
        selectValues: Record<string, string>;
        setSelectValue: (name: string, value: string) => void;
        fieldError?: string[];
    }
) => {
    // const baseClasses = "rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
    
    switch (field.type) {
        case 'text':
            return (
                <Input
                    type="text"
                    name={field.name}
                    placeholder={field.placeholder}
                    // className={baseClasses}
                    required={field.required}
                    aria-invalid={Boolean(opts.fieldError?.length)}
                    aria-describedby={opts.fieldError?.length ? `${field.name}-error` : undefined}
                    disabled={opts.pending}
                    aria-required={field.required}
                />
            )
        case 'date':
            return (
                <Input
                    type="date"
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    aria-invalid={Boolean(opts.fieldError?.length)}
                    aria-describedby={opts.fieldError?.length ? `${field.name}-error` : undefined}
                    disabled={opts.pending}
                    aria-required={field.required}
                />
            );
        case 'password':
            return (
                <Input
                    type="password"
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    aria-invalid={Boolean(opts.fieldError?.length)}
                    aria-describedby={opts.fieldError?.length ? `${field.name}-error` : undefined}
                    disabled={opts.pending}
                    aria-required={field.required}
                />
            );
        case 'number':
            return (
                <Input
                    type="number"
                    name={field.name}
                    placeholder={field.placeholder}
                    // className={baseClasses}
                    required={field.required}
                    aria-invalid={Boolean(opts.fieldError?.length)}
                    aria-describedby={opts.fieldError?.length ? `${field.name}-error` : undefined}
                    disabled={opts.pending}
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
                    // className={baseClasses}
                    required={field.required}
                    aria-invalid={Boolean(opts.fieldError?.length)}
                    aria-describedby={opts.fieldError?.length ? `${field.name}-error` : undefined}
                    disabled={opts.pending}
                    aria-required={field.required}
                    rows={field.rows}
                />
            )
        
        case 'select':
            return (
                <>
                    {/* Hidden input to ensure value is posted in FormData */}
                    <input type="hidden" name={field.name} value={opts.selectValues[field.name] ?? ''} />
                    <Select 
                        value={opts.selectValues[field.name] ?? ''}
                        onValueChange={(v) => opts.setSelectValue(field.name, v)}
                        required={field.required}
                        disabled={opts.pending}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={field.placeholder || "-- Select --"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {field.options.map((opt) => (
                                <SelectItem value={String(opt.val)} key={String(opt.val)}>
                                    {opt.labelcn}
                                </SelectItem>
                            ))} 
                        </SelectContent>
                    </Select>
                </>
            )
        default:
            return null
    }
}

export default function AddEntityForm({
    fields,
    entity
}: AddEntityProps) {
    const initialState: FormState = {}

    const [selectValues, setSelectValues] = useState<Record<string, string>>({});
    const setSelectValue = (name: string, value: string) => setSelectValues((s) => ({ ...s, [name]: value }));

    const insertReducer = async (
        _prevState: FormState,
        formData: FormData
    ) => {
        return await insertRow(entity, formData);
    };

    // useActionState returns [state, dispatch, isPending]
    const [state, formAction, pending] = useActionState<FormState, FormData>(insertReducer, initialState); 


    return (
        <div className="flex flex-col gap-2">
            <div className="max-w-2xl mx-auto w-full">
                <form className="flex flex-col p-2 gap-6" action={formAction} aria-busy={pending}>
                    {state?.formErrors && state.formErrors.length > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {state.formErrors.map((err, i) => (
                                <p key={i}>{err}</p>
                            ))}
                        </div>
                    )}

                    {fields.map((section) => {
                        const rows: FormField[][] = [];
                        let currentRow: FormField[] = [];
                        for (const f of section.sectionFields) {
                            if (f.width === 'half') {
                                currentRow.push(f);
                                if (currentRow.length === 2) {
                                    rows.push(currentRow);
                                    currentRow = [];
                                }
                            } else if (f.width === 'third') {
                                currentRow.push(f);
                                if (currentRow.length === 3) {
                                    rows.push(currentRow);
                                    currentRow = [];
                                }
                            } else if (f.width === 'quarter') {
                                currentRow.push(f);
                                if (currentRow.length === 4) {
                                    rows.push(currentRow);
                                    currentRow = [];
                                }
                            } else {
                                if (currentRow.length > 0) {
                                    rows.push(currentRow);
                                    currentRow = [];
                                }
                                rows.push([f]);
                            }
                        }
                        if (currentRow.length > 0) rows.push(currentRow);

                        return (
                            <section key={section.section} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">{section.section}</h3>
                                <div className="flex flex-col gap-4">
                                    {rows.map((row, idx) => (
                                        <div key={idx} className={`flex ${row.length > 1 ? 'gap-3' : ''}`}>
                                            {row.map((field) => {
                                                const fieldErr = state?.fieldErrors?.[field.name];
                                                return (
                                                    <div key={field.name} className={row.length > 1 ? 'w-1/2' : 'w-full'}>
                                                        <label className="block text-sm text-gray-600 font-medium mb-2" htmlFor={field.name}>
                                                            {field.label} {field.required ? <span className="text-red-500">*</span> : ''}
                                                        </label>
                                                        {renderField(field, { pending, selectValues, setSelectValue, fieldError: fieldErr })}
                                                        {fieldErr && fieldErr.length > 0 && (
                                                            <p id={`${field.name}-error`} className="mt-1 text-xs text-red-600">
                                                                {fieldErr.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {state?.message && (
                        <p aria-live="polite" className={`text-sm ${state.ok ? 'text-green-700' : 'text-red-700'}`}>
                            {state.message}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit" 
                            variant="default"
                            aria-label='Submit'
                            disabled={pending}
                        >
                            {pending ? 'Submitting…' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}