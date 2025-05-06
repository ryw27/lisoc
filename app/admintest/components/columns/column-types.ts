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

//Column type definitions

export type Class = {
    id: number;
    class_name_cn: string;
    class_name_en: string;
    upgrade_class: string;
    class_level: string;
    class_type: string;
    status: string;
    updateBy: string;
    updateAt: Date;
    description: string;
};

export type Teacher = {
    teacher_id: number;
    name: string;
    status: string;
    num_classes: number;
    phone: string;
    email: string;
    last_login: Date;
    user_name: string;
};

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
};

export type Student = {
    family_id: number;
    reistration_number: number;
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
}

export type Classroom = {
    room_id: number;
    classroom_name: string;
    seats: number;
    status: string;
    notes: string;
}

export type Feedback = {
    id: number;
    fid: number;
    name: string;
    phone: string;
    email: string;
    date: Date;
    feedback: string;
}

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
}



//Defining the columns for tables

export const classColumns: ColumnDef<Class>[] = [
    {
        header: "ID",
        accessorKey: "id",
    },
    {
        header: "Class Name (CN)",
        accessorKey: "class_name_cn",
    },
    {
        header: "Class Name (EN)",
        accessorKey: "class_name_en",
    },
    {
        header: "Upgrade Class",
        accessorKey: "upgrade_class",
    },
    {
        header: "Class Level",
        accessorKey: "class_level",
    },
    {
        header: "Status",
        accessorKey: "status",
    },
    {
        header: "Update By",
        accessorKey: "updateBy",
    },
    {
        header: "Update At",
        accessorKey: "updateAt",
        cell: ({ row }) => formatDate(row.original.updateAt),
    },    
    {
        header: "Description",
        accessorKey: "description",
    },
]

export const studentColumns: ColumnDef<Student>[] = [
    {
        header: "Family ID",
        accessorKey: "family_id",
    },
    {
        header: "Registration Number",
        accessorKey: "reistration_number",
    },
    {
        header: "Name",
        accessorKey: "name_en",
    },
    {
        header: "Name",
        accessorKey: "name_cn",
    },
    {
        header: "Gender",
        accessorKey: "gender",
    },
    {
        header: "Age",
        accessorKey: "age",
    },
    {
        header: "DOB",
        accessorKey: "dob",
        cell: ({ row }) => formatDate(row.original.dob),
    },
    {
        header: "Semester",
        accessorKey: "semester",
    },
    {
        header: "Teacher",
        accessorKey: "teacher",
    },
    {
        header: "Period",
        accessorKey: "period",
    },
    {
        header: "Status",
        accessorKey: "status",
    },
    {
        header: "Course",
        accessorKey: "course",
    },
    {
        header: "Phone",
        accessorKey: "phone",
    },
    {
        header: "Email",
        accessorKey: "email",
    },    
]

export const parentColumns: ColumnDef<Parent>[] = [
    {
        header: "Name",
        accessorKey: "name_en",
    },
    {
        header: "Email",
        accessorKey: "email",
    },
    {
        header: "Phone",
        accessorKey: "phone",
    },
    {
        header: "City",
        accessorKey: "city",
    },
    {
        header: "Zip",
        accessorKey: "zip",
    },
    {
        header: "Status",
        accessorKey: "status",
    },
    {
        header: "Last Login",
        accessorKey: "last_login",
        cell: ({ row }) => formatDate(row.original.last_login),
    },
]



export const teacherColumns: ColumnDef<Teacher>[] = [
    {
        header: "Name",
        accessorKey: "name",
    },
    {
        header: "Status",
        accessorKey: "status",
    },
    {
        header: "Num Classes",
        accessorKey: "num_classes",
    },
    {
        header: "Phone",
        accessorKey: "phone",
    },
    {
        header: "Email",
        accessorKey: "email",
    },
    {
        header: "Last Login",
        accessorKey: "last_login",
        cell: ({ row }) => formatDate(row.original.last_login),
    },
    {
        header: "User Name",
        accessorKey: "user_name",
    },
]

export const classroomColumns: ColumnDef<Classroom>[] = [
    {
        header: "Room ID",
        accessorKey: "room_id",
    },
    {
        header: "Classroom Name",
        accessorKey: "classroom_name",
    },
    {
        header: "Seats",
        accessorKey: "seats",
    },
    {
        header: "Status",
        accessorKey: "status",
    },
    {
        header: "Notes",
        accessorKey: "notes",
    },
]

export const feedbackColumns: ColumnDef<Feedback>[] = [
    {
        header: "Name",
        accessorKey: "name",
    },
    {
        header: "Phone",
        accessorKey: "phone",
    },
    {
        header: "Email",
        accessorKey: "email",
    },
    {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => formatDate(row.original.date),
    },
    {
        header: "Feedback",
        accessorKey: "feedback",
    },
]

export const transactionsColumns: ColumnDef<Transactions>[] = [
    {
        header: "Father Name",
        accessorKey: "father_name",
    },
    {
        header: "Mother Name",
        accessorKey: "mother_name",
    },
    {
        header: "Phone",
        accessorKey: "phone",
    },
    {
        header: "Amount",
        accessorKey: "amount",
    },
    {
        header: "Issued Date",
        accessorKey: "issued_date",
        cell: ({ row }) => formatDate(row.original.issued_date),
    },
    {
        header: "Issued By",
        accessorKey: "issued_by",
    },
    {
        header: "Status",
        accessorKey: "status",
    },
    {
        header: "Balance ID",
        accessorKey: "balanceid",
    },
    {
        header: "Memo",
        accessorKey: "memo",
    },
]