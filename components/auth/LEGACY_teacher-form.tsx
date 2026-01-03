// "use client";

// import { useRouter } from "next/navigation";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod/v4";
// import { RegisterTeacher } from "@/server/auth/[legacy]/LEGACY_registerTeacher";
// import { nameEmailSchema } from "@/server/auth/schema";
// import { TeacherUserSchema } from "@/server/data-view/entity-configs/(people)/teacher";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { FormError, FormInput, FormSubmit } from "./form-components";

// export default function TeacherForm({
//     registerData,
// }: {
//     registerData: z.infer<typeof nameEmailSchema>;
// }) {
//     const router = useRouter();

//     const form = useForm({
//         resolver: zodResolver(TeacherUserSchema),
//         mode: "onChange",
//         defaultValues: {
//             name: registerData.username,
//             email: registerData.email,
//         },
//     });

//     const onSubmit = async (data: z.infer<typeof TeacherUserSchema>) => {
//         const response = await RegisterTeacher(data);
//         if (!response.ok) {
//             Object.entries(response.fieldErrors ?? {}).forEach(([field, messages]) => {
//                 if (messages && messages.length > 0) {
//                     // @ts-expect-error: field is dynamically typed and matches form field keys
//                     fpForm.setError(field, { message: messages[0] });
//                 }
//             });
//             form.setError("root", { message: response.errorMessage });
//         }

//         router.push("/login/teacher");
//     };

//     return (
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             <h2 className="text-2xl font-bold">Teacher Information</h2>
//             <FormInput
//                 label="Teacher's Chinese Name"
//                 type="text"
//                 register={form.register("namecn")}
//                 required
//             />
//             <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
//                 <div className="flex w-full flex-col">
//                     <FormInput
//                         label="Teacher's First Name"
//                         type="text"
//                         register={form.register("namefirsten")}
//                         required
//                     />
//                 </div>
//                 <div className="flex w-full flex-col">
//                     <FormInput
//                         label="Teacher's Last Name"
//                         type="text"
//                         register={form.register("namelasten")}
//                         required
//                     />
//                 </div>
//             </div>
//             <h2 className="text-2xl font-bold">Contact Information</h2>

//             <FormInput label="Address" type="text" register={form.register("address")} />
//             <FormInput
//                 label="Alternative Address"
//                 type="text"
//                 register={form.register("address1")}
//             />
//             <FormInput label="Phone Number" type="tel" register={form.register("phone")} />

//             {/* <div classNAme="flex flex-col w-full">
//                 <label htmlFor="classtypeid" className="block text-sm text-gray-400 font-bold mb-2">
//                     Class Type
//                 </label>
//                 <Select
//                     onValueChange={(value: string) => form.setValue('')} */}
//             {/* </div> */}
//             <div className="flex w-full gap-2">
//                 <div className="flex-1/2 flex-[0_0_50%]">
//                     <FormInput label="City" type="text" register={form.register("city")} />
//                 </div>
//                 <div className="max-w-[33.3333%] flex-1/3 flex-[0_0_16.6667%]">
//                     <div className="flex w-full flex-col">
//                         <label
//                             htmlFor="state"
//                             className="mb-2 block text-sm font-bold text-gray-400"
//                         >
//                             State
//                         </label>
//                         <Select
//                             defaultValue={form.watch("state") || "NY"}
//                             onValueChange={(value: string) =>
//                                 form.setValue("state", value, { shouldValidate: true })
//                             }
//                         >
//                             <SelectTrigger
//                                 id="state"
//                                 className="mb-3 h-9 w-full rounded-sm px-2 py-4 !text-base"
//                             >
//                                 <SelectValue placeholder="Select a state" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {[
//                                     "AL",
//                                     "AK",
//                                     "AZ",
//                                     "AR",
//                                     "CA",
//                                     "CO",
//                                     "CT",
//                                     "DE",
//                                     "FL",
//                                     "GA",
//                                     "HI",
//                                     "ID",
//                                     "IL",
//                                     "IN",
//                                     "IA",
//                                     "KS",
//                                     "KY",
//                                     "LA",
//                                     "ME",
//                                     "MD",
//                                     "MA",
//                                     "MI",
//                                     "MN",
//                                     "MS",
//                                     "MO",
//                                     "MT",
//                                     "NE",
//                                     "NV",
//                                     "NH",
//                                     "NJ",
//                                     "NM",
//                                     "NY",
//                                     "NC",
//                                     "ND",
//                                     "OH",
//                                     "OK",
//                                     "OR",
//                                     "PA",
//                                     "RI",
//                                     "SC",
//                                     "SD",
//                                     "TN",
//                                     "TX",
//                                     "UT",
//                                     "VT",
//                                     "VA",
//                                     "WA",
//                                     "WV",
//                                     "WI",
//                                     "WY",
//                                 ].map((state) => (
//                                     <SelectItem key={state} value={state}>
//                                         {state}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                     </div>
//                 </div>
//                 <div className="max-w-[66.6667%] flex-2/3 flex-[0_0_33.3333%]">
//                     <FormInput label="Zip Code" type="text" register={form.register("zip")} />
//                 </div>
//             </div>

//             <FormError error={form.formState.errors.root?.message} />

//             <FormSubmit>Submit</FormSubmit>
//         </form>
//     );
// }
