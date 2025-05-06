import { db } from "./db";

//Get all classes
export async function getAllClasses() {
    const classes = await db.query(
        "SELECT * FROM classes"
    );
    return classes.rows;
}

//Get all teachers
export async function getAllTeachers() {
    const teachers = await db.query(
        "SELECT * FROM teachers"
    );
    return teachers.rows;
}

//Get all parents
export async function getAllParents() {
    const parents = await db.query(
        "SELECT * FROM parents"
    );
    return parents.rows;
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
    const transactions = await db.query(
        "SELECT * FROM transactions"
    );
    return transactions.rows;
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
    const feedbacks = await db.query(
        "SELECT * FROM feedbacks"
    );
    return feedbacks.rows;
}

