"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from 'zod/v4'
import { Input } from "@/components/ui/input";
import { createStudent } from "@/app/lib/semester/sem-actions";
import { studentSchema } from "@/app/lib/semester/sem-schemas";


export default function CreateStudentForm({ familyid }: { familyid: number }) {
    const studentForm = useForm({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            familyid: familyid,
        }
    })

    const onSubmit = async (data: z.infer<typeof studentSchema>) => {
        try {
            const studentData = studentSchema.parse(data);
            const newStudent = await createStudent(studentData, familyid);
            console.log(newStudent);
        } catch (error) {
            console.error(error);
        }
    }

    console.log(studentForm.formState.errors);


    return (
        <div>
            <form onSubmit={studentForm.handleSubmit(onSubmit)}>
                <div>
                    <label htmlFor="studentno">Student No</label>
                    <Input type="text" id="studentno" {...studentForm.register('studentno')} />
                </div>
                <div>
                    <label htmlFor="namecn">Name</label>
                    <Input type="text" id="namecn" {...studentForm.register('namecn')} />
                </div>
                <div>
                    <label htmlFor="namelasten">Last Name</label>
                    <Input type="text" id="namelasten" {...studentForm.register('namelasten')} />
                </div>
                <div>
                    <label htmlFor="namefirsten">First Name</label>
                    <Input type="text" id="namefirsten" {...studentForm.register('namefirsten')} />
                </div>
                <div>
                    <label htmlFor="gender">Gender</label>
                    <Input type="text" id="gender" {...studentForm.register('gender')} />
                </div>
                <div>
                    <label htmlFor="ageof">Age of</label>
                    <Input type="text" id="ageof" {...studentForm.register('ageof')} />
                </div>
                <div>
                    <label htmlFor="age">Age</label>
                    <Input
                        type="number"
                        id="age"
                        {...studentForm.register('age', {
                            valueAsNumber: true,
                        })}
                    />
                    {studentForm.formState.errors.age && (
                        <span className="text-red-500 text-sm">
                            {studentForm.formState.errors.age.message}
                        </span>
                    )}
                </div>
                <div>
                    <label htmlFor="dob">Date of Birth</label>
                    <Input type="date" id="dob" {...studentForm.register('dob')} />
                </div>
                <div>
                    <label htmlFor="active">Active</label>
                    <Input type="checkbox" id="active" {...studentForm.register('active')} />
                </div>
                <div>
                    <label htmlFor="notes">Notes</label>
                    <Input type="text" id="notes" {...studentForm.register('notes')} />
                </div>
                <button type="submit">Create Student</button>
            </form>
        </div>
    )
}