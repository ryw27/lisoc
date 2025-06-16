import { classes } from "@/app/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { allClassRows, updateClassRow } from "../../class-helpers";
import EditEntity, { EditFormField } from "@/components/edit-entity";

export default async function ClassEditPage({
    params,
}: {
    params: { classid: string, error?: string }
}) {
    
    const { classid, error } = await params;
    const classId = parseInt(classid);
    
    // Fetch the class data
    const classData = await db.query.classes.findFirst({
        where: eq(classes.classid, classId)
    });

    if (!classData) {
        notFound();
    }

    const classTypes = [{value: 1, label: "1: Standard Chinese"}, {value: 2, label: "2: 马立平"}, {value: 4, label: "4: Clubs"}];
    const classTypeDefault = classTypes.filter(classType => classType.value === classData.typeid)[0].value.toString();

    // const showError = error !== undefined
    const allClasses = await allClassRows();
    const classlist = allClasses.map((someclass) => someclass.classnamecn);
    
    const currentUpgradeClass = await db.select().from(classes).where(eq(classes.classid, classData.classupid)).limit(1);

    const classFields: EditFormField[] = [
        {
            label: "Class Name (中文)",
            name: "classnamecn",
            defaultValue: classData.classnamecn,
            type: "text",
            required: true
        },
        {
            label: "Class Name (EN)",
            name: "classnameen",
            defaultValue: classData.classnameen,
            type: "text",
            required: true
        },
        {
            label: "Class Type",
            name: "typeid",
            defaultValue: classTypeDefault,
            type: "select",
            required: true,
            options: classTypes.map((type) => ({
                label: type.label,
                value: type.value.toString()
            }))
        },
        {
            label: "Class Level",
            name: "classno",
            defaultValue: classData.classno.toString(),
            type: "select",
            required: true,
            options: Array.from({length: 13}, (_, i) => ({
                label: i.toString(),
                value: i.toString()
            }))
        },
        {
            label: "Size Limits",
            name: "sizelimits",
            defaultValue: classData.sizelimits,
            type: "number",
            required: true
        },
        {
            label: "Status",
            name: "status",
            defaultValue: classData.status,
            type: "select",
            required: true,
            options: [
                {
                    label: "Active",
                    value: "Active"
                },
                {
                    label: "Inactive",
                    value: "Inactive"
                }
            ]
        },
        {
            label: "Upgrade Class",
            name: "classupid",
            defaultValue: currentUpgradeClass && currentUpgradeClass.length > 0 ? currentUpgradeClass[0].classnamecn : "",
            type: "select",
            required: true,
            options: classlist.map((classnamecn) => ({
                label: classnamecn,
                value: classnamecn
            }))
        },
        {
            label: "Description",
            name: "description",
            defaultValue: classData.description,
            type: "textarea",
            required: false
        }
    ]

    async function handleSubmit(formData: FormData) {
        "use server";
        await updateClassRow(classId, formData);
    }

    return (
        <EditEntity
            title="Edit Class"
            fields={classFields}
            submitAction={handleSubmit}
            gobacklink={`/admintest/dashboard/data/classes/${classId}`}
            error={error}
        />
    )

    // return (
    //     <div className="p-6 space-y-4">
    //         <div className="flex justify-between px-4">
    //             <Link 
    //                 href={`/admintest/dashboard/class-view/${classId}`}
    //                 className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
    //             >
    //                 <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
    //             </Link>
    //         </div>
    //         <div className="mx-auto max-w-2xl w-full">
    //             <h1 className="text-2xl font-extrabold mb-4">Edit Class</h1>
    //             <form action={async (formData) => {
    //               "use server";
    //               await updateClass(formData, classid);
    //             }} className="flex flex-col gap-6 p-2">
    //                 <div className="space-y-4">
    //                     <div>
    //                         <label className="block text-sm text-gray-400 font-bold mb-2">Class Name (中文)</label>
    //                         <Input 
    //                             type="text" 
    //                             name="classnamecn"
    //                             defaultValue={classData.classnamecn}
    //                             className="rounded-sm !text-base h-9"
    //                             required
    //                         />
    //                     </div>
    //                     <div>
    //                         <label className="block text-sm text-gray-400 font-bold mb-2">Class Name (EN)</label>
    //                         <Input 
    //                             type="text" 
    //                             name="classnameen"
    //                             defaultValue={classData.classnameen as string}
    //                             className="rounded-sm !text-base h-9"
    //                             required
    //                         />
    //                     </div>
    //                     <div>
    //                         <label className="block text-sm text-gray-400 font-bold mb-2">Class Type</label>
    //                         <Select name="typeid" required defaultValue={(classData.typeid).toString()}>
    //                             <SelectTrigger className="w-full">
    //                                 <SelectValue placeholder={classTypes.filter(classType => classType.startsWith(classData.typeid.toString()))[0]} />
    //                             </SelectTrigger>
    //                             <SelectContent>
    //                                 {classTypes.map((classType, index) => {
    //                                     return (
    //                                         <SelectItem key={classType} value={(index + 1).toString()}>{classType}</SelectItem>
    //                                     )
    //                                 })}
    //                             </SelectContent>
    //                         </Select>
    //                     </div>
    //                     <div>
    //                         <label className="block text-sm text-gray-400 font-bold mb-2">Class Level</label>
    //                         <Select name="classno" required defaultValue={String(classData.classno)}>
    //                             <SelectTrigger className="w-full">
    //                                 <SelectValue placeholder={Number(classData.classno) === 0 ? "0" : (classData.classno || "--Select--")} />
    //                             </SelectTrigger>
    //                             <SelectContent>
    //                                 {Array.from({length: 13}, (_, i) => {
    //                                     return (
    //                                         <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
    //                                     )
    //                                 })} 
    //                             </SelectContent>
    //                         </Select> 
    //                     </div>
    //                     <div>
    //                         <label className="block text-sm text-gray-400 font-bold mb-2">Size Limits</label>
    //                         <Input 
    //                             type="number"
    //                             name="sizelimits"
    //                             placeholder={classData.sizelimits ? classData.sizelimits.toString() : "--Select--"}
    //                             defaultValue={classData.sizelimits ? classData.sizelimits : 0}
    //                             className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
    //                             required
    //                         />
    //                     </div>
    //                     <div className="flex gap-3">
    //                         <div className="w-1/2">
    //                             <label className="block text-sm text-gray-400 font-bold mb-2">Status</label>
    //                             <Select name="status" required defaultValue={classData.status || 'Active'}>
    //                                 <SelectTrigger className="w-full">
    //                                     <SelectValue placeholder={classData.status || 'Active'} />
    //                                 </SelectTrigger>
    //                                 <SelectContent>
    //                                     <SelectItem value="Active">Active</SelectItem>
    //                                     <SelectItem value="Inactive">Inactive</SelectItem>
    //                                 </SelectContent>
    //                             </Select>
    //                         </div>
    //                         <div className="w-1/2">
    //                             <label className="block text-sm text-gray-400 font-bold mb-2">Upgrade Class</label>
    //                             <Select name="classupid" required defaultValue={currentUpgradeClass && currentUpgradeClass.length > 0 ? currentUpgradeClass[0].classnamecn : ""}>
    //                                 <SelectTrigger className="w-full">
    //                                     <SelectValue placeholder={currentUpgradeClass && currentUpgradeClass.length > 0 ? currentUpgradeClass[0].classnamecn : "--Select--"} />
    //                                 </SelectTrigger>
    //                                 <SelectContent className="max-h-[200px] overflow-y-auto">
    //                                     {classlist.map((classnamecn) => {
    //                                         return (
    //                                             <SelectItem key={classnamecn} value={classnamecn}>{classnamecn}</SelectItem>
    //                                         )
    //                                     })}
    //                                 </SelectContent>
    //                             </Select>
    //                         </div>
    //                     </div>
    //                     <div>
    //                         <label className="block text-sm text-gray-400 font-bold mb-2">Description</label>
    //                         <Textarea 
    //                             name="description"
    //                             defaultValue={classData.description ? classData.description : undefined}
    //                             // placeholder={classData.description ? classData.description : "Input description"}
    //                             className="rounded-sm !text-base"
    //                         />
    //                     </div>
    //                 </div>
    //                 {showError && <p className="self-start text-red-400 text-center mt-2">{error}</p>}
    //                 <div className="flex justify-end gap-2">
    //                     <Link href={`/admintest/dashboard/class-view/${classId}`}>
    //                         <button type="button" className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2">
    //                             Cancel
    //                         </button>
    //                     </Link>
    //                     <button type="submit" className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2">
    //                         Save 
    //                     </button>
    //                 </div>
    //             </form>
    //         </div>
    //     </div>
    // );
}

