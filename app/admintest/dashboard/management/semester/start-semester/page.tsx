import { db } from "@/app/lib/db";
import { arrangement, classes, teacher, classrooms } from "@/app/lib/db/schema";
import SemesterClasses from "@/components/add-semester-classes" 
import { sql, eq } from "drizzle-orm";

export type classEditor = {
    classnamecn: string;
    teacher: string;
    classroom: string;
    totalPrice: string;
    isEditing: boolean;
}

export type classExpanded = {
    summary: classEditor;
    tuition: number;
    book_fee: number; 
    seat_limit: number;
    agelimit: string;
    class_time: string;
}

export default async function StartSemesterPage() {
    const drafts: classExpanded[] = await db.transaction(async (tx) => {
        const maxSeasonId = await tx
            .select({ maxId: sql<number>`MAX(${arrangement.seasonid})` })
            .from(arrangement);

        const lastSeasonRows = await tx
            .select()
            .from(arrangement)
            .where(eq(arrangement.seasonid, maxSeasonId[0].maxId));
        
        const extractedData = lastSeasonRows.map((row) => ({
            classid: row.classid,
            teacherid: row.teacherid,
            tuition: row.tuitionW,
            book_fee: row.bookfeeW,
            classroom: row.roomid,
            seat_limit: row.seatlimit,
            agelimit: row.agelimit,
            class_time: row.timeid
        }));
        
        const classWithNames = await Promise.all(
            extractedData.map(async (row) => {
                const classResult = await tx
                    .select({ classnamecn: classes.classnamecn })
                    .from(classes)
                    .where(eq(classes.classid, row.classid));
                const teacherResult = await tx
                    .select({ namecn: teacher.namecn})
                    .from(teacher)
                    .where(eq(teacher.teacherid, row.teacherid))
                
                const classroomResult = await tx
                    .select({ classroom: classrooms.roomno})
                    .from(classrooms)
                    .where(eq(classrooms.roomid, row.classroom));   
                
                
                
                const tuitionNum = parseFloat(row.tuition || '0');
                const bookFeeNum = parseFloat(row.book_fee || '0');
                
                return {
                    summary: {
                        classnamecn: classResult[0]?.classnamecn || '',
                        teacher: teacherResult[0]?.namecn || '',
                        classroom: classroomResult[0]?.classroom || '',
                        totalPrice: (tuitionNum + bookFeeNum).toString(),
                        isEditing: false
                    },
                    tuition: tuitionNum,
                    book_fee: bookFeeNum,
                    seat_limit: row.seat_limit || 0,
                    agelimit: row.agelimit?.toString() || '',
                    class_time: row.class_time.toString()
                };
            })
        );

        return classWithNames;
    });


    
    
    return (
        <div className="container mx-auto w-3/4">

            <SemesterClasses drafts={drafts.map(d => d.summary)} />
        </div>
    )
}