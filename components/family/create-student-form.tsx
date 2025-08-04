"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from 'zod/v4'
import { Input } from "@/components/ui/input";
import { createStudent } from "@/lib/family/actions/createStudent";
import { studentSchema } from "@/lib/family/validation";
import { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";




export default function CreateStudentForm({ familyid }: { familyid: number }) {
    const [error, setError] = useState<string | null>()
    const [busy, setBusy] = useState<boolean>(false);

    const studentForm = useForm({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            familyid: familyid,
        },
        mode: "onBlur"
    })

    const onSubmit = async (data: z.infer<typeof studentSchema>) => {
        setBusy(true);
        setError(null);
        try {
            const studentData = studentSchema.parse(data);
            await createStudent(studentData, familyid);
            studentForm.reset();
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.issues.map((e) => {
                    studentForm.setError(e.path as unknown as keyof z.infer<typeof studentSchema>, { message: e.message });
                })
            } else if (typeof error === "string") {
                setError(error);
            } else {
                setError("Unknown error occured. Please try again or contact regadmin");
            }
        } finally {
            setBusy(false);
        }
    }



    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 mt-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Add New Student</h2>
            <form
                onSubmit={studentForm.handleSubmit(onSubmit)}
                className="space-y-5"
                autoComplete="off"
            >
                <div>
                    <label htmlFor="namecn" className="block text-sm font-medium text-gray-700 mb-1">
                        Chinese Name
                    </label>
                    <Input
                        type="text"
                        id="namecn"
                        placeholder="中文名"
                        {...studentForm.register('namecn')}
                        className="w-full"
                    />
                    {studentForm.formState.errors.namecn && (
                        <span className="text-red-500 text-xs">
                            {studentForm.formState.errors.namecn.message}
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label htmlFor="namelasten" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name (EN)
                        </label>
                        <Input
                            type="text"
                            id="namelasten"
                            placeholder="Last Name"
                            {...studentForm.register('namelasten')}
                            className="w-full"
                        />
                        {studentForm.formState.errors.namelasten && (
                            <span className="text-red-500 text-xs">
                                {studentForm.formState.errors.namelasten.message}
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <label htmlFor="namefirsten" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name (EN)
                        </label>
                        <Input
                            type="text"
                            id="namefirsten"
                            placeholder="First Name"
                            {...studentForm.register('namefirsten')}
                            className="w-full"
                        />
                        {studentForm.formState.errors.namefirsten && (
                            <span className="text-red-500 text-xs">
                                {studentForm.formState.errors.namefirsten.message}
                            </span>
                        )}
                    </div>
                </div>
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                    </label>
                    {/* Use shadcn/ui Select for gender */}
                    <Select
                        value={studentForm.watch('gender') || ""}
                        onValueChange={value => studentForm.setValue('gender', value as "Male" | "Female" | "Other", { shouldValidate: true })}
                        name="gender"
                    >
                        <SelectTrigger
                            id="gender"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            aria-invalid={!!studentForm.formState.errors.gender}
                        >
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    {studentForm.formState.errors.gender && (
                        <span className="text-red-500 text-xs">
                            {studentForm.formState.errors.gender.message}
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                            Age
                        </label>
                        <Input
                            type="number"
                            id="age"
                            min={1}
                            {...studentForm.register('age', { valueAsNumber: true })}
                            className="w-full"
                        />
                        {studentForm.formState.errors.age && (
                            <span className="text-red-500 text-xs">
                                {studentForm.formState.errors.age.message}
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth
                        </label>
                        <Input
                            type="date"
                            id="dob"
                            {...studentForm.register('dob')}
                            className="w-full"
                        />
                        {studentForm.formState.errors.dob && (
                            <span className="text-red-500 text-xs">
                                {studentForm.formState.errors.dob.message}
                            </span>
                        )}
                    </div>
                </div>
                {/* <div className="flex items-center gap-2">
                    <Input
                        type="checkbox"
                        id="active"
                        {...studentForm.register('active')}
                        className="h-4 w-4"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">
                        Active
                    </label>
                </div> */}
                {/* <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <Input
                        type="text"
                        id="notes"
                        placeholder="Additional notes"
                        {...studentForm.register('notes')}
                        className="w-full"
                    />
                    {studentForm.formState.errors.notes && (
                        <span className="text-red-500 text-xs">
                            {studentForm.formState.errors.notes.message}
                        </span>
                    )}
                </div> */}
                {error && (
                    <div className="text-red-600 text-sm text-center">{error}</div>
                )}
                <button
                    type="submit"
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-60 ${
                        busy || !studentForm.formState.isValid || studentForm.formState.isSubmitting
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                    }`}
                    disabled={busy || !studentForm.formState.isValid || studentForm.formState.isSubmitting}
                >
                    {busy ? "Creating..." : "Create Student"}
                </button>
            </form>
        </div>
    )
}