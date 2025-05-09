import { ColumnDef } from "@tanstack/react-table";

//Helper function to format date
export function formatDate(date: Date) {
    // Format as YYYY-MM-DD to ensure consistency between server and client
    if (!date) return "";
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        return "Invalid date";
    }
}
//Filter types
export type filterTypes = 
    | {type: 'text'; mode: ['is equal to ']}
    | {type: 'enum'; mode: ['is', 'is not'], options: readonly string[]}
    | {type: 'number'; mode: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is between']}
    | {type: 'date'; mode: ['in the last', 'is equal to', 'is between', 'is on or after', 'is before or on'], options: ['hours', 'days', 'months', 'years']}

export interface ColumnMetaFilter {
    filter?: filterTypes;
}

// Type definitions with their column definitions
export type Class = {
    id: number;
    class_name_cn: string;
    class_name_en: string;
    upgrade_class: string;
    class_level: string;
    class_type: string;
    status: string;
    update_by: string;
    update_at: Date;
    description: string;
    formatted_update_at?: string;
};

export const classColumns: ColumnDef<Class>[] = [
    {
        header: "ID",
        accessorKey: "id",
        meta: { filter: { type: 'number', mode: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is between'] } },
    },
    {
        header: "Class Name (CN)",
        accessorKey: "class_name_cn",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Class Name (EN)",
        accessorKey: "class_name_en",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Upgrade Class",
        accessorKey: "upgrade_class",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Class Level",
        accessorKey: "class_level",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Status",
        accessorKey: "status",
        meta: { filter: { type: 'enum', mode: ['is', 'is not'], options: ['Active', 'Inactive'] } },
    },
    {
        header: "Update By",
        accessorKey: "update_by",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Update At",
        accessorKey: "formatted_update_at",
        meta: { filter: { type: 'date', mode: ['in the last', 'is equal to', 'is between', 'is on or after', 'is before or on'], options: ['hours', 'days', 'months', 'years'] } },
    },    
    {
        header: "Description",
        accessorKey: "description",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
];

export type ReducedClass = {
    id: number;
    class_name_cn: string;
    class_name_en: string;
    class_level: string;
    status: string;
    formatted_update_at?: string;
};

export const reducedClassColumns: ColumnDef<ReducedClass>[] = [
    {
        header: "ID",
        accessorKey: "id",
        meta: { filter: { type: 'number', mode: ['is equal to'] } },
    },
    {
        header: "Class Name (CN)",
        accessorKey: "class_name_cn",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Class Name (EN)",
        accessorKey: "class_name_en",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Class Level",
        accessorKey: "class_level",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Status",
        accessorKey: "status",
        meta: { filter: { type: 'enum', mode: ['is', 'is not'], options: ['Active', 'Inactive'] } },
    },
    {
        header: "Updated At",
        accessorKey: "formatted_update_at",
        meta: { filter: { type: 'date', mode: ['in the last', 'is equal to', 'is between', 'is on or after', 'is before or on'], options: ['hours', 'days', 'months', 'years'] } },
    },
];

export type Teacher = {
    teacher_id: number;
    name: string;
    status: string;
    num_classes: number;
    phone: string;
    email: string;
    last_login: Date;
    user_name: string;
    formatted_last_login?: string;
};

export const teacherColumns: ColumnDef<Teacher>[] = [
    {
        header: "Name",
        accessorKey: "name",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Status",
        accessorKey: "status",
        meta: { filter: { type: 'enum', mode: ['is', 'is not'], options: ['Active', 'Inactive'] } },
    },
    {
        header: "Num Classes",
        accessorKey: "num_classes",
        meta: { filter: { type: 'number', mode: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is between'] } },
    },
    {
        header: "Phone",
        accessorKey: "phone",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Email",
        accessorKey: "email",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Last Login",
        accessorKey: "formatted_last_login",
        meta: { filter: { type: 'date', mode: ['in the last', 'is equal to', 'is between', 'is on or after', 'is before or on'], options: ['hours', 'days', 'months', 'years'] } },
    },
    {
        header: "User Name",
        accessorKey: "user_name",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
];

export type Parent = {
    id: number;
    name_en: string;
    name_cn: string;
    email: string;
    phone: string;
    city: string;
    zip: string;
    status: string;
    last_login: Date;
    formatted_last_login?: string;
};

export const parentColumns: ColumnDef<Parent>[] = [
    {
        header: "Name",
        accessorKey: "name_en",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Email",
        accessorKey: "email",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Phone",
        accessorKey: "phone",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "City",
        accessorKey: "city",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Zip",
        accessorKey: "zip",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Status",
        accessorKey: "status",
        meta: { filter: { type: 'enum', mode: ['is', 'is not'], options: ['Active', 'Inactive'] } },
    },
    {
        header: "Last Login",
        accessorKey: "formatted_last_login",
        meta: { filter: { type: 'date', mode: ['in the last', 'is equal to', 'is between', 'is on or after', 'is before or on'], options: ['hours', 'days', 'months', 'years'] } },
    },
];

export type Student = {
    family_id: number;
    registration_number: number;
    name_en: string;
    name_cn: string;
    gender: string;
    age: number;
    dob: Date;
    semester: string;
    teacher: string;
    period: string;
    status: string;
    course: string;
    phone: string;
    email: string; 
    formatted_dob?: string;
};

export const studentColumns: ColumnDef<Student>[] = [
    {
        header: "Family ID",
        accessorKey: "family_id",
        meta: { filter: { type: 'number', mode: ['is equal to'] } },
    },
    {
        header: "Registration Number",
        accessorKey: "registration_number",
        meta: { filter: { type: 'number', mode: ['is equal to'] } },
    },
    {
        header: "Name (EN)",
        accessorKey: "name_en",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Name (CN)",
        accessorKey: "name_cn",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Gender",
        accessorKey: "gender",
        meta: { filter: { type: 'enum', mode: ['is', 'is not'], options: ['Male', 'Female', 'Other'] } },
    },
    {
        header: "Age",
        accessorKey: "age",
        meta: { filter: { type: 'number', mode: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is between'] } },
    },
    {
        header: "DOB",
        accessorKey: "formatted_dob",
        meta: { filter: { type: 'date', mode: ['in the last', 'is equal to', 'is between', 'is on or after', 'is before or on'], options: ['hours', 'days', 'months', 'years'] } },
    },
    {
        header: "Semester",
        accessorKey: "semester",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Teacher",
        accessorKey: "teacher",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Period",
        accessorKey: "period",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Status",
        accessorKey: "status",
        meta: { filter: { type: 'enum', mode: ['is', 'is not'], options: ['Active', 'Inactive'] } },
    },
    {
        header: "Course",
        accessorKey: "course",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Phone",
        accessorKey: "phone",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Email",
        accessorKey: "email",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
];

export type Classroom = {
    room_id: number;
    classroom_name: string;
    seats: number;
    status: string;
    notes: string;
};

export const classroomColumns: ColumnDef<Classroom>[] = [
    {
        header: "Room ID",
        accessorKey: "room_id",
        meta: { filter: { type: 'number', mode: ['is equal to'] } },
    },
    {
        header: "Classroom Name",
        accessorKey: "classroom_name",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Seats",
        accessorKey: "seats",
        meta: { filter: { type: 'number', mode: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is between'] } },
    },
    {
        header: "Status",
        accessorKey: "status",
        meta: { filter: { type: 'enum', mode: ['is', 'is not'], options: ['Active', 'Inactive'] } },
    },
    {
        header: "Notes",
        accessorKey: "notes",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
];

export type Feedback = {
    id: number;
    fid: number;
    name: string;
    phone: string;
    email: string;
    date: Date;
    feedback: string;
    formatted_date?: string;
};

export const feedbackColumns: ColumnDef<Feedback>[] = [
    {
        header: "Name",
        accessorKey: "name",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Phone",
        accessorKey: "phone",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Email",
        accessorKey: "email",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Date",
        accessorKey: "formatted_date",
        meta: { filter: { type: 'date', mode: ['in the last', 'is equal to', 'is between', 'is on or after', 'is before or on'], options: ['hours', 'days', 'months', 'years'] } },
    },
    {
        header: "Feedback",
        accessorKey: "feedback",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
];

export type Transactions = {
    fid: number;
    father_name: string;
    mother_name: string;
    phone: string;
    amount: number;
    issued_date: Date;
    issued_by: string;
    status: string;
    balanceid: number;
    memo: string; 
    formatted_issued_date?: string;
};

export const transactionsColumns: ColumnDef<Transactions>[] = [
    {
        header: "Father Name",
        accessorKey: "father_name",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Mother Name",
        accessorKey: "mother_name",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Phone",
        accessorKey: "phone",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Amount",
        accessorKey: "amount",
        meta: { filter: { type: 'number', mode: ['is equal to', 'is not equal to', 'is greater than', 'is less than', 'is greater than or equal to', 'is less than or equal to', 'is between'] } },
    },
    {
        header: "Issued Date",
        accessorKey: "formatted_issued_date",
        meta: { filter: { type: 'date', mode: ['in the last', 'is equal to', 'is between', 'is on or after', 'is before or on'], options: ['hours', 'days', 'months', 'years'] } },
    },
    {
        header: "Issued By",
        accessorKey: "issued_by",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
    {
        header: "Status",
        accessorKey: "status",
        meta: { filter: { type: 'enum', mode: ['is', 'is not'], options: ['Completed', 'Pending', 'Cancelled'] } },
    },
    {
        header: "Balance ID",
        accessorKey: "balanceid",
        meta: { filter: { type: 'number', mode: ['is equal to'] } },
    },
    {
        header: "Memo",
        accessorKey: "memo",
        meta: { filter: { type: 'text', mode: ['is equal to'] } },
    },
];