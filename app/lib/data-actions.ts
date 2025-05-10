import { Class, Teacher, Parent, Feedback, Transactions, formatDate } from "../admintest/components/columns/column-types";
import { db } from "./db";

//Get all classes
export async function getAllClasses({ page = 1, pageSize = 10, query = "" }: { 
    page?: number; 
    pageSize?: number; 
    query?: string;
} = {}) {
    // In a real implementation, you would use a database query with LIMIT and OFFSET
    // const classes = await db.query(
    //     "SELECT * FROM classes LIMIT $1 OFFSET $2",
    //     [pageSize, (page - 1) * pageSize]
    // );
    // const countResult = await db.query("SELECT COUNT(*) FROM classes");
    // return { 
    //     classes: classes.rows,
    //     totalCount: parseInt(countResult.rows[0].count)
    // };

    //mock data:
    const mockClasses: Class[] = [
        {
            id: 1,
            class_name_cn: "Class 1",
            class_name_en: "Class 1",
            upgrade_class: "Class 2",
            class_level: "Class 1",
            class_type: "MLP",
            status: "Active",
            update_by: "admin",
            update_at: new Date(),
            description: "Notes 1",
        },
        {
            id: 2,
            class_name_cn: "Class 2",
            class_name_en: "Class 2",
            upgrade_class: "Class 2",
            class_level: "Class 2",
            class_type: "Class 2",
            status: "Inactive",
            update_by: "admin",
            update_at: new Date(),
            description: "Notes 2",
        },
        {
            id: 3,
            class_name_cn: "中文课",
            class_name_en: "Chinese Class",
            upgrade_class: "Class 3",
            class_level: "Class 3",
            class_type: "Class 3",
            status: "Active",
            update_by: "admin",
            update_at: new Date(),
            description: "Notes 3",
        },
        {
            id: 4,
            class_name_cn: "英文课",
            class_name_en: "English Class",
            upgrade_class: "Class 4",
            class_level: "Class 4",
            class_type: "Class 4",
            status: "Inactive",
            update_by: "admin",
            update_at: new Date(),
            description: "Notes 4",
        },
        {
            id: 5,
            class_name_cn: "数学课",
            class_name_en: "Math Class",
            upgrade_class: "Class 5",
            class_level: "Class 5",
            class_type: "Class 5",
            status: "Active",
            update_by: "admin",
            update_at: new Date(),
            description: "Notes 5",
        },
    ];
    
    // Pre-format dates for all classes
    mockClasses.forEach(classItem => {
        classItem.formatted_update_at = formatDate(classItem.update_at);
    });
    
    // Filter classes if query is provided
    let filteredClasses = mockClasses;
    if (query != "") {
        const lowercaseQuery = query.toLowerCase();
        filteredClasses = mockClasses.filter(classItem => 
            classItem.class_name_en.toLowerCase().includes(lowercaseQuery) ||
            classItem.class_name_cn.toLowerCase().includes(lowercaseQuery) ||
            classItem.class_type.toLowerCase().includes(lowercaseQuery)
        );
    }
    
    // Calculate pagination
    const totalCount = filteredClasses.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedClasses = filteredClasses.slice(startIndex, endIndex);
    return {
        classes: paginatedClasses,
        totalCount
    };
}

//Get all teachers
export async function getAllTeachers() {
    // const teachers = await db.query(
    //     "SELECT * FROM teachers"
    // );
    // return teachers.rows;
    
    // Mock data for teachers
    const mockTeachers: Teacher[] = [
        {
            teacher_id: 1,
            name: "Teacher 1",
            status: "Active",
            num_classes: 3,
            phone: "123-456-7890",
            email: "teacher1@example.com",
            last_login: new Date(),
            user_name: "teacher1",
        },
        {
            teacher_id: 2,
            name: "Teacher 2",
            status: "Inactive",
            num_classes: 1,
            phone: "987-654-3210",
            email: "teacher2@example.com",
            last_login: new Date(),
            user_name: "teacher2",
        }
    ];
    
    // Pre-format dates
    mockTeachers.forEach(teacher => {
        teacher.formatted_last_login = formatDate(teacher.last_login);
    });
    
    return mockTeachers;
}

//Get all parents
export async function getAllParents() {
    // const parents = await db.query(
    //     "SELECT * FROM parents"
    // );
    // return parents.rows;
    
    // Mock data for parents
    const mockParents: Parent[] = [
        {
            id: 1,
            name_en: "Parent 1",
            name_cn: "家长 1",
            email: "parent1@example.com",
            phone: "123-456-7890",
            city: "City 1",
            zip: "12345",
            status: "Active",
            last_login: new Date(),
        },
        {
            id: 2,
            name_en: "Parent 2",
            name_cn: "家长 2",
            email: "parent2@example.com",
            phone: "987-654-3210",
            city: "City 2",
            zip: "54321",
            status: "Inactive",
            last_login: new Date(),
        }
    ];
    
    // Pre-format dates
    mockParents.forEach(parent => {
        parent.formatted_last_login = formatDate(parent.last_login);
    });
    
    return mockParents;
}

//Get all registrations
export async function getAllRegistrations() {
    const registrations = await db.query(
        "SELECT * FROM registrations"
    );
    return registrations.rows;
}

//Get all transactions
export async function getAllTransactions() {
    // const transactions = await db.query(
    //     "SELECT * FROM transactions"
    // );
    // return transactions.rows;
    
    // Mock data for transactions
    const mockTransactions: Transactions[] = [
        {
            fid: 1,
            father_name: "Father 1",
            mother_name: "Mother 1",
            phone: "123-456-7890",
            amount: 100,
            issued_date: new Date(),
            issued_by: "Admin",
            status: "Paid",
            balanceid: 1,
            memo: "Memo 1",
        },
        {
            fid: 2,
            father_name: "Father 2",
            mother_name: "Mother 2",
            phone: "987-654-3210",
            amount: 200,
            issued_date: new Date(),
            issued_by: "Admin",
            status: "Unpaid",
            balanceid: 2,
            memo: "Memo 2",
        }
    ];
    
    // Pre-format dates
    mockTransactions.forEach(transaction => {
        transaction.formatted_issued_date = formatDate(transaction.issued_date);
    });
    
    return mockTransactions;
}

//Get all classrooms
export async function getAllClassrooms() {
    const classrooms = await db.query(
        "SELECT * FROM classrooms"
    );
    return classrooms.rows;
}

//Get all feedbacks
export async function getAllFeedbacks() {
    // const feedbacks = await db.query(
    //     "SELECT * FROM feedbacks"
    // );
    // return feedbacks.rows;
    
    // Mock data for feedbacks
    const mockFeedbacks: Feedback[] = [
        {
            id: 1,
            fid: 1,
            name: "Feedback 1",
            phone: "123-456-7890",
            email: "feedback1@example.com",
            date: new Date(),
            feedback: "Feedback 1",
        },
        {
            id: 2,
            fid: 2,
            name: "Feedback 2",
            phone: "987-654-3210",
            email: "feedback2@example.com",
            date: new Date(),
            feedback: "Feedback 2",
        }
    ];
    
    // Pre-format dates
    mockFeedbacks.forEach(feedback => {
        feedback.formatted_date = formatDate(feedback.date);
    });
    
    return mockFeedbacks;
}

